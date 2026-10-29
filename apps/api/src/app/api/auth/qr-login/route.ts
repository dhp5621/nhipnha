import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { dataRepository } from '@/db';
import {
  LOCKED_MESSAGE,
  hashToken,
  isLocked,
  issueSession,
  registerLoginFailure,
  registerLoginSuccess,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

function fail(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status });
}

function sameHash(a: string, b: string | undefined): boolean {
  if (!b) return false;
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  return bufA.length === bufB.length && bufA.length > 0 && timingSafeEqual(bufA, bufB);
}

/** Accepts the scanned QR text ({"type":"login",...}) or { memberId, secret }. */
function readCredentials(body: any): { memberId: string; secret: string } | null {
  let source: any = body;
  if (typeof body.payload === 'string') {
    try {
      source = JSON.parse(body.payload);
    } catch {
      return null;
    }
  } else if (body.payload && typeof body.payload === 'object') {
    source = body.payload;
  }
  if (source?.type && source.type !== 'login') return null;
  const memberId = typeof source?.memberId === 'string' ? source.memberId.trim() : '';
  const secret = typeof source?.secret === 'string' ? source.secret.trim() : '';
  return memberId && secret ? { memberId, secret } : null;
}

// POST: sign in by scanning the member's personal login QR.
// The QR works on any device, so it must be kept private; the owner can regenerate it
// at any time, and every sign-in is limited to MAX_SESSIONS_PER_MEMBER devices.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const creds = readCredentials(body);
    const invalid = () => fail(401, 'Mã QR đăng nhập không hợp lệ hoặc đã bị thay thế.');
    if (!creds) return invalid();

    const member = await dataRepository.getMember(creds.memberId);
    const secrets = member ? await dataRepository.getSecrets(member.id) : undefined;
    if (!member || !secrets) return invalid();

    if (isLocked(secrets)) return fail(429, LOCKED_MESSAGE);

    if (!sameHash(hashToken(creds.secret), secrets.qrSecretHash)) {
      await registerLoginFailure(member.id, secrets);
      return invalid();
    }

    const family = await dataRepository.getFamily(member.familyId);
    if (!family) return invalid();

    await registerLoginSuccess(member.id, secrets);
    const deviceLabel = typeof body.deviceLabel === 'string' ? body.deviceLabel : undefined;
    const token = await issueSession(member.id, deviceLabel);
    return NextResponse.json({
      success: true,
      family,
      member,
      token,
      hasPassword: !!secrets.passwordHash,
    });
  } catch (err: any) {
    return fail(500, err?.message || 'Không thể đăng nhập bằng mã QR');
  }
}
