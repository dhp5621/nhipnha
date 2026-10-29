import { NextResponse } from 'next/server';
import { dataRepository } from '@/db';
import type { Message } from '@nhipnha/shared';

export const dynamic = 'force-dynamic';

// POST: Parent sends evening bedtime message or child marks message listened
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

    if (action === 'mark_listened' && messageId) {
      await dataRepository.markMessageListened(messageId);
      return NextResponse.json({ success: true, message: 'Đã đánh dấu đã nghe' });
    }

    if (!familyId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu mã định danh gia đình (familyId)' },
        { status: 400 }
      );
    }

    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      familyId,
      senderId: senderId || `mem_parent_${Date.now().toString(36)}`,
      senderName: senderName || 'Bố / Mẹ',
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
    return NextResponse.json(
      { success: false, error: err?.message || 'Lỗi gửi tin nhắn dặn dò' },
      { status: 500 }
    );
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

  const msgs = await dataRepository.getMessages(familyId);
  return NextResponse.json({
    success: true,
    data: msgs,
  });
}
