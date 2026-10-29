import { NextResponse } from 'next/server';
import { memoryStore } from '@/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get('memberId');
  const familyId = searchParams.get('familyId');

  if (memberId) {
    const member = memoryStore.getMember(memberId);
    if (!member) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy thành viên' }, { status: 404 });
    }
    const family = memoryStore.getFamily(member.familyId);
    const familyMembers = memoryStore.getMembers(member.familyId);
    return NextResponse.json({
      success: true,
      member,
      family,
      familyMembers,
    });
  }

  if (familyId) {
    const family = memoryStore.getFamily(familyId);
    if (!family) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy gia đình' }, { status: 404 });
    }
    const familyMembers = memoryStore.getMembers(familyId);
    return NextResponse.json({
      success: true,
      family,
      familyMembers,
    });
  }

  // Fallback demo session
  const defaultMember = memoryStore.getMember('mem_child_an');
  const defaultFamily = memoryStore.getFamily('fam_dongthap_001');
  const members = defaultFamily ? memoryStore.getMembers(defaultFamily.id) : [];

  return NextResponse.json({
    success: true,
    member: defaultMember,
    family: defaultFamily,
    familyMembers: members,
  });
}
