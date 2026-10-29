import { NextResponse } from 'next/server';
import { dataRepository } from '@/db';
import type { CheckIn } from '@nhipnha/shared';

export const dynamic = 'force-dynamic';

// POST: Save single or batch offline-synced check-ins to database
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Support offline batch sync
    if (Array.isArray(body.batch)) {
      const savedItems: CheckIn[] = [];
      for (const item of body.batch) {
        if (!item.familyId) continue;
        const checkIn: CheckIn = {
          id: item.id || `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          familyId: item.familyId,
          memberId: item.memberId || `mem_${Date.now()}`,
          memberName: item.memberName || 'Thành viên',
          rhythmType: item.rhythmType || 'MORNING',
          mood: item.mood,
          note: item.note,
          voiceDurationSec: item.voiceDurationSec,
          voiceUrl: item.voiceUrl,
          waveform: item.waveform,
          attachment: item.attachment,
          syncStatus: 'SYNCED',
          createdAt: item.createdAt || new Date().toISOString(),
        };
        await dataRepository.addCheckIn(checkIn);
        savedItems.push(checkIn);
      }

      return NextResponse.json({
        success: true,
        message: `Đồng bộ thành công ${savedItems.length} nhịp kết nối ngoại tuyến.`,
        data: savedItems,
      });
    }

    // Single check-in
    const {
      familyId,
      memberId,
      memberName,
      rhythmType,
      mood,
      note,
      voiceDurationSec,
      voiceUrl,
      waveform,
      attachment,
    } = body;

    if (!familyId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu mã định danh gia đình (familyId)' },
        { status: 400 }
      );
    }

    const checkIn: CheckIn = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      familyId,
      memberId: memberId || `mem_${Date.now()}`,
      memberName: memberName || 'Thành viên',
      rhythmType: rhythmType || 'MORNING',
      mood,
      note,
      voiceDurationSec,
      voiceUrl,
      waveform,
      attachment,
      syncStatus: 'SYNCED',
      createdAt: new Date().toISOString(),
    };

    await dataRepository.addCheckIn(checkIn);

    return NextResponse.json({
      success: true,
      message: 'Nhịp kết nối đã được ghi nhận vào cơ sở dữ liệu!',
      data: checkIn,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Lỗi lưu nhịp kết nối' },
      { status: 500 }
    );
  }
}

// GET: Retrieve check-ins for a family from database
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const familyId = searchParams.get('familyId');

  if (!familyId) {
    return NextResponse.json(
      { success: false, error: 'Thiếu tham số familyId', data: [] },
      { status: 400 }
    );
  }

  const items = await dataRepository.getCheckIns(familyId);
  return NextResponse.json({
    success: true,
    familyId,
    data: items,
  });
}
