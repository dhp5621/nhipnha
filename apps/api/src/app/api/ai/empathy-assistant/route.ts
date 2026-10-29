import { NextResponse } from 'next/server';
import type { EmpathyAssistantResponse, MoodType } from '@nhipnha/shared';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mood, childMessage, childName = 'Bé An' } = body;

    // AI logic generating tailored empathetic prompts based on mood & child note
    let summary = '';
    let suggestedPrompts: string[] = [];
    let toneExplanation = '';

    const selectedMood: MoodType = mood || 'JOYFUL';

    switch (selectedMood) {
      case 'JOYFUL':
        summary = `${childName} hôm nay có nhiều niềm vui ở lớp và chơi đùa cùng bạn bè. Bé cảm thấy hào hứng khi tan học về nhà.`;
        suggestedPrompts = [
          `"Hôm nay ở trường có chuyện gì làm con cười nhiều nhất thế? Kể mẹ nghe với!"`,
          `"Bà kể chiều nay con ăn thêm được nửa chén cơm, món gì hợp khẩu vị con thế?"`,
          `"Mẹ thấy hôm nay con tràn đầy năng lượng, mẹ ở xưởng cũng thấy vui lây luôn này!"`,
        ];
        toneExplanation = 'Giữ sự tò mò ấm áp, khuyến khích con kể trải nghiệm vui thay vì hỏi kết quả bài tập.';
        break;

      case 'CALM':
        summary = `${childName} trải qua một ngày êm đềm, không gặp sự cố gì, vừa ngồi xem ti vi cùng ông bà.`;
        suggestedPrompts = [
          `"Chiều nay gió mát, con có ra sân chơi với chú cún hay xem hoa ngoài vườn không?"`,
          `"Hôm nay con và bà ăn cơm chưa? Con nhớ lấy nước ấm cho bà uống nhé."`,
          `"Mẹ chuẩn bị tan ca rồi, thấy con bình yên là mẹ yên tâm làm việc nhất!"`,
        ];
        toneExplanation = 'Tạo cảm giác hiện diện gia đình dù ở xa hàng trăm cây số.';
        break;

      case 'TIRED':
        summary = `${childName} thấy người hơi mệt, có thể do thời tiết hoặc ngồi học lâu. Bé muốn được nghỉ ngơi.`;
        suggestedPrompts = [
          `"Mẹ nghe con nói giọng hơi mệt, con có thấy nóng trán hay mỏi lưng không, để mẹ dặn bà nấu cháo nhé?"`,
          `"Hôm nay con cứ nghỉ ngơi sớm đi, không cần lo bài vở quá đâu, sức khỏe là trên hết con nhé."`,
          `"Mẹ gửi một cái ôm thật to nè, con nhắm mắt nghỉ ngơi một lát đi nhé!"`,
        ];
        toneExplanation = 'Thấu hiểu sự mệt mỏi sinh lý, tuyệt đối không hối thúc con làm bài tập khi mệt mỏi.';
        break;

      case 'NEED_HUG':
        summary = `${childName} đang rất nhớ bố mẹ. Trẻ em nông thôn sống xa cha mẹ thường có những khoảnh khắc cô đơn vào buổi chiều tối.`;
        suggestedPrompts = [
          `"Mẹ nhớ con gái/con trai nhiều lắm! Mẹ đang nhìn ảnh con trên bàn làm việc đây nè."`,
          `"Chỉ còn ít tuần nữa là bố mẹ được về thăm con rồi, hôm đó hai mẹ con mình cùng đi chợ huyện nhé!"`,
          `"Con ôm chiếc gối con gấu mẹ mua thay mẹ nhé, lúc nào bố mẹ cũng yêu và tự hào về con."`,
        ];
        toneExplanation = 'Xoa dịu nỗi buồn chia cách, chuyển tải tình yêu vô điều kiện và cam kết ngày đoàn tụ.';
        break;
    }

    if (childMessage) {
      summary += ` Lời nhắn cụ thể của bé: "${childMessage}"`;
    }

    const responseData: EmpathyAssistantResponse = {
      summary,
      suggestedPrompts,
      toneExplanation,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Lỗi xử lý Trợ lý Thấu Cảm' },
      { status: 500 }
    );
  }
}
