import { NextResponse } from 'next/server';
import type { EmpathyAssistantResponse, MoodType } from '@nhipnha/shared';

export const dynamic = 'force-dynamic';

const DEFAULT_AI_BASE_URL = 'https://chat-api.chuyenbienhoa.com';
const DEFAULT_AI_MODEL = 'gemini-3.8-flash';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-family-id, x-member-id',
};

function getFallbackEmpathy(
  selectedMood: MoodType,
  childName: string,
  childMessage?: string,
  attachmentTitle?: string
): EmpathyAssistantResponse {
  let summary = '';
  let keywords: string[] = [];
  let suggestedPrompts: string[] = [];
  let toneExplanation = '';
  let cvInsight = '';

  switch (selectedMood) {
    case 'JOYFUL':
      summary = `${childName} hôm nay có nhiều niềm vui ở lớp, được cô giáo khen vẽ hoa sen đẹp và ăn cơm ngon cùng bà.`;
      keywords = ['#VẽHoaSen', '#ĐượcCôKhen', '#CanhChuaBàNấu', '#MongCuốiTuần'];
      suggestedPrompts = [
        'Hôm nay ở trường có chuyện gì làm con cười nhiều nhất thế? Kể mẹ nghe với!',
        'Bức tranh hoa sen hồng con vẽ có mấy cánh thế, cuối tuần mẹ về con tặng mẹ nhé!',
        'Bà nấu món canh chua gì cho An ăn chiều thế? Mẹ ở xưởng cũng thấy vui lây luôn!',
      ];
      toneExplanation =
        'Giữ sự tò mò ấm áp, khuyến khích con kể trải nghiệm vui thay vì hỏi kết quả bài tập.';
      cvInsight =
        'Màu hồng ấm & vàng tươi — Tín hiệu thị giác tích cực, trẻ giàu tình cảm hướng về gia đình.';
      break;

    case 'CALM':
      summary = `${childName} trải qua một ngày êm đềm, chiều mát ngồi ngoài hiên nhà cùng ông bà.`;
      keywords = ['#NgàyÊmĐềm', '#BênÔngBà', '#BìnhYênỞQuê'];
      suggestedPrompts = [
        'Chiều nay gió mát, con có ra sân chơi hay tưới cây phụ bà nội không?',
        'Hôm nay con và bà ăn cơm chưa? Con nhớ lấy nước ấm cho bà uống nhé.',
        'Mẹ chuẩn bị tan ca rồi, thấy con bình yên là mẹ yên tâm làm việc nhất!',
      ];
      toneExplanation = 'Tạo cảm giác hiện diện gia đình dù ở xa hàng trăm cây số.';
      cvInsight = 'Chủ đề sinh hoạt gia đình — Nhịp sống yên bình cùng ông bà tại quê nhà.';
      break;

    case 'TIRED':
      summary = `${childName} thấy người hơi mệt sau giờ học. Bé cần sự vỗ về nhẹ nhàng và nghỉ ngơi sớm.`;
      keywords = ['#HơiMệt', '#CầnNghỉNgơi', '#KhôngÁpLựcĐiểmSố'];
      suggestedPrompts = [
        'Mẹ nghe con nói giọng hơi mệt, con có thấy mỏi lưng không, để mẹ dặn bà nấu cháo ấm nhé?',
        'Hôm nay con cứ nghỉ ngơi sớm đi, không cần lo bài vở quá đâu, sức khỏe của con là trên hết.',
        'Mẹ gửi một cái ôm thật ấm nè, con uống sữa ấm rồi nhắm mắt nghỉ ngơi một lát đi nhé!',
      ];
      toneExplanation =
        'Thấu hiểu sự mệt mỏi sinh lý, tuyệt đối không hối thúc con làm bài tập khi mệt mỏi.';
      cvInsight =
        'Gam màu dịu — Tín hiệu bổ trợ: Trẻ cần nghỉ ngơi và lời động viên nhẹ nhàng từ cha mẹ.';
      break;

    case 'NEED_HUG':
    default:
      summary = `${childName} đang rất nhớ bố mẹ vào buổi chiều tối. Trẻ sống xa cha mẹ cần lời cam kết yêu thương và hẹn ngày đoàn tụ.`;
      keywords = ['#NhớBốMẹ', '#CầnCáiÔm', '#ĐếmNgượcCuốiTuần'];
      suggestedPrompts = [
        'Mẹ cũng nhớ An nhiều lắm! Mẹ đang nhìn bức vẽ của con ngay bàn làm việc đây nè.',
        'Chỉ còn ít ngày nữa là cuối tuần bố mẹ về thăm con rồi, hai mẹ con mình cùng đi chợ quê nhé!',
        'Con ôm chiếc gối gấu bông mẹ mua thay mẹ nhé, lúc nào bố mẹ cũng yêu và tự hào về con.',
      ];
      toneExplanation =
        'Xoa dịu nỗi buồn chia cách, chuyển tải tình yêu vô điều kiện và cam kết ngày đoàn tụ.';
      cvInsight =
        'Chủ đề ngôi nhà & gia đình — Trẻ đang mong ngóng sự hiện diện ấm áp của cha mẹ.';
      break;
  }

  if (childMessage) {
    summary += ` Lời nhắn của bé: "${childMessage}"`;
  }
  if (attachmentTitle) {
    cvInsight = `${attachmentTitle} — ${cvInsight}`;
  }

  return {
    summary,
    keywords,
    suggestedPrompts,
    toneExplanation,
    cvInsight,
  };
}

interface GenerateParams {
  mood?: MoodType;
  childMessage?: string;
  childName?: string;
  attachmentTitle?: string;
  language?: 'vi' | 'en';
}

async function generateEmpathyData(params: GenerateParams) {
  const {
    mood,
    childMessage,
    childName = 'Bé An',
    attachmentTitle,
    language = 'vi',
  } = params;

  const selectedMood: MoodType = mood || 'JOYFUL';
  const fallbackData = getFallbackEmpathy(
    selectedMood,
    childName,
    childMessage,
    attachmentTitle
  );

  // Read API key & endpoint from environment variables (never hardcoded in source)
  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  const baseUrl = (process.env.AI_BASE_URL || DEFAULT_AI_BASE_URL).replace(/\/+$/, '');
  const model = process.env.AI_MODEL || DEFAULT_AI_MODEL;

  if (!apiKey) {
    return {
      success: true,
      source: 'fallback-no-key',
      data: fallbackData,
    };
  }

  const systemInstruction =
    language === 'en'
      ? `You are the "30-Second AI Empathy Assistant" for the "Nhịp Nhà – Bước Chân Nhỏ" (Little Footsteps) ecosystem.
Your role (Human-Centered AI Level 1 & 2):
- Help exhausted migrant worker parents (working 10-12h shifts in industrial zones) connect with their 6-12 year old child left behind in the countryside with grandparents.
- NEVER diagnose or label psychological conditions.
- NEVER suggest academic interrogation ("What score did you get?", "Did you finish homework?").
- Output ONLY valid JSON matching this schema:
{
  "summary": "1-2 warm sentences summarizing the child's 15s diary today",
  "keywords": ["#Keyword1", "#Keyword2", "#Keyword3"],
  "suggestedPrompts": ["Open empathetic question 1", "Open empathetic question 2", "Warm reassurance 3"],
  "toneExplanation": "1 short sentence explaining the empathetic tone",
  "cvInsight": "1 short non-diagnostic visual observation about the child's doodle/photo"
}`
      : `Bạn là "Trợ Lý AI Gợi Ý Thấu Cảm (30 giây)" thuộc Hệ sinh thái gắn kết và tự lập "Bước Chân Nhỏ" (Nhịp Nhà).
Nguyên tắc AI lấy con người làm trung tâm (Cấp độ 1 & 2):
- Hỗ trợ cha mẹ công nhân đi làm xa (tăng ca 10–12 tiếng/ngày) dễ dàng bắt chuyện với con (6–12 tuổi ở quê cùng ông bà) mà không bị kiệt sức hay rơi vào bẫy tra hỏi điểm số ("Hôm nay được mấy điểm?").
- Tuyệt đối KHÔNG chẩn đoán hay dán nhãn tâm lý thay cho người lớn.
- Trả về DUY NHẤT 1 chuỗi JSON hợp lệ (không bọc trong markdown nếu không cần thiết) theo đúng cấu trúc sau:
{
  "summary": "1-2 câu tóm tắt trung thực, ấm áp nhật ký 15 giây của con hôm nay",
  "keywords": ["#TừKhóa1", "#TừKhóa2", "#TừKhóa3"],
  "suggestedPrompts": ["Câu hỏi mở thấu cảm 1", "Câu hỏi mở thấu cảm 2", "Lời vỗ về yêu thương 3"],
  "toneExplanation": "1 câu giải thích ngắn gọn định hướng giao tiếp thấu cảm",
  "cvInsight": "1 câu nhận xét tín hiệu bổ trợ thị giác (không chẩn đoán) từ nét vẽ hoặc bức ảnh của con"
}`;

  const userPrompt = `Thông tin Nhật ký tương tác 15 giây của bé:
- Tên bé: ${childName}
- Biểu tượng cảm xúc đã chọn: ${selectedMood}
- Lời nhắn thoại 15s (NLP chuyển văn bản): ${childMessage || 'Chiều nay con đi học về vui lắm, con vẽ bông hoa sen tặng mẹ và ăn canh chua bà nấu.'}
- Nét vẽ tay / Ảnh đính kèm: ${attachmentTitle || 'Nét vẽ: Hoa sen hồng tặng mẹ'}
Hãy phân tích và trả về JSON đúng cấu trúc.`;

  try {
    // 9-second timeout to prevent serverless function hangs
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);

    const aiResponse = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!aiResponse.ok) {
      return {
        success: true,
        source: 'fallback-upstream-error',
        data: fallbackData,
      };
    }

    const completion = await aiResponse.json();
    const rawContent: string = completion?.choices?.[0]?.message?.content || '';

    // Extract JSON block from response
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const liveData: EmpathyAssistantResponse = {
        summary: parsed.summary || fallbackData.summary,
        keywords:
          Array.isArray(parsed.keywords) && parsed.keywords.length > 0
            ? parsed.keywords
            : fallbackData.keywords,
        suggestedPrompts:
          Array.isArray(parsed.suggestedPrompts) &&
          parsed.suggestedPrompts.length > 0
            ? parsed.suggestedPrompts
            : fallbackData.suggestedPrompts,
        toneExplanation: parsed.toneExplanation || fallbackData.toneExplanation,
        cvInsight: parsed.cvInsight || fallbackData.cvInsight,
      };

      return {
        success: true,
        source: 'gemini-web2api',
        model,
        data: liveData,
      };
    }

    return {
      success: true,
      source: 'fallback-parse',
      data: fallbackData,
    };
  } catch {
    return {
      success: true,
      source: 'fallback-exception',
      data: fallbackData,
    };
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * GET handler: Prevents 405 Method Not Allowed when accessed via browser URL or query string.
 * Allows instant testing directly in browser with query params:
 * e.g. /api/ai/empathy-assistant?mood=JOYFUL&childName=Bé+An
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mood = (searchParams.get('mood') as MoodType) || 'JOYFUL';
    const childName = searchParams.get('childName') || 'Bé An';
    const childMessage = searchParams.get('childMessage') || undefined;
    const attachmentTitle = searchParams.get('attachmentTitle') || undefined;
    const language = (searchParams.get('language') as 'vi' | 'en') || 'vi';

    const result = await generateEmpathyData({
      mood,
      childMessage,
      childName,
      attachmentTitle,
      language,
    });

    return NextResponse.json(
      {
        ...result,
        endpoint: '/api/ai/empathy-assistant',
        methods: ['GET', 'POST', 'OPTIONS'],
        description: '30-Second AI Empathy Assistant API — Hệ sinh thái Nhịp Nhà',
      },
      {
        status: 200,
        headers: CORS_HEADERS,
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: true,
        source: 'fallback-exception',
        data: getFallbackEmpathy('JOYFUL', 'Bé An'),
        endpoint: '/api/ai/empathy-assistant',
        error: err?.message,
      },
      {
        status: 200,
        headers: CORS_HEADERS,
      }
    );
  }
}

/**
 * POST handler: Primary endpoint consumed by the mobile & web applications.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      mood,
      childMessage,
      childName = 'Bé An',
      attachmentTitle,
      language = 'vi',
    } = body;

    const result = await generateEmpathyData({
      mood,
      childMessage,
      childName,
      attachmentTitle,
      language,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch {
    return NextResponse.json(
      {
        success: true,
        source: 'fallback-exception',
        data: getFallbackEmpathy('JOYFUL', 'Bé An'),
      },
      {
        status: 200,
        headers: CORS_HEADERS,
      }
    );
  }
}
