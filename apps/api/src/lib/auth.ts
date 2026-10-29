import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { dataRepository, DEMO_FAMILY_ID, type MemberSecrets } from '@/db';
import type { Member } from '@nhipnha/shared';

// ---------- Tokens & codes ----------

/** 256-bit random session token handed to a device once, at sign-in time. */
export function generateMemberToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** 128-bit secret behind a member's QR login code. Shown once, only its hash is stored. */
export function generateQrSecret(): string {
  return randomBytes(16).toString('hex');
}

/** The text a login QR image encodes. */
export function buildLoginPayload(memberId: string, secret: string): string {
  return JSON.stringify({ app: 'nhipnha', type: 'login', memberId, secret });
}

// Unambiguous characters only (no 0/O, 1/I) so codes are easy to read out loud
const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateInviteCode(): string {
  const bytes = randomBytes(8);
  let code = '';
  for (let i = 0; i < bytes.length; i++) {
    code += INVITE_ALPHABET[bytes[i] % INVITE_ALPHABET.length]; // 256 % 32 === 0, no bias
  }
  return `MOI-${code}`;
}

// ---------- Passwords & emails ----------

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN) {
    return `Mật khẩu cần ít nhất ${PASSWORD_MIN} ký tự.`;
  }
  if (password.length > PASSWORD_MAX) return 'Mật khẩu quá dài.';
  return null;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt1$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string | undefined): boolean {
  // Always do the same amount of work, so response time does not reveal whether an account exists
  const parts = (stored || '').split('$');
  const valid = parts.length === 3 && parts[0] === 'scrypt1';
  const salt = Buffer.from(valid ? parts[1] : '00'.repeat(16), 'hex');
  const expected = Buffer.from(valid ? parts[2] : '00'.repeat(64), 'hex');
  const actual = scryptSync(password, salt, 64);
  return valid && expected.length === actual.length && timingSafeEqual(expected, actual);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Lowercased, trimmed email, or null when it is not a valid address. */
export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  return email.length <= 254 && EMAIL_RE.test(email) ? email : null;
}

// ---------- Sessions ----------

/** Signs a member in on one more device and returns the plain token (shown once). */
export async function issueSession(memberId: string, deviceLabel?: string): Promise<string> {
  const token = generateMemberToken();
  await dataRepository.createSession({
    id: `ses_${Date.now().toString(36)}${randomBytes(4).toString('hex')}`,
    memberId,
    tokenHash: hashToken(token),
    deviceLabel: deviceLabel ? deviceLabel.slice(0, 100) : undefined,
    createdAt: new Date().toISOString(),
  });
  return token;
}

// ---------- Brute-force protection ----------

const LOGIN_MAX_FAILURES = 5;
const LOGIN_LOCK_MINUTES = 15;

export function isLocked(secrets: MemberSecrets): boolean {
  return !!secrets.lockedUntil && new Date(secrets.lockedUntil).getTime() > Date.now();
}

export async function registerLoginFailure(memberId: string, secrets: MemberSecrets): Promise<void> {
  const failedLogins = secrets.failedLogins + 1;
  if (failedLogins >= LOGIN_MAX_FAILURES) {
    await dataRepository.setSecrets(memberId, {
      failedLogins: 0,
      lockedUntil: new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000).toISOString(),
    });
  } else {
    await dataRepository.setSecrets(memberId, { failedLogins });
  }
}

export async function registerLoginSuccess(memberId: string, secrets: MemberSecrets): Promise<void> {
  if (secrets.failedLogins !== 0 || secrets.lockedUntil) {
    await dataRepository.setSecrets(memberId, { failedLogins: 0, lockedUntil: undefined });
  }
}

export const LOCKED_MESSAGE = `Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${LOGIN_LOCK_MINUTES} phút.`;

// ---------- Request authentication ----------

export type AuthResult =
  | { ok: true; member: Member | null; isDemo: boolean; tokenHash?: string }
  | { ok: false; response: NextResponse };

function fail(status: number, error: string): AuthResult {
  return { ok: false, response: NextResponse.json({ success: false, error }, { status }) };
}

/**
 * Identifies the caller from `x-member-id` + `Authorization: Bearer <token>` and checks
 * that the token belongs to one of that member's signed-in devices and that the member
 * belongs to `familyId`.
 *
 * The public demo family is open (no token needed) so the demo button and the web
 * simulator keep working; the caller is still resolved when a member id is sent.
 */
export async function authenticate(request: Request, familyId: string | null | undefined): Promise<AuthResult> {
  if (!familyId) return fail(400, 'Thiếu mã định danh gia đình (familyId)');

  const memberId = request.headers.get('x-member-id')?.trim() || '';
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';

  if (familyId === DEMO_FAMILY_ID) {
    let member: Member | null = null;
    if (memberId) {
      const found = await dataRepository.getMember(memberId);
      if (found && found.familyId === familyId) member = found;
    }
    return { ok: true, member, isDemo: true };
  }

  if (!memberId || !token) {
    return fail(401, 'Bạn cần đăng nhập để thực hiện thao tác này.');
  }

  const tokenHash = hashToken(token);
  const member = await dataRepository.getMember(memberId);
  if (!member || !(await dataRepository.hasSession(memberId, tokenHash))) {
    return fail(401, 'Phiên đăng nhập không còn hiệu lực. Vui lòng đăng nhập lại.');
  }
  if (member.familyId !== familyId) {
    return fail(403, 'Bạn không thuộc gia đình này.');
  }
  return { ok: true, member, isDemo: false, tokenHash };
}

/** Owner-only guard used by every family management endpoint. */
export function requireOwner(auth: Extract<AuthResult, { ok: true }>): NextResponse | null {
  if (!auth.member?.isOwner) {
    return NextResponse.json(
      { success: false, error: 'Chỉ chủ nhà mới có quyền thực hiện thao tác này.' },
      { status: 403 }
    );
  }
  return null;
}
