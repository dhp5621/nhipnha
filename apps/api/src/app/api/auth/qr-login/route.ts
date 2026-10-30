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
  const candidate = body?.payload ?? body?.qrPayload ?? body;
  let source: any = candidate;
  if (typeof candidate === 'string') {
    try {
      source = JSON.parse(candidate);
    } catch {
      return null;
    }
  } else if (candidate && typeof candidate === 'object') {
    source = candidate;
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
    const rawLoginCode = typeof body.payload === 'string' ? body.payload : (typeof body.qrPayload === 'string' ? body.qrPayload : undefined);
    
    const payloadResult = {
      family,
      member,
      token,
      loginCode: rawLoginCode,
      hasPassword: !!secrets.passwordHash,
    };

    return NextResponse.json({
      success: true,
      data: payloadResult,
      ...payloadResult,
    });
  } catch (err: any) {
    return fail(500, err?.message || 'Không thể đăng nhập bằng mã QR');
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/auth/qr-login',
    methods: ['POST', 'OPTIONS'],
    description: 'Personal QR sign-in endpoint for Nhịp Nhà',
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
