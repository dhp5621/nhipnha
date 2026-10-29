import { NextResponse } from 'next/server';
import { dataRepository } from '@/db';
import { authenticate } from '@/lib/auth';
import type { Message } from '@nhipnha/shared';

export const dynamic = 'force-dynamic';

const MAX_AUDIO_CHARS = 3_000_000;

function fail(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status });
}

// POST: A parent / grandparent sends a bedtime message, or a member marks a message listened
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      action,
      messageId,
      familyId,
      senderId,
      senderName,
      recipientId,
      transcription,
      durationSec,
      audioUrl,
      aiSummary,
      aiSuggestedPrompts,
    } = body;

    const auth = await authenticate(request, familyId);
    if (!auth.ok) return auth.response;

    if (action === 'mark_listened' && messageId) {
      const familyMessages = await dataRepository.getMessages(familyId);
      if (!familyMessages.some((m) => m.id === messageId)) {
        return fail(404, 'Không tìm thấy tin nhắn trong gia đình.');
      }
      await dataRepository.markMessageListened(messageId);
      return NextResponse.json({ success: true, message: 'Đã đánh dấu đã nghe' });
    }

    // Children receive bedtime messages; they do not send them
    if (!auth.isDemo && auth.member!.role === 'CHILD') {
      return fail(403, 'Tài khoản trẻ em không thể gửi lời dặn dò.');
    }

    if (typeof audioUrl === 'string' && audioUrl.length > MAX_AUDIO_CHARS) {
      return fail(413, 'Tệp ghi âm quá lớn, vui lòng ghi âm ngắn hơn.');
    }

    if (!auth.isDemo && recipientId) {
      const recipient = await dataRepository.getMember(recipientId);
      if (!recipient || recipient.familyId !== familyId) {
        return fail(400, 'Người nhận không thuộc gia đình này.');
      }
    }

    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      familyId,
      // Real families: the sender is always the signed-in member
      senderId: auth.member?.id || senderId || `mem_parent_${Date.now().toString(36)}`,
      senderName: auth.member?.name || senderName || 'Bố / Mẹ',
      recipientId,
      rhythmType: 'EVENING',
      durationSec: durationSec || 20,
      audioUrl,
      transcription: transcription || 'Con yêu ngủ ngon nhé, nhớ đắp chăn ấm!',
      aiSummary,
      aiSuggestedPrompts,
      createdAt: new Date().toISOString(),
    };

    await dataRepository.addMessage(newMsg);

    return NextResponse.json({
      success: true,
      message: 'Lời dặn dò đã gửi đến điện thoại ở quê!',
      data: newMsg,
    });
  } catch (err: any) {
    return fail(500, err?.message || 'Lỗi gửi tin nhắn dặn dò');
  }
}

// GET: Retrieve evening messages for a family from database
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

  const msgs = await dataRepository.getMessages(familyId);
  return NextResponse.json({
    success: true,
    data: msgs,
  });
}
