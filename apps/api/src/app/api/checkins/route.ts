import { NextResponse } from 'next/server';
import { memoryStore } from '@/db';
import type { CheckIn } from '@nhipnha/shared';

export const dynamic = 'force-dynamic';

// POST: Save single or batch offline-synced check-ins
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Support offline batch sync
    if (Array.isArray(body.batch)) {
      const savedItems: CheckIn[] = [];
      for (const item of body.batch) {
        const checkIn: CheckIn = {
          id: item.id || `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          familyId: item.familyId || 'fam_dongthap_001',
          memberId: item.memberId || 'mem_child_an',
          memberName: item.memberName || 'Bé An',
          rhythmType: item.rhythmType || 'MORNING',
          mood: item.mood,
          note: item.note,
          voiceDurationSec: item.voiceDurationSec,
          voiceUrl: item.voiceUrl,
          waveform: item.waveform,
          syncStatus: 'SYNCED',
          createdAt: item.createdAt || new Date().toISOString(),
        };
        memoryStore.addCheckIn(checkIn);
        savedItems.push(checkIn);
      }

      return NextResponse.json({
        success: true,
        message: `Đồng bộ thành công ${savedItems.length} nhịp kết nối ngoại tuyến.`,
        data: savedItems,
      });
    }

    // Single check-in
    const { familyId, memberId, memberName, rhythmType, mood, note, voiceDurationSec, voiceUrl, waveform } = body;

    const checkIn: CheckIn = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      familyId: familyId || 'fam_dongthap_001',
      memberId: memberId || 'mem_child_an',
      memberName: memberName || 'Bé An',
      rhythmType: rhythmType || 'MORNING',
      mood,
      note,
      voiceDurationSec,
      voiceUrl,
      waveform,
      syncStatus: 'SYNCED',
      createdAt: new Date().toISOString(),
    };

    memoryStore.addCheckIn(checkIn);

    return NextResponse.json({
      success: true,
      message: 'Nhịp kết nối đã được ghi nhận!',
      data: checkIn,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Lỗi lưu nhịp kết nối' },
      { status: 500 }
    );
  }
}

// GET: Retrieve check-ins for a family
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const familyId = searchParams.get('familyId') || 'fam_dongthap_001';

  const items = memoryStore.getCheckIns(familyId);
  return NextResponse.json({
    success: true,
    familyId,
    data: items,
  });
}
