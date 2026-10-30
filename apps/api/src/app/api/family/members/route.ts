import { NextResponse } from 'next/server';
import { dataRepository, DEMO_PROTECTED_MEMBER_IDS } from '@/db';
import {
  authenticate,
  buildLoginPayload,
  generateQrSecret,
  hashPassword,
  hashToken,
  normalizeEmail,
  requireOwner,
  validatePassword,
  verifyPassword,
} from '@/lib/auth';
import { isRole, type Member, type Role } from '@nhipnha/shared';

export const dynamic = 'force-dynamic';

const MAX_FAMILY_MEMBERS = 20;

const DEFAULT_NAMES: Record<Role, string> = {
  CHILD: 'Con',
  PARENT: 'Bố / Mẹ',
  GRANDPARENT: 'Ông / Bà',
};

function fail(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status });
}

function cleanName(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 60) : '';
}

/**
 * Validates an email + password pair. Returns the values to store, or an error response.
 * An email without a password (or the other way round) is never accepted.
 */
async function readCredentialPair(
  body: { email?: unknown; password?: unknown },
  currentMemberId?: string
): Promise<{ email: string; passwordHash: string } | NextResponse> {
  const normalized = normalizeEmail(body.email);
  if (!normalized) return fail(400, 'Email không hợp lệ.');
  const passwordError = validatePassword(body.password);
  if (passwordError) return fail(400, passwordError);
  const owner = await dataRepository.findMemberIdByEmail(normalized);
  if (owner && owner !== currentMemberId) {
    return fail(409, 'Email này đã được sử dụng cho tài khoản khác.');
  }
  return { email: normalized, passwordHash: hashPassword(body.password as string) };
}

// GET: every member can see who is in the family. Emails are only visible to the owner
// (for everyone) and to each member (for themself).
export async function GET(request: Request) {
  const familyId = new URL(request.url).searchParams.get('familyId');
  const auth = await authenticate(request, familyId);
  if (!auth.ok) return auth.response;

  const members = await dataRepository.getMembers(familyId!);
  const summaries = await dataRepository.getCredentialSummaries(familyId!);
  const viewerIsOwner = !!auth.member?.isOwner;

  const data: Member[] = members.map((m) => {
    const info = summaries.get(m.id);
    const visible = viewerIsOwner || auth.member?.id === m.id;
    return visible ? { ...m, email: info?.email, hasPassword: !!info?.hasPassword } : m;
  });
  return NextResponse.json({ success: true, data });
}

// POST: the owner adds a member directly (custom name, role and optional email + password)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const auth = await authenticate(request, body.familyId);
    if (!auth.ok) return auth.response;
    const denied = requireOwner(auth);
    if (denied) return denied;

    if (!isRole(body.role)) return fail(400, 'Vui lòng chọn vai trò cho thành viên.');
    const name = cleanName(body.name) || DEFAULT_NAMES[body.role as Role];

    const existing = await dataRepository.getMembers(body.familyId);
    if (existing.length >= MAX_FAMILY_MEMBERS) {
      return fail(400, `Mỗi gia đình tối đa ${MAX_FAMILY_MEMBERS} thành viên.`);
    }

    // Email and password come as a pair; leave both empty for a QR-only account
    const hasEmail = typeof body.email === 'string' && body.email.trim() !== '';
    const hasPassword = typeof body.password === 'string' && body.password !== '';
    if (hasEmail !== hasPassword) {
      return fail(400, 'Cần nhập cả email và mật khẩu, hoặc bỏ trống cả hai.');
    }
    let credentials: { email: string; passwordHash: string } | undefined;
    if (hasEmail) {
      const pair = await readCredentialPair(body);
      if (pair instanceof NextResponse) return pair;
      credentials = pair;
    }

    const member = await dataRepository.saveMember({
      id: `mem_${(body.role as string).toLowerCase()}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`,
      familyId: body.familyId,
      name,
      role: body.role,
      isOwner: false,
      createdAt: new Date().toISOString(),
    });

    const qrSecret = generateQrSecret();
    await dataRepository.setSecrets(member.id, {
      qrSecretHash: hashToken(qrSecret),
      ...(credentials ?? {}),
    });

    return NextResponse.json({
      success: true,
      member: { ...member, email: credentials?.email, hasPassword: !!credentials },
      loginCode: buildLoginPayload(member.id, qrSecret),
    });
  } catch (err: any) {
    return fail(500, err?.message || 'Không thể thêm thành viên');
  }
}

// PATCH: rename, change role or manage access of a member.
//  - role / credentials / QR / devices of someone else: owner only
//  - display name: owner, or the member themself
//  - own password and email: use /api/account (needs the current password)
export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const searchParams = new URL(request.url).searchParams;
    const familyId = body.familyId || searchParams.get('familyId');
    const memberId = body.memberId || searchParams.get('memberId');
    const auth = await authenticate(request, familyId);
    if (!auth.ok) return auth.response;

    if (!memberId) return fail(400, 'Thiếu mã thành viên.');
    const target = await dataRepository.getMember(memberId);
    if (!target || target.familyId !== familyId) return fail(404, 'Không tìm thấy thành viên trong gia đình.');
    if (auth.isDemo && DEMO_PROTECTED_MEMBER_IDS.includes(target.id)) {
      return fail(403, 'Tài khoản mẫu của bản demo không thể chỉnh sửa.');
    }
    const isSelf = auth.member?.id === target.id;

    // --- Access management actions ---
    if (body.action === 'regenerate_qr' || body.action === 'sign_out_devices') {
      const denied = requireOwner(auth);
      if (denied) return denied;

      if (isSelf && !auth.isDemo) {
        // Rotating your own access keeps this device signed in, but proves who you are first
        const secrets = await dataRepository.getSecrets(target.id);
        if (secrets.passwordHash && !verifyPassword(String(body.currentPassword || ''), secrets.passwordHash)) {
          return fail(403, 'Mật khẩu hiện tại không đúng.');
        }
      }
      const keep = isSelf ? auth.tokenHash : undefined;

      if (body.action === 'sign_out_devices') {
        await dataRepository.deleteSessions(target.id, keep);
        return NextResponse.json({ success: true });
      }

      const qrSecret = generateQrSecret();
      await dataRepository.setSecrets(target.id, { qrSecretHash: hashToken(qrSecret), failedLogins: 0, lockedUntil: undefined });
      // A replaced QR means the old one may have leaked, so old sign-ins are closed too
      await dataRepository.deleteSessions(target.id, keep);
      return NextResponse.json({ success: true, loginCode: buildLoginPayload(target.id, qrSecret) });
    }

    if (body.action === 'set_credentials' || body.action === 'clear_credentials') {
      const denied = requireOwner(auth);
      if (denied) return denied;
      if (isSelf) {
        return fail(400, 'Hãy đổi email và mật khẩu của chính bạn trong mục Tài khoản & bảo mật.');
      }

      if (body.action === 'clear_credentials') {
        await dataRepository.setSecrets(target.id, { email: undefined, passwordHash: undefined });
      } else {
        const pair = await readCredentialPair(body, target.id);
        if (pair instanceof NextResponse) return pair;
        await dataRepository.setSecrets(target.id, { ...pair, failedLogins: 0, lockedUntil: undefined });
      }
      // New credentials mean old sign-ins are no longer trusted
      await dataRepository.deleteSessions(target.id);
      return NextResponse.json({ success: true });
    }

    // --- Role / name ---
    const patch: { name?: string; role?: Role } = {};

    if (body.role !== undefined) {
      const denied = requireOwner(auth);
      if (denied) return denied;
      if (!isRole(body.role)) return fail(400, 'Vai trò không hợp lệ.');
      patch.role = body.role;
    }

    if (body.name !== undefined) {
      const name = cleanName(body.name);
      if (!name) return fail(400, 'Tên không được để trống.');
      if (!isSelf) {
        const denied = requireOwner(auth);
        if (denied) return denied;
      }
      patch.name = name;
    }

    if (patch.role === undefined && patch.name === undefined) {
      return fail(400, 'Không có thay đổi nào để lưu.');
    }

    const updated = await dataRepository.updateMember(target.id, patch);
    return NextResponse.json({ success: true, member: updated });
  } catch (err: any) {
    return fail(500, err?.message || 'Không thể cập nhật thành viên');
  }
}

// DELETE: the owner removes a member, or a non-owner member leaves the family
export async function DELETE(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const familyId = params.get('familyId');
    const memberId = params.get('memberId');
    const auth = await authenticate(request, familyId);
    if (!auth.ok) return auth.response;

    if (!memberId) return fail(400, 'Thiếu mã thành viên.');
    const target = await dataRepository.getMember(memberId);
    if (!target || target.familyId !== familyId) return fail(404, 'Không tìm thấy thành viên trong gia đình.');
    if (auth.isDemo && DEMO_PROTECTED_MEMBER_IDS.includes(target.id)) {
      return fail(403, 'Tài khoản mẫu của bản demo không thể xóa.');
    }
    if (target.isOwner) {
      return fail(403, 'Không thể xóa chủ nhà khỏi gia đình.');
    }

    const isSelf = auth.member?.id === target.id;
    if (!isSelf) {
      const denied = requireOwner(auth);
      if (denied) return denied;
    }

    await dataRepository.deleteMember(target.id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return fail(500, err?.message || 'Không thể xóa thành viên');
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-family-id, x-member-id',
    },
  });
}
