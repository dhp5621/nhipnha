import { NextResponse } from 'next/server';
import { dataRepository, DEMO_PROTECTED_MEMBER_IDS } from '@/db';
import {
  authenticate,
  hashPassword,
  normalizeEmail,
  validatePassword,
  verifyPassword,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

function fail(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status });
}

// GET: returns the signed-in member's account status (email, hasPassword, activeSessions)
export async function GET(request: Request) {
  const familyId = new URL(request.url).searchParams.get('familyId');
  const auth = await authenticate(request, familyId);
  if (!auth.ok) return auth.response;

  if (!auth.member) {
    return fail(401, 'Không xác định được tài khoản đang đăng nhập.');
  }

  const secrets = await dataRepository.getSecrets(auth.member.id);
  const activeSessions = await dataRepository.countSessions(auth.member.id);

  return NextResponse.json({
    success: true,
    email: secrets.email,
    hasPassword: !!secrets.passwordHash,
    activeSessions,
  });
}

// PATCH: change the signed-in member's own password (and optionally email if owner)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { familyId, currentPassword, newPassword, email } = body;
    const auth = await authenticate(request, familyId);
    if (!auth.ok) return auth.response;

    if (!auth.member) {
      return fail(401, 'Không xác định được tài khoản đang đăng nhập.');
    }

    if (auth.isDemo && DEMO_PROTECTED_MEMBER_IDS.includes(auth.member.id)) {
      return fail(403, 'Tài khoản mẫu của bản demo không thể đổi mật khẩu.');
    }

    const secrets = await dataRepository.getSecrets(auth.member.id);

    // If the member already has a password, require currentPassword
    if (secrets.passwordHash) {
      if (!verifyPassword(String(currentPassword || ''), secrets.passwordHash)) {
        return fail(403, 'Mật khẩu hiện tại không đúng.');
      }
    } else if (!auth.member.isOwner) {
      // Non-owner members without email/password set by the owner cannot self-assign email/password
      return fail(
        403,
        'Chủ nhà chưa cấp email và mật khẩu cho tài khoản này. Vui lòng nhờ chủ nhà thiết lập.'
      );
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) return fail(400, passwordError);

    let nextEmail = secrets.email;
    if (email !== undefined && String(email).trim() !== '') {
      const normalized = normalizeEmail(email);
      if (!normalized) return fail(400, 'Email không hợp lệ.');
      const existingOwner = await dataRepository.findMemberIdByEmail(normalized);
      if (existingOwner && existingOwner !== auth.member.id) {
        return fail(409, 'Email này đã được sử dụng cho tài khoản khác.');
      }
      nextEmail = normalized;
    }

    if (!nextEmail) {
      return fail(400, 'Cần có địa chỉ email đi kèm khi thiết lập mật khẩu.');
    }

    await dataRepository.setSecrets(auth.member.id, {
      email: nextEmail,
      passwordHash: hashPassword(String(newPassword)),
      failedLogins: 0,
      lockedUntil: undefined,
    });

    // Sign out other devices when password changes, keeping the current device
    if (auth.tokenHash) {
      await dataRepository.deleteSessions(auth.member.id, auth.tokenHash);
    }

    return NextResponse.json({
      success: true,
      email: nextEmail,
      hasPassword: true,
    });
  } catch (err: any) {
    return fail(500, err?.message || 'Không thể cập nhật mật khẩu');
  }
}
