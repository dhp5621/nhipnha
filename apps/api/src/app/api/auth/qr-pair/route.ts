import { NextResponse } from 'next/server';
import { dataRepository, DEMO_FAMILY_ID } from '@/db';
import {
  buildLoginPayload,
  generateQrSecret,
  hashPassword,
  hashToken,
  issueSession,
  normalizeEmail,
  validatePassword,
} from '@/lib/auth';
import { getInviteStatus, isRole, type Member, type QRPairingPayload, type Role } from '@nhipnha/shared';

export const dynamic = 'force-dynamic';

const DEFAULT_NAMES: Record<Role, string> = {
  CHILD: 'Con',
  PARENT: 'Bố / Mẹ',
  GRANDPARENT: 'Ông / Bà',
};

function fail(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status });
}

function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/** Accepts a raw code, or the JSON payload of a scanned QR, and returns the code inside. */
function extractCode(body: { code?: unknown; qrPayload?: unknown }): string {
  if (body.qrPayload) {
    try {
      const parsed: QRPairingPayload =
        typeof body.qrPayload === 'string' ? JSON.parse(body.qrPayload) : (body.qrPayload as QRPairingPayload);
      return String(parsed.inviteCode || parsed.familyCode || '').trim().toUpperCase();
    } catch {
      return String(body.qrPayload).trim().toUpperCase();
    }
  }
  return String(body.code || '').trim().toUpperCase();
}

/**
 * Gives a brand-new member their QR login secret and first signed-in device.
 * The plain token and login code are returned once and never stored.
 */
async function provisionAccess(member: Member, deviceLabel: string) {
  const qrSecret = generateQrSecret();
  await dataRepository.setSecrets(member.id, { qrSecretHash: hashToken(qrSecret) });
  const token = await issueSession(member.id, deviceLabel);
  return { token, loginCode: buildLoginPayload(member.id, qrSecret) };
}

/**
 * POST /api/auth/qr-pair
 *  - action "create": a new family is created and the caller becomes its owner. Email and
 *    password are optional (both or neither); the QR login code is always issued.
 *  - otherwise: join with an owner-generated invite code. The role comes from the invite,
 *    never from the client. The public demo family keeps its open code for testing.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const deviceLabel = cleanText(body.deviceLabel, 100) || 'Thiết bị mới';
    const deviceId = cleanText(body.deviceId, 100) || `dev_${Math.random().toString(36).slice(2, 8)}`;

    // 1. Create a new family. The creator is the owner (host) of the family.
    if (body.action === 'create' || body.action === 'generate') {
      const familyName = cleanText(body.familyName, 80);
      if (!familyName) return fail(400, 'Vui lòng đặt tên cho gia đình.');
      if (!isRole(body.memberRole)) return fail(400, 'Vai trò không hợp lệ.');

      // Email and password come as a pair
      const hasEmail = typeof body.email === 'string' && body.email.trim() !== '';
      const hasPassword = typeof body.password === 'string' && body.password !== '';
      if (hasEmail !== hasPassword) {
        return fail(400, 'Cần nhập cả email và mật khẩu, hoặc bỏ trống cả hai.');
      }
      let email: string | undefined;
      let passwordHash: string | undefined;
      if (hasEmail) {
        const normalized = normalizeEmail(body.email);
        if (!normalized) return fail(400, 'Email không hợp lệ.');
        const passwordError = validatePassword(body.password);
        if (passwordError) return fail(400, passwordError);
        if (await dataRepository.findMemberIdByEmail(normalized)) {
          return fail(409, 'Email này đã được sử dụng cho tài khoản khác.');
        }
        email = normalized;
        passwordHash = hashPassword(body.password);
      }

      const role: Role = body.memberRole;
      const memberName = cleanText(body.memberName, 60) || DEFAULT_NAMES[role];
      const familyId = `fam_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      const familyCode = `NHIP-${Math.floor(1000 + Math.random() * 9000)}${Math.random()
        .toString(36)
        .slice(2, 4)
        .toUpperCase()}`;

      const family = await dataRepository.saveFamily({
        id: familyId,
        code: familyCode,
        name: familyName,
        // The family itself is not joinable by code; members join through invites / login codes.
        qrPayload: JSON.stringify({ version: '1.0', app: 'nhipnha', familyId, familyName }),
        addressProvince: cleanText(body.addressProvince, 80) || 'Việt Nam',
        createdAt: new Date().toISOString(),
      });

      const member = await dataRepository.saveMember({
        id: `mem_${role.toLowerCase()}_${Date.now().toString(36)}`,
        familyId: family.id,
        name: memberName,
        role,
        isOwner: true,
        deviceId,
        createdAt: new Date().toISOString(),
      });
      if (email && passwordHash) {
        await dataRepository.setSecrets(member.id, { email, passwordHash });
      }

      const access = await provisionAccess(member, deviceLabel);
      return NextResponse.json({
        success: true,
        family,
        member,
        token: access.token,
        loginCode: access.loginCode,
        hasPassword: !!passwordHash,
      });
    }

    // 2. Join an existing family
    const code = extractCode(body);
    if (!code) return fail(400, 'Vui lòng nhập mã mời từ chủ nhà.');

    // 2a. Owner-generated invite: single use, fixed role, expires
    const invite = await dataRepository.getInviteByCode(code);
    if (invite) {
      const status = getInviteStatus(invite);
      if (status !== 'ACTIVE') {
        const reason =
          status === 'USED'
            ? 'Mã mời này đã được sử dụng.'
            : status === 'EXPIRED'
            ? 'Mã mời đã hết hạn. Hãy nhờ chủ nhà tạo mã mới.'
            : 'Mã mời đã bị chủ nhà thu hồi.';
        return fail(410, reason);
      }

      const family = await dataRepository.getFamily(invite.familyId);
      if (!family) return fail(404, 'Gia đình của mã mời này không còn tồn tại.');

      const memberName = invite.memberName || cleanText(body.memberName, 60) || DEFAULT_NAMES[invite.role];

      // Claim first: if two people race for the same code, only one wins
      const claimed = await dataRepository.claimInvite(invite.id, memberName);
      if (!claimed) return fail(410, 'Mã mời này vừa được người khác sử dụng.');

      const member = await dataRepository.saveMember({
        id: `mem_${invite.role.toLowerCase()}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`,
        familyId: family.id,
        name: memberName,
        role: invite.role,
        isOwner: false,
        deviceId,
        createdAt: new Date().toISOString(),
      });

      const access = await provisionAccess(member, deviceLabel);
      return NextResponse.json({
        success: true,
        message: 'Tham gia gia đình thành công!',
        family,
        member,
        token: access.token,
        loginCode: access.loginCode,
      });
    }

    // 2b. Public demo family: open code, role chosen freely, reuses the seeded accounts
    const demoFamily = await dataRepository.getFamilyByCode(code);
    if (demoFamily && demoFamily.id === DEMO_FAMILY_ID) {
      const role: Role = isRole(body.memberRole) ? body.memberRole : 'CHILD';
      const members = await dataRepository.getMembers(demoFamily.id);
      const seeded: Member | undefined = members.find((m) => m.role === role);
      if (!seeded) return fail(404, 'Không tìm thấy tài khoản demo cho vai trò này.');
      return NextResponse.json({
        success: true,
        message: 'Đã vào gia đình demo.',
        family: demoFamily,
        member: seeded,
        demo: true,
      });
    }

    return fail(404, 'Mã mời không hợp lệ. Hãy kiểm tra lại hoặc nhờ chủ nhà tạo mã mới.');
  } catch (err: any) {
    return fail(500, err?.message || 'Lỗi xử lý ghép đôi');
  }
}

// GET: Return active demo QR payload from database
export async function GET() {
  const demoFamily = await dataRepository.getFamily(DEMO_FAMILY_ID);
  return NextResponse.json({
    family: demoFamily,
    demoCode: demoFamily?.code || 'NHIP-8868',
    qrPayload: demoFamily?.qrPayload,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
