import { NextResponse } from 'next/server';
import { dataRepository } from '@/db';
import { authenticate, generateInviteCode, requireOwner } from '@/lib/auth';
import {
  INVITE_DEFAULT_TTL_HOURS,
  INVITE_TTL_OPTIONS_HOURS,
  isRole,
  type FamilyInvite,
  type QRPairingPayload,
} from '@nhipnha/shared';

export const dynamic = 'force-dynamic';

function fail(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status });
}

// GET: owner lists the invitations of the family
export async function GET(request: Request) {
  const familyId = new URL(request.url).searchParams.get('familyId');
  const auth = await authenticate(request, familyId);
  if (!auth.ok) return auth.response;
  const denied = requireOwner(auth);
  if (denied) return denied;

  const invites = await dataRepository.listInvites(familyId!);
  return NextResponse.json({ success: true, data: invites });
}

// POST: owner creates a single-use invite with a fixed role
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { familyId } = body;
    const auth = await authenticate(request, familyId);
    if (!auth.ok) return auth.response;
    const denied = requireOwner(auth);
    if (denied) return denied;

    if (!isRole(body.role)) return fail(400, 'Vui lòng chọn vai trò cho thành viên mới.');

    const ttlHours = INVITE_TTL_OPTIONS_HOURS.includes(Number(body.ttlHours))
      ? Number(body.ttlHours)
      : INVITE_DEFAULT_TTL_HOURS;
    const memberName =
      typeof body.memberName === 'string' ? body.memberName.trim().slice(0, 60) : '';

    const family = await dataRepository.getFamily(familyId);
    if (!family) return fail(404, 'Không tìm thấy gia đình.');

    const now = Date.now();
    const invite: FamilyInvite = {
      id: `inv_${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      familyId,
      code: generateInviteCode(),
      role: body.role,
      memberName: memberName || undefined,
      createdBy: auth.member!.id,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + ttlHours * 3600 * 1000).toISOString(),
    };

    await dataRepository.createInvite(invite);

    // The text a QR image should encode; the app can render it as a QR code
    const qrPayload: QRPairingPayload = {
      version: '1.0',
      app: 'nhipnha',
      familyId,
      familyCode: invite.code,
      familyName: family.name,
      token: '',
      suggestedRole: invite.role,
      suggestedName: invite.memberName,
      inviteCode: invite.code,
      generatedAt: now,
    };

    return NextResponse.json({ success: true, data: invite, qrPayload });
  } catch (err: any) {
    return fail(500, err?.message || 'Không thể tạo mã mời');
  }
}

// DELETE: owner revokes an unused invite
export async function DELETE(request: Request) {
  const params = new URL(request.url).searchParams;
  const familyId = params.get('familyId');
  const inviteId = params.get('inviteId');
  const auth = await authenticate(request, familyId);
  if (!auth.ok) return auth.response;
  const denied = requireOwner(auth);
  if (denied) return denied;

  if (!inviteId) return fail(400, 'Thiếu mã lời mời.');
  const revoked = await dataRepository.revokeInvite(familyId!, inviteId);
  if (!revoked) return fail(404, 'Không tìm thấy lời mời còn hiệu lực để thu hồi.');
  return NextResponse.json({ success: true });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-family-id, x-member-id',
    },
  });
}
