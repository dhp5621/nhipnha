import { NextResponse } from 'next/server';
import { dataRepository } from '@/db';
import { authenticate } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Restores the signed-in member's session and the family roster.
// Requires the member's own credentials, so one member cannot read another's session.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get('memberId');
  const familyIdParam = searchParams.get('familyId');

  const member = memberId ? await dataRepository.getMember(memberId) : undefined;
  if (memberId && !member) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy thành viên' }, { status: 404 });
  }

  const familyId = member?.familyId || familyIdParam;
  if (!familyId) {
    return NextResponse.json(
      { success: false, error: 'Thiếu tham số familyId hoặc memberId' },
      { status: 400 }
    );
  }

  const auth = await authenticate(request, familyId);
  if (!auth.ok) return auth.response;

  const family = await dataRepository.getFamily(familyId);
  if (!family) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy gia đình' }, { status: 404 });
  }
  const familyMembers = await dataRepository.getMembers(familyId);

  return NextResponse.json({
    success: true,
    ...(member ? { member } : {}),
    family,
    familyMembers,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-family-id, x-member-id',
    },
  });
}
