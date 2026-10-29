import { NextResponse } from 'next/server';
import { dataRepository } from '@/db';
import { authenticate } from '@/lib/auth';
import type { CheckIn, MoodType, RhythmType } from '@nhipnha/shared';

export const dynamic = 'force-dynamic';

const RHYTHMS: RhythmType[] = ['MORNING', 'AFTERNOON', 'EVENING'];
const MOODS: MoodType[] = ['JOYFUL', 'CALM', 'TIRED', 'NEED_HUG'];
const MAX_MEDIA_CHARS = 3_000_000; // data URLs live in the database, keep them bounded

function fail(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status });
}

function newId() {
  return `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
}

/**
 * Builds a check-in from untrusted input. For real families the author is always the
 * authenticated member, so nobody can post on behalf of another member.
 */
function buildCheckIn(
  item: any,
  familyId: string,
  author: { id: string; name: string } | null,
  keepClientTime: boolean
): CheckIn | null {
  const rhythmType: RhythmType = RHYTHMS.includes(item.rhythmType) ? item.rhythmType : 'MORNING';
  const mood: MoodType | undefined = MOODS.includes(item.mood) ? item.mood : undefined;

  if (typeof item.voiceUrl === 'string' && item.voiceUrl.length > MAX_MEDIA_CHARS) return null;
  if (
    typeof item.attachment?.imageUrl === 'string' &&
    item.attachment.imageUrl.length > MAX_MEDIA_CHARS
  ) {
    return null;
  }

  const createdAt =
    keepClientTime && item.createdAt && !Number.isNaN(Date.parse(item.createdAt))
      ? new Date(item.createdAt).toISOString()
      : new Date().toISOString();

  return {
    id: typeof item.id === 'string' && item.id ? item.id.slice(0, 64) : newId(),
    familyId,
    memberId: author?.id || item.memberId || `mem_${Date.now()}`,
    memberName: author?.name || item.memberName || 'Thành viên',
    rhythmType,
    mood,
    note: typeof item.note === 'string' ? item.note.slice(0, 2000) : undefined,
    voiceDurationSec: item.voiceDurationSec,
    voiceUrl: item.voiceUrl,
    waveform: Array.isArray(item.waveform) ? item.waveform : undefined,
    attachment: item.attachment,
    syncStatus: 'SYNCED',
    createdAt,
  };
}

// POST: Save single or batch offline-synced check-ins to database
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Offline batch sync (all items must belong to the same family)
    if (Array.isArray(body.batch)) {
      const familyId = body.batch[0]?.familyId;
      const auth = await authenticate(request, familyId);
      if (!auth.ok) return auth.response;

      const author = auth.member ? { id: auth.member.id, name: auth.member.name } : null;
      const savedItems: CheckIn[] = [];
      for (const item of body.batch) {
        if (item.familyId !== familyId) continue;
        // A real member can only sync their own check-ins
        if (!auth.isDemo && item.memberId && item.memberId !== auth.member!.id) continue;
        const checkIn = buildCheckIn(item, familyId, author, true);
        if (!checkIn) continue;
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
    const auth = await authenticate(request, body.familyId);
    if (!auth.ok) return auth.response;

    if (!auth.isDemo && body.memberId && body.memberId !== auth.member!.id) {
      return fail(403, 'Bạn không thể ghi nhịp kết nối thay cho thành viên khác.');
    }

    const author = auth.member ? { id: auth.member.id, name: auth.member.name } : null;
    const checkIn = buildCheckIn(body, body.familyId, author, false);
    if (!checkIn) return fail(413, 'Tệp ghi âm hoặc ảnh quá lớn, vui lòng chọn tệp nhỏ hơn.');

    await dataRepository.addCheckIn(checkIn);

    return NextResponse.json({
      success: true,
      message: 'Nhịp kết nối đã được ghi nhận vào cơ sở dữ liệu!',
      data: checkIn,
    });
  } catch (err: any) {
    return fail(500, err?.message || 'Lỗi lưu nhịp kết nối');
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

  const auth = await authenticate(request, familyId);
  if (!auth.ok) return auth.response;

  const items = await dataRepository.getCheckIns(familyId);
  return NextResponse.json({
    success: true,
    familyId,
    data: items,
  });
}
