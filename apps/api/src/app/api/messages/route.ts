import { NextResponse } from 'next/server';
import { memoryStore } from '@/db';
import type { Message } from '@nhipnha/shared';

export const dynamic = 'force-dynamic';

// POST: Parent sends evening bedtime message or marks listened
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, messageId, familyId, senderId, senderName, recipientId, transcription, durationSec, audioUrl } = body;

    // Mark message as listened by child
    if (action === 'mark_listened' && messageId) {
      const messages = memoryStore.getMessages(familyId || 'fam_dongthap_001');
      const target = messages.find((m) => m.id === messageId);
      if (target) {
        target.listenedAt = new Date().toISOString();
      }
      return NextResponse.json({ success: true, message: 'Đã đánh dấu đã nghe' });
    }

    // Create new evening message
    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      familyId: familyId || 'fam_dongthap_001',
      senderId: senderId || 'mem_parent_hoa',
      senderName: senderName || 'Mẹ Hoa',
      recipientId: recipientId || 'mem_child_an',
      rhythmType: 'EVENING',
      durationSec: durationSec || 20,
      audioUrl: audioUrl || 'mock://audio/dan-do-me-hoa.aac',
      transcription: transcription || 'Con yêu ngủ ngon nhé, nhớ đắp chăn ấm!',
      createdAt: new Date().toISOString(),
    };

    memoryStore.addMessage(newMsg);

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

// GET: Retrieve latest evening messages
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const familyId = searchParams.get('familyId') || 'fam_dongthap_001';

  const msgs = memoryStore.getMessages(familyId);
  return NextResponse.json({
    success: true,
    data: msgs,
  });
}
