import { NextResponse } from 'next/server';
import { dataRepository } from '@/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const familyId = searchParams.get('familyId');

  if (!familyId) {
    return NextResponse.json(
      { success: false, error: 'Thiếu tham số familyId' },
      { status: 400 }
    );
  }

  const [family, members, checkIns, messages] = await Promise.all([
    dataRepository.getFamily(familyId),
    dataRepository.getMembers(familyId),
    dataRepository.getCheckIns(familyId),
    dataRepository.getMessages(familyId),
  ]);

  const morningCheckIn = checkIns.find((c) => c.rhythmType === 'MORNING');
  const afternoonCheckIn = checkIns.find((c) => c.rhythmType === 'AFTERNOON');
  const eveningExtraCheckIn = checkIns.find((c) => c.rhythmType === 'EVENING');
  const eveningMessage = messages.find((m) => m.rhythmType === 'EVENING');

  const timeline = [
    {
      id: 'morning_slot',
      type: 'MORNING',
      title: 'Nhịp Sáng – Tiếng chuông & Hộp thư thoại',
      timeWindow: '06:30 - 07:15',
      status: morningCheckIn ? 'COMPLETED' : 'PENDING',
      data: morningCheckIn || null,
      summary: morningCheckIn
        ? `Đã điểm danh lúc ${new Date(morningCheckIn.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}: "${morningCheckIn.note || 'Con sẵn sàng đi học'}"`
        : 'Chưa có lượt chạm sáng hôm nay',
    },
    {
      id: 'afternoon_slot',
      type: 'AFTERNOON',
      title: 'Nhịp Chiều – Nhật ký tương tác 15s',
      timeWindow: '17:00 - 18:30',
      status: afternoonCheckIn ? 'COMPLETED' : 'PENDING',
      data: afternoonCheckIn || null,
      summary: afternoonCheckIn
        ? `Tâm trạng: ${afternoonCheckIn.mood || 'JOYFUL'} • Lời nhắn thoại: ${afternoonCheckIn.voiceDurationSec || 15}s`
        : 'Chưa có nhật ký chiều hôm nay',
    },
    {
      id: 'evening_slot',
      type: 'EVENING',
      title: 'Nhịp Tối – Hộp thư thoại chúc ngủ ngon',
      timeWindow: '20:30 - 21:00',
      status: eveningMessage ? 'COMPLETED' : 'PENDING',
      data: eveningMessage || null,
      extraReply: eveningExtraCheckIn || null,
      summary: eveningMessage
        ? `Lời chúc tối từ ${eveningMessage.senderName}: "${eveningMessage.transcription || ''}"`
        : 'Chưa có lời nhắn chúc ngủ ngon tối nay',
    },
  ];

  return NextResponse.json({
    success: true,
    family: family || null,
    members,
    checkIns,
    messages,
    rhythmScore: [morningCheckIn, afternoonCheckIn, eveningMessage].filter(Boolean).length,
    timeline,
  });
}
