import { NextResponse } from 'next/server';
import { memoryStore } from '@/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const familyId = searchParams.get('familyId') || 'fam_dongthap_001';

  const family = memoryStore.getFamily(familyId);
  const members = memoryStore.getMembers(familyId);
  const checkIns = memoryStore.getCheckIns(familyId);
  const messages = memoryStore.getMessages(familyId);

  // Formulate daily rhythm status
  const morningCheckIn = checkIns.find((c) => c.rhythmType === 'MORNING');
  const afternoonCheckIn = checkIns.find((c) => c.rhythmType === 'AFTERNOON');
  const eveningMessage = messages.find((m) => m.rhythmType === 'EVENING');

  const timeline = [
    {
      id: 'morning_slot',
      type: 'MORNING',
      title: 'Chạm Sáng – Báo thức & Đi học',
      timeWindow: '06:00 - 08:30',
      status: morningCheckIn ? 'COMPLETED' : 'PENDING',
      data: morningCheckIn,
      summary: morningCheckIn
        ? `Bé đã chạm sáng lúc ${new Date(morningCheckIn.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}: "${morningCheckIn.note || 'Con sẵn sàng đi học'}"`
        : 'Chưa có lượt chạm sáng',
    },
    {
      id: 'afternoon_slot',
      type: 'AFTERNOON',
      title: 'Chạm Chiều – Cảm xúc tan trường',
      timeWindow: '16:00 - 18:30',
      status: afternoonCheckIn ? 'COMPLETED' : 'PENDING',
      data: afternoonCheckIn,
      summary: afternoonCheckIn
        ? `Tâm trạng: ${afternoonCheckIn.mood || 'Vui vẻ'} • Lời nhắn voice: ${afternoonCheckIn.voiceDurationSec || 15}s`
        : 'Chưa có lời nhắn chiều',
    },
    {
      id: 'evening_slot',
      type: 'EVENING',
      title: 'Chạm Tối – Lời dặn dò ấm áp',
      timeWindow: '20:00 - 22:00',
      status: eveningMessage ? 'COMPLETED' : 'PENDING',
      data: eveningMessage,
      summary: eveningMessage
        ? `Ba mẹ đã gửi lời dặn dò: "${eveningMessage.transcription?.slice(0, 50)}..."`
        : 'Đang đợi ba mẹ gửi lời dặn dò trước khi bé đi ngủ',
    },
  ];

  return NextResponse.json({
    success: true,
    family,
    members,
    rhythmScore: [morningCheckIn, afternoonCheckIn, eveningMessage].filter(Boolean).length,
    timeline,
  });
}
