import { NextResponse } from 'next/server';
import { dataRepository } from '@/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get('memberId');
  const familyId = searchParams.get('familyId');

  if (memberId) {
    const member = await dataRepository.getMember(memberId);
    if (!member) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy thành viên' }, { status: 404 });
    }
    const family = await dataRepository.getFamily(member.familyId);
    const familyMembers = await dataRepository.getMembers(member.familyId);
    return NextResponse.json({
      success: true,
      member,
      family,
      familyMembers,
    });
  }

  if (familyId) {
    const family = await dataRepository.getFamily(familyId);
    if (!family) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy gia đình' }, { status: 404 });
    }
    const familyMembers = await dataRepository.getMembers(familyId);
    return NextResponse.json({
      success: true,
      family,
      familyMembers,
    });
  }

  return NextResponse.json(
    { success: false, error: 'Thiếu tham số familyId hoặc memberId' },
    { status: 400 }
  );
}
