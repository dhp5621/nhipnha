import { NextResponse } from 'next/server';
import { dataRepository } from '@/db';
import {
  LOCKED_MESSAGE,
  isLocked,
  issueSession,
  normalizeEmail,
  registerLoginFailure,
  registerLoginSuccess,
  verifyPassword,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

function fail(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status });
}

// POST: sign in with email + password. Accounts only have a password if the owner (or the
// member) set one together with an email.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    const deviceLabel = typeof body.deviceLabel === 'string' ? body.deviceLabel : undefined;

    const invalid = () => fail(401, 'Email hoặc mật khẩu không đúng.');
    if (!email || !password) return invalid();

    const memberId = await dataRepository.findMemberIdByEmail(email);
    const secrets = memberId ? await dataRepository.getSecrets(memberId) : undefined;

    if (memberId && secrets && isLocked(secrets)) return fail(429, LOCKED_MESSAGE);

    // verifyPassword runs even for unknown emails so timing does not reveal which exist
    const passwordOk = verifyPassword(password, secrets?.passwordHash);
    if (!memberId || !secrets || !passwordOk) {
      if (memberId && secrets) await registerLoginFailure(memberId, secrets);
      return invalid();
    }

    const member = await dataRepository.getMember(memberId);
    const family = member ? await dataRepository.getFamily(member.familyId) : undefined;
    if (!member || !family) return invalid();

    await registerLoginSuccess(memberId, secrets);
    const token = await issueSession(memberId, deviceLabel);
    return NextResponse.json({ success: true, family, member, token, hasPassword: true });
  } catch (err: any) {
    return fail(500, err?.message || 'Không thể đăng nhập');
  }
}
