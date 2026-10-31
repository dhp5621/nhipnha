import { NextResponse } from 'next/server';
import type { EmpathyAssistantResponse, MoodType, Role } from '@nhipnha/shared';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DEFAULT_AI_BASE_URL = 'https://chat-api.chuyenbienhoa.com';
const DEFAULT_AI_MODEL = 'gemini-flash-lite';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-family-id, x-member-id',
};

export interface WeeklyRecapResponse {
  weeklyOverview: string;
  narrativeHighlights: Array<{
    emoji: string;
    title: string;
    detail: string;
  }>;
  weekendSuggestions: string[];
}

function getFallbackEmpathy(
  selectedMood: MoodType,
  childName: string,
  childMessage?: string,
  attachmentTitle?: string,
  language: 'vi' | 'en' = 'vi',
  isDemo: boolean = false,
  role: Role = 'PARENT'
): EmpathyAssistantResponse {
  const isVi = language === 'vi';
  const isGrandparent = role === 'GRANDPARENT';

  // If Demo Account, preserve the rich Dong Thap demo story in user's selected language
  if (isDemo) {
    if (!isVi) {
      let summary = '';
      let keywords: string[] = [];
      let suggestedPrompts: string[] = [];
      let toneExplanation = '';
      let cvInsight = '';

      switch (selectedMood) {
        case 'JOYFUL':
          summary = isGrandparent
            ? `${childName} had a very happy day at school, was praised by the teacher for drawing a beautiful lotus flower, and enjoyed dinner with grandma.`
            : `${childName} had a very joyful day at school today, was praised by the teacher for drawing a beautiful lotus flower, and enjoyed a warm dinner with grandma.`;
          keywords = isGrandparent
            ? ['#HappyAtSchool', '#LotusDrawing', '#DinnerWithGrandma', '#WeekendReunion']
            : ['#LotusFlowerDrawing', '#PraisedByTeacher', '#GrandmasSourSoup', '#LookingForwardToWeekend'];
          suggestedPrompts = isGrandparent
            ? [
                'What was the happiest game you played with your friends today? Tell Grandma all about it!',
                'Your pink lotus drawing looks so beautiful, Grandma kept it safe so Mom can see it this weekend!',
                'Seeing you enjoy dinner and smile so brightly makes Grandma so happy, you are such a good grandchild!',
              ]
            : [
                'What was the happiest game you played with your friends today? Tell Mom all about it!',
                'Mom heard you were having so much fun today, do you have any exciting stories to share with me?',
                'Seeing you so happy today makes all my tiredness at the factory melt away, you are my wonderful love!',
              ];
          toneExplanation = isGrandparent
            ? 'Keep warm curiosity and encourage your grandchild to share joyful feelings with Grandma.'
            : 'Keep warm curiosity and encourage your child to share joyful feelings rather than asking about homework scores.';
          cvInsight =
            'Warm pink & bright yellow tones — Positive visual cues reflecting deep affection and family connection.';
          break;
        case 'CALM':
          summary = `${childName} spent a calm and peaceful day, relaxing on the front porch with grandparents in the cool afternoon.`;
          keywords = ['#PeacefulDay', '#WithGrandparents', '#CountryHomeTranquility'];
          suggestedPrompts = isGrandparent
            ? [
                'The afternoon breeze feels so pleasant, do you want to sit on the porch with Grandma and rest a bit?',
                'Are you feeling hungry after class? Come have a warm snack with Grandma.',
                'Seeing you peaceful and safe every day brings so much peace of mind to Grandma and your parents!',
              ]
            : [
                'The afternoon breeze feels so pleasant, did you help grandma water the garden today?',
                'Did you and grandma finish dinner yet? Remember to drink some warm water before bedtime!',
                'Mom is about to finish my shift, seeing you safe and peaceful gives me the greatest peace of mind.',
              ];
          toneExplanation = isGrandparent
            ? 'Fosters a comforting, protective presence of grandparents caring for the child at home.'
            : 'Fosters a comforting sense of parental presence across distance.';
          cvInsight = 'Family daily life theme — A peaceful, steady rhythm with grandparents at home.';
          break;
        case 'TIRED':
          summary = `${childName} is feeling a little tired after school. A gentle reassuring check-in and early rest will help.`;
          keywords = ['#FeelingTired', '#NeedGentleRest', '#ZeroScorePressure'];
          suggestedPrompts = isGrandparent
            ? [
                'Grandma heard in your voice that you sound a bit tired, let Grandma get you warm water to drink and rest early.',
                'Rest early tonight, sweetie, do not worry about homework—your health and well-being come first.',
                'Grandma gives you a big warm hug! Drink some warm milk and rest your eyes early tonight.',
              ]
            : [
                'Mom heard in your voice that you sound a bit tired, does your back ache? Let Mom tell grandma to make warm soup for you.',
                'Rest early tonight, sweetie, do not worry about homework—your health and well-being come first.',
                'Mom sends you a big warm hug! Drink some warm milk and rest your eyes early tonight.',
              ];
          toneExplanation =
            'Validates physical fatigue without pressing for academic performance.';
          cvInsight =
            'Muted soothing colors — Visual cue: Child needs gentle comfort and unconditional love.';
          break;
        case 'NEED_HUG':
        default:
          summary = `${childName} misses Mom and Dad deeply this evening. Grandparents provide warm reassurance and promise the upcoming reunion.`;
          keywords = isGrandparent
            ? ['#MissMomAndDad', '#GrandmaLovesYou', '#WeekendCountdown']
            : ['#MissMomAndDad', '#NeedAHug', '#WeekendCountdown'];
          suggestedPrompts = isGrandparent
            ? [
                `Grandma loves you so much! Mom and Dad are working hard, but they hold you tight in their hearts every day.`,
                'Just a few more days until the weekend when Mom and Dad visit home, we will welcome them together!',
                'Do not feel sad sweet grandchild, Grandma is right here beside you tonight, you are always loved and protected!',
              ]
            : [
                `Mom misses you so much too, ${childName}! I keep your drawing right here on my work desk.`,
                'Only a few more days until the weekend when Mom and Dad visit home, we will go to the village market together!',
                'Hug the teddy bear Mom got you on my behalf tonight, we are always so proud of you and love you so much!',
              ];
          toneExplanation = isGrandparent
            ? 'Soothes separation sadness with the unconditional protective warmth of grandparents.'
            : 'Soothes separation anxiety, conveying unconditional love and a concrete reunion date.';
          cvInsight =
            'Home & family theme — Child eagerly longs for loving family presence.';
          break;
      }

      if (childMessage) {
        summary += ` Child's note: "${childMessage}"`;
      }
      if (attachmentTitle) {
        cvInsight = `${attachmentTitle} — ${cvInsight}`;
      }

      return { summary, keywords, suggestedPrompts, toneExplanation, cvInsight };
    }

    let summary = '';
    let keywords: string[] = [];
    let suggestedPrompts: string[] = [];
    let toneExplanation = '';
    let cvInsight = '';

    switch (selectedMood) {
      case 'JOYFUL':
        summary = isGrandparent
          ? `${childName} hôm nay có nhiều niềm vui ở lớp, được cô giáo khen vẽ hoa sen đẹp và ăn cơm canh chua chiều thật ngon miệng cùng bà.`
          : `${childName} hôm nay có nhiều niềm vui ở lớp, được cô giáo khen vẽ hoa sen đẹp và ăn cơm ngon cùng bà.`;
        keywords = isGrandparent
          ? ['#CháuVuiỞLớp', '#KhenVẽĐẹp', '#CanhChuaBàNấu', '#MongCuốiTuần']
          : ['#VẽHoaSen', '#ĐượcCôKhen', '#CanhChuaBàNấu', '#MongCuốiTuần'];
        suggestedPrompts = isGrandparent
          ? [
              'Chiều nay ở trường có chuyện gì vui làm cháu cười nhiều thế, kể bà nghe với nào!',
              'Bức tranh hoa sen hồng cháu vẽ có mấy cánh thế, bà cất cẩn thận rồi cuối tuần mẹ về xem nhé!',
              'Cháu ăn cơm chiều với bà ngon miệng thế này là bà mừng nhất rồi, cháu ngoan của bà giỏi lắm!',
            ]
          : [
              'Hôm nay ở trường có chuyện gì làm con cười nhiều nhất thế? Kể mẹ nghe với!',
              'Bức tranh hoa sen hồng con vẽ có mấy cánh thế, cuối tuần mẹ về con tặng mẹ nhé!',
              'Bà nấu món canh chua gì cho An ăn chiều thế? Mẹ ở xưởng cũng thấy vui lây luôn!',
            ];
        toneExplanation = isGrandparent
          ? 'Khích lệ niềm vui tự nhiên của cháu, trò chuyện ấm áp từ sự chở che của ông bà.'
          : 'Giữ sự tò mò ấm áp, khuyến khích con kể trải nghiệm vui thay vì hỏi kết quả bài tập.';
        cvInsight =
          'Màu hồng ấm & vàng tươi — Tín hiệu thị giác tích cực, trẻ giàu tình cảm hướng về gia đình.';
        break;
      case 'CALM':
        summary = `${childName} trải qua một ngày êm đềm, chiều mát ngồi ngoài hiên nhà cùng ông bà.`;
        keywords = ['#NgàyÊmĐềm', '#BênÔngBà', '#BìnhYênỞQuê'];
        suggestedPrompts = isGrandparent
          ? [
              'Chiều nay gió mát, cháu có muốn ra sân chơi hay tưới cây phụ bà nội không?',
              'Đi học về đói bụng chưa cháu? Lại đây bà lấy cho củ khoai hay ly sữa ấm nha.',
              'Thấy cháu ngoan ngoãn, bình an mỗi ngày là bà và bố mẹ an lòng nhất!',
            ]
          : [
              'Chiều nay gió mát, con có ra sân chơi hay tưới cây phụ bà nội không?',
              'Hôm nay con và bà ăn cơm chưa? Con nhớ lấy nước ấm cho bà uống nhé.',
              'Mẹ chuẩn bị tan ca rồi, thấy con bình yên là mẹ yên tâm làm việc nhất!',
            ];
        toneExplanation = isGrandparent
          ? 'Tạo cảm giác bình yên, che chở của ông bà dành cho cháu nhỏ.'
          : 'Tạo cảm giác hiện diện gia đình dù ở xa hàng trăm cây số.';
        cvInsight = 'Chủ đề sinh hoạt gia đình — Nhịp sống yên bình cùng ông bà tại quê nhà.';
        break;
      case 'TIRED':
        summary = `${childName} thấy người hơi mệt sau giờ học. Cháu cần sự vỗ về nhẹ nhàng và nghỉ ngơi sớm.`;
        keywords = ['#HơiMệt', '#CầnNghỉNgơi', '#ChămSócSứcKhoẻ'];
        suggestedPrompts = isGrandparent
          ? [
              'Bà nghe giọng cháu có vẻ hơi mệt, để bà lấy nước ấm cho cháu uống rồi nằm nghỉ nhé.',
              'Hôm nay cháu cứ nghỉ ngơi sớm đi, không cần lo bài vở quá đâu, sức khỏe là trên hết nha cháu.',
              'Bà ôm cháu một cái nè, ăn bát cháo ấm rồi nhắm mắt nghỉ ngơi cho mau khỏe lại nhé!',
            ]
          : [
              'Mẹ nghe con nói giọng hơi mệt, con có thấy mỏi lưng không, để mẹ dặn bà nấu cháo ấm nhé?',
              'Hôm nay con cứ nghỉ ngơi sớm đi, không cần lo bài vở quá đâu, sức khỏe của con là trên hết.',
              'Mẹ gửi một cái ôm thật ấm nè, con uống sữa ấm rồi nhắm mắt nghỉ ngơi một lát đi nhé!',
            ];
        toneExplanation =
          'Thấu hiểu sự mệt mỏi sinh lý, tuyệt đối không hối thúc bài vở khi cháu mệt mỏi.';
        cvInsight =
          'Gam màu dịu — Tín hiệu bổ trợ: Trẻ cần nghỉ ngơi và lời động viên nhẹ nhàng từ người thân.';
        break;
      case 'NEED_HUG':
      default:
        summary = `${childName} đang rất nhớ bố mẹ vào buổi chiều tối. Ông bà ở quê trao gửi sự che chở và lời hẹn ngày đoàn tụ cuối tuần.`;
        keywords = isGrandparent
          ? ['#NhớBốMẹ', '#BàThươngCháu', '#ĐếmNgượcCuốiTuần']
          : ['#NhớBốMẹ', '#CầnCáiÔm', '#ĐếmNgượcCuốiTuần'];
        suggestedPrompts = isGrandparent
          ? [
              'Bà thương cháu nhiều lắm! Bố mẹ đi làm ở xưởng cũng luôn nghĩ về cháu từng giờ đó.',
              'Chỉ còn ít ngày nữa là cuối tuần bố mẹ về thăm rồi, hai bà cháu mình cùng ra chợ đón bố mẹ nhé!',
              'Cháu ngoan đừng buồn, tối nay bà ngủ cùng cháu, lúc nào cũng có bà yêu thương cháu nè.',
            ]
          : [
              'Mẹ cũng nhớ An nhiều lắm! Mẹ đang nhìn bức vẽ của con ngay bàn làm việc đây nè.',
              'Chỉ còn ít ngày nữa là cuối tuần bố mẹ về thăm con rồi, hai mẹ con mình cùng đi chợ quê nhé!',
              'Con ôm chiếc gối gấu bông mẹ mua thay mẹ nhé, lúc nào bố mẹ cũng yêu và tự hào về con.',
            ];
        toneExplanation = isGrandparent
          ? 'Lấp đầy nỗi nhớ cha mẹ bằng tình yêu che chở vô điều kiện của người bà tại quê nhà.'
          : 'Xoa dịu nỗi buồn chia cách, chuyển tải tình yêu vô điều kiện và cam kết ngày đoàn tụ.';
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

    return { summary, keywords, suggestedPrompts, toneExplanation, cvInsight };
  }

  // Production Account Dynamic Fallback (Strictly uses real data passed in)
  const cleanMsg = childMessage?.trim();
  const cleanAttach = attachmentTitle?.trim();

  if (!isVi) {
    const moodMapEnGrandparent: Record<MoodType, { desc: string; kw: string[]; prompts: string[]; tone: string }> = {
      JOYFUL: {
        desc: `${childName} shared a joyful afternoon update today.`,
        kw: ['#JoyfulGrandchild', '#GrandparentBond', '#DailyRhythm'],
        prompts: [
          `What made you smile the most today, ${childName}? Tell Grandma & Grandpa all about it!`,
          cleanAttach
            ? `Grandma & Grandpa loved seeing "${cleanAttach}"! Did you have fun with it?`
            : `Seeing you full of joy warms Grandma & Grandpa's heart so much!`,
          `Come have a delicious dinner or snack, we love you so much!`,
        ],
        tone: 'Warm grandparent encouragement and loving presence at home.',
      },
      CALM: {
        desc: `${childName} had a peaceful, calm afternoon at home.`,
        kw: ['#PeacefulDay', '#SafeWithGrandparents', '#WarmPresence'],
        prompts: [
          `Did you have a peaceful afternoon after school, ${childName}?`,
          `Grandma & Grandpa are right here if you want to sit together on the porch.`,
          `Rest well tonight and have sweet dreams, our dear grandchild!`,
        ],
        tone: 'Maintain comforting grandparent presence and calm at home.',
      },
      TIRED: {
        desc: `${childName} is feeling tired this afternoon and needs gentle rest.`,
        kw: ['#GentleCare', '#RestWell', '#GrandparentComfort'],
        prompts: [
          `Grandma & Grandpa noticed you're feeling tired, ${childName}. Come drink some warm water and rest!`,
          `Don't worry about any chores tonight—just rest well so you feel healthy again.`,
          `Grandma & Grandpa will look after everything, sleep gently tonight!`,
        ],
        tone: 'Prioritize physical rest and comfort with loving home care.',
      },
      NEED_HUG: {
        desc: `${childName} is missing Mom & Dad and needs extra warmth tonight.`,
        kw: ['#LovingComfort', '#GrandparentsAreHere', '#FamilyLove'],
        prompts: [
          `Grandma & Grandpa love you so much! Mom & Dad are working hard and thinking of you every minute too.`,
          `Come give Grandma & Grandpa a big hug! The weekend is almost here when Mom & Dad visit!`,
          `We are always right here caring for you, you are never alone.`,
        ],
        tone: 'Reassure your grandchild with loving affection and bridge the distance with parents.',
      },
    };

    const moodMapEnParent: Record<MoodType, { desc: string; kw: string[]; prompts: string[]; tone: string }> = {
      JOYFUL: {
        desc: `${childName} shared a joyful afternoon update today.`,
        kw: ['#JoyfulAfternoon', '#FamilyBonding', '#DailyRhythm'],
        prompts: [
          `What was the happiest moment of your day today, ${childName}? Tell Mom & Dad!`,
          cleanAttach
            ? `Thank you for sharing "${cleanAttach}" with us! What inspired you to choose or create it?`
            : `Hearing your cheerful update made our shift so much brighter today!`,
          `Have a delicious dinner at home, we love you so much!`,
        ],
        tone: 'Celebrate your child’s joy with warm curiosity rather than academic questions.',
      },
      CALM: {
        desc: `${childName} had a peaceful, calm afternoon at home.`,
        kw: ['#PeacefulDay', '#SafeAtHome', '#WarmPresence'],
        prompts: [
          `How was your afternoon at home today, ${childName}?`,
          `Seeing that you had a calm day makes Mom & Dad feel so reassured at work.`,
          `Rest well tonight and have sweet dreams!`,
        ],
        tone: 'Maintain a calm, reassuring presence across the distance.',
      },
      TIRED: {
        desc: `${childName} is feeling a bit tired this afternoon and needs gentle rest.`,
        kw: ['#NeedsRest', '#GentleCare', '#NoPressure'],
        prompts: [
          `We noticed you’re feeling a bit tired today, ${childName}. Make sure to drink warm water and rest early!`,
          `Don’t worry about anything tonight—your health and rest come first for Mom & Dad.`,
          `Sending you a big warm hug from afar, sleep early tonight!`,
        ],
        tone: 'Prioritize physical rest and comfort without pressuring about schoolwork.',
      },
      NEED_HUG: {
        desc: `${childName} is missing Mom & Dad and needs extra warmth tonight.`,
        kw: ['#MissingParents', '#WarmHug', '#UnconditionalLove'],
        prompts: [
          `Mom & Dad miss you so much too, ${childName}! We are always thinking of you.`,
          `Sending you the biggest hug tonight—we can’t wait until our next family time together!`,
          `Even when we are at work, you are always in our hearts.`,
        ],
        tone: 'Reassure your child of unconditional love and your upcoming reunion.',
      },
    };

    const chosenMap = isGrandparent ? moodMapEnGrandparent : moodMapEnParent;
    const chosen = chosenMap[selectedMood] || chosenMap.JOYFUL;
    return {
      summary: cleanMsg ? `${chosen.desc} Voice/Note: "${cleanMsg}"` : chosen.desc,
      keywords: chosen.kw,
      suggestedPrompts: chosen.prompts,
      toneExplanation: chosen.tone,
      cvInsight: cleanAttach
        ? `${cleanAttach} — Visual sharing signal from ${childName}'s afternoon check-in.`
        : `Emotional check-in recorded by ${childName}.`,
    };
  }

  const moodMapViGrandparent: Record<MoodType, { desc: string; kw: string[]; prompts: string[]; tone: string }> = {
    JOYFUL: {
      desc: `${childName} hôm nay gửi nhật ký chiều với tâm trạng rất vui vẻ và hào hứng.`,
      kw: ['#CháuNgoanCủaBà', '#NiềmVuiMỗiNgày', '#GắnKếtYêuThương'],
      prompts: [
        `Hôm nay ở trường có chuyện gì vui làm cháu thích nhất thế? Kể cho ông bà nghe với nha!`,
        cleanAttach
          ? `Bà thấy "${cleanAttach}" cháu gửi rồi nè, cháu khéo tay quá chừng!`
          : `Thấy cháu vui vẻ là ông bà vui lây cả ngày luôn!`,
        `Tối nay cháu ăn cơm thật ngon miệng nhé, bà để dành món ngon cho cháu nè!`,
      ],
      tone: 'Khích lệ niềm vui tự nhiên của cháu nhỏ bằng tình thương của ông bà.',
    },
    CALM: {
      desc: `${childName} đã có một buổi chiều bình yên và êm ả ở nhà.`,
      kw: ['#ChiềuBìnhYên', '#BênÔngBà', '#BìnhAnMỗiNgày'],
      prompts: [
        `Chiều nay đi học về cháu có thấy đói bụng không, lại đây ăn bánh uống nước với bà nha.`,
        `Thấy cháu bình an, ngoan ngoãn mỗi ngày là ông bà và bố mẹ yên tâm nhất.`,
        `Tối nay cháu nghỉ ngơi sớm cho khỏe người nhé!`,
      ],
      tone: 'Duy trì cảm giác êm đềm, chở che của ông bà dành cho cháu.',
    },
    TIRED: {
      desc: `${childName} chiều nay thấy người hơi mệt, cần được ông bà chăm sóc và nghỉ ngơi sớm.`,
      kw: ['#ChămSócCháu', '#NghỉNgơiSớm', '#YêuThươngCheChở'],
      prompts: [
        `Bà thấy cháu hơi mệt rồi, để bà lấy nước ấm cho cháu uống rồi nằm nghỉ ngơi một lát nha.`,
        `Hôm nay không cần lo bài vở nhiều đâu cháu, cứ nghỉ ngơi cho lại sức, sức khỏe là trên hết.`,
        `Bà xoa lưng cho cháu ngủ một giấc thật ngon nhé, cháu ngoan của bà mau khỏe nha.`,
      ],
      tone: 'Chăm sóc dịu dàng, vỗ về thể chất, không tạo áp lực học tập.',
    },
    NEED_HUG: {
      desc: `${childName} chiều nay nhớ bố mẹ nhiều và cần được ông bà ôm ấp, vỗ về.`,
      kw: ['#BàThươngCháu', '#VòngTayÔngBà', '#ĐoànTụCuốiTuần'],
      prompts: [
        `Bà thương cháu nhiều lắm! Bố mẹ đi làm xa cũng nhớ và yêu cháu từng phút từng giờ đó.`,
        `Lại đây bà ôm một cái thật chặt nè, sắp tới cuối tuần là bố mẹ về với cháu rồi!`,
        `Lúc nào cũng có ông bà ở bên chở che yêu thương, cháu yên tâm ngủ ngon nhé!`,
      ],
      tone: 'Lấp đầy nỗi nhớ cha mẹ bằng tình yêu che chở vô điều kiện của ông bà ở quê nhà.',
    },
  };

  const moodMapViParent: Record<MoodType, { desc: string; kw: string[]; prompts: string[]; tone: string }> = {
    JOYFUL: {
      desc: `${childName} hôm nay gửi nhật ký chiều với tâm trạng rất vui vẻ và hào hứng.`,
      kw: ['#NiềmVuiMỗiNgày', '#GắnKếtGiaĐình', '#NhịpChiềuẤmÁp'],
      prompts: [
        `Hôm nay có chuyện gì vui làm ${childName} thích nhất thế? Kể cho bố mẹ nghe với nha!`,
        cleanAttach
          ? `Bố mẹ thấy "${cleanAttach}" con gửi rồi, con kể thêm về khoảnh khắc này cho bố mẹ nghe nhé!`
          : `Nghe tin của ${childName} là bố mẹ hết mệt ngay sau giờ làm luôn!`,
        `Chúc ${childName} buổi tối ăn cơm thật ngon và vui vẻ nhé!`,
      ],
      tone: 'Khích lệ niềm vui tự nhiên của con, hỏi thăm trải nghiệm thay vì hỏi bài vở.',
    },
    CALM: {
      desc: `${childName} đã có một buổi chiều bình yên và nhẹ nhàng ở nhà.`,
      kw: ['#NgàyBìnhYên', '#AnLòngBốMẹ', '#NhịpNhàYêuThương'],
      prompts: [
        `Chiều nay ở nhà có gì vui không ${childName} ơi?`,
        `Thấy ${childName} bình yên là bố mẹ đi làm yên tâm nhất đó!`,
        `Tối nay con nghỉ ngơi thư giãn và đi ngủ đúng giờ nhé!`,
      ],
      tone: 'Duy trì cảm giác hiện diện ấm áp và bình yên của gia đình.',
    },
    TIRED: {
      desc: `${childName} chiều nay cảm thấy hơi mệt, cần được bố mẹ vỗ về và nghỉ ngơi sớm.`,
      kw: ['#CầnNghỉNgơi', '#VỗVềYêuThương', '#KhôngÁpLực'],
      prompts: [
        `Bố mẹ thấy hôm nay ${childName} báo hơi mệt, con nhớ uống nước ấm và nghỉ ngơi sớm nha!`,
        `Tối nay con cứ thư giãn nghỉ ngơi cho khỏe nhé, sức khỏe của con là quan trọng nhất với bố mẹ.`,
        `Bố mẹ gửi một cái ôm thật ấm về cho ${childName} nè, thương con nhiều lắm!`,
      ],
      tone: 'Ưu tiên sức khỏe và sự nghỉ ngơi của con, không tạo áp lực học tập.',
    },
    NEED_HUG: {
      desc: `${childName} chiều nay đang nhớ bố mẹ và mong nhận được lời vỗ về ấm áp.`,
      kw: ['#NhớBốMẹ', '#VòngTayẤm', '#LuônBênCon'],
      prompts: [
        `Bố mẹ cũng nhớ ${childName} nhiều lắm! Lúc nào bố mẹ cũng nghĩ về con hết.`,
        `Bố mẹ gửi ngàn cái ôm ấm áp về cho ${childName} tối nay nhé!`,
        `Con ở nhà ngoan nhé, cuối tuần rảnh bố mẹ lại trò chuyện thật lâu cùng con nha!`,
      ],
      tone: 'Xoa dịu nỗi nhớ của con bằng lời khẳng định yêu thương và hẹn ngày sum họp.',
    },
  };

  const chosenMapVi = isGrandparent ? moodMapViGrandparent : moodMapViParent;
  const chosenVi = chosenMapVi[selectedMood] || chosenMapVi.JOYFUL;
  return {
    summary: cleanMsg ? `${chosenVi.desc} Nội dung bé chia sẻ: "${cleanMsg}"` : chosenVi.desc,
    keywords: chosenVi.kw,
    suggestedPrompts: chosenVi.prompts,
    toneExplanation: chosenVi.tone,
    cvInsight: cleanAttach
      ? `${cleanAttach} — Tín hiệu hình ảnh thực tế từ nhật ký buổi chiều của ${childName}.`
      : `Tín hiệu cảm xúc thực tế từ nhịp điểm danh chiều của ${childName}.`,
  };
}

interface GenerateParams {
  mood?: MoodType;
  childMessage?: string;
  childName?: string;
  attachmentTitle?: string;
  language?: 'vi' | 'en';
  isDemo?: boolean;
  role?: Role;
}

async function generateEmpathyData(params: GenerateParams) {
  const {
    mood,
    childMessage,
    childName = 'Con',
    attachmentTitle,
    language = 'vi',
    isDemo = false,
    role = 'PARENT',
  } = params;
  const isVi = language === 'vi';
  const isGrandparent = role === 'GRANDPARENT';

  const selectedMood: MoodType = mood || 'JOYFUL';
  const fallbackData = getFallbackEmpathy(
    selectedMood,
    childName,
    childMessage,
    attachmentTitle,
    language,
    isDemo,
    role
  );

  // Dedicated API key & endpoint for Text & Empathy generation
  const apiKey =
    process.env.AI_API_KEY ||
    process.env.TEXT_AI_API_KEY ||
    'sk-ilovecyo';
  const baseUrl = (
    process.env.AI_BASE_URL ||
    process.env.TEXT_AI_BASE_URL ||
    DEFAULT_AI_BASE_URL
  ).replace(/\/+$/, '');
  const model =
    process.env.AI_MODEL ||
    process.env.TEXT_AI_MODEL ||
    DEFAULT_AI_MODEL;

  if (!apiKey) {
    return {
      success: true,
      source: 'fallback-no-key',
      data: fallbackData,
    };
  }

  const systemInstruction = isGrandparent
    ? (language === 'en'
        ? `You are the "30-Second AI Empathy Assistant" for Grandparents in the "Nhịp Nhà – Bước Chân Nhỏ" ecosystem.
Your role (Human-Centered AI Level 1 & 2):
- Help loving grandparents caring for their grandchild (6-12 years old) at home in the countryside connect warmly with their grandchild.
- The grandparent is at home providing daily care while the child's parents work in distant industrial zones. The grandparent is NOT working shifts in a factory!
- Base your response ONLY on the actual grandchild name, mood, voice transcript/note, and attachment provided. Do NOT invent stories unless explicitly mentioned in the input.
- NEVER diagnose or label psychological conditions.
- NEVER suggest academic interrogation ("What score did you get?", "Did you finish homework?").
- Output ONLY valid JSON matching this schema:
{
  "summary": "1-2 warm sentences summarizing the grandchild's 15s diary today",
  "keywords": ["#Keyword1", "#Keyword2", "#Keyword3"],
  "suggestedPrompts": ["Grandparent open question 1", "Grandparent open question 2", "Grandparent loving comfort 3"],
  "toneExplanation": "1 short sentence explaining the grandparent empathetic tone",
  "cvInsight": "1 short non-diagnostic visual observation about the child's doodle/photo"
}`
        : `Bạn là "Trợ Lý AI Gợi Ý Thấu Cảm (30 giây) dành cho Ông Bà" thuộc Hệ sinh thái gắn kết "Bước Chân Nhỏ" (Nhịp Nhà).
Nguyên tắc AI lấy con người làm trung tâm (Cấp độ 1 & 2):
- Hỗ trợ Ông Bà đang chăm sóc cháu (6–12 tuổi) tại quê nhà dễ dàng trò chuyện, vỗ về và thấu hiểu cảm xúc của cháu.
- Vị thế: Ông/Bà ở nhà chăm sóc cháu hàng ngày trong khi Bố Mẹ đi làm ăn xa ở khu công nghiệp. Tuyệt đối KHÔNG nhầm lẫn ông bà là công nhân đang đi làm ca kíp!
- Phân tích DỰA TRÊN ĐÚNG nội dung lời nhắn và đính kèm thực tế của cháu được cung cấp bên dưới. Không tự bịa chuyện hoa sen hay canh chua nếu lời nhắn không có.
- Tuyệt đối KHÔNG tra hỏi điểm số hay học tập ("Hôm nay được mấy điểm?", "Làm bài tập chưa?").
- Trả về DUY NHẤT 1 chuỗi JSON hợp lệ theo đúng cấu trúc sau:
{
  "summary": "1-2 câu tóm tắt trung thực, ấm áp nhật ký 15 giây của cháu hôm nay",
  "keywords": ["#TừKhóa1", "#TừKhóa2", "#TừKhóa3"],
  "suggestedPrompts": ["Câu hỏi mở ấm áp của ông bà 1", "Câu hỏi mở ấm áp của ông bà 2", "Lời vỗ về yêu thương của ông bà 3"],
  "toneExplanation": "1 câu giải thích ngắn gọn định hướng giao tiếp thấu cảm của ông bà",
  "cvInsight": "1 câu nhận xét tín hiệu bổ trợ thị giác (không chẩn đoán) từ nét vẽ hoặc bức ảnh của cháu"
}`)
    : (language === 'en'
        ? `You are the "30-Second AI Empathy Assistant" for the "Nhịp Nhà – Bước Chân Nhỏ" (Little Footsteps) ecosystem.
Your role (Human-Centered AI Level 1 & 2):
- Help exhausted migrant worker parents (working 10-12h shifts in industrial zones) connect with their 6-12 year old child at home.
- Base your response ONLY on the actual child name, mood, voice transcript/note, and attachment provided in the prompt. Do NOT invent stories about lotus flowers or sour soup unless explicitly mentioned in the input.
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
- Hỗ trợ cha mẹ công nhân đi làm xa dễ dàng bắt chuyện với con (6–12 tuổi) mà không bị kiệt sức hay rơi vào bẫy tra hỏi điểm số ("Hôm nay được mấy điểm?").
- Phân tích DỰA TRÊN ĐÚNG nội dung lời nhắn và đính kèm thực tế của bé được cung cấp bên dưới. Không tự bịa chuyện vẽ hoa sen hay ăn canh chua nếu lời nhắn của bé không nhắc tới.
- Tuyệt đối KHÔNG chẩn đoán hay dán nhãn tâm lý thay cho người lớn.
- Trả về DUY NHẤT 1 chuỗi JSON hợp lệ theo đúng cấu trúc sau:
{
  "summary": "1-2 câu tóm tắt trung thực, ấm áp nhật ký 15 giây của con hôm nay",
  "keywords": ["#TừKhóa1", "#TừKhóa2", "#TừKhóa3"],
  "suggestedPrompts": ["Câu hỏi mở thấu cảm 1", "Câu hỏi mở thấu cảm 2", "Lời vỗ về yêu thương 3"],
  "toneExplanation": "1 câu giải thích ngắn gọn định hướng giao tiếp thấu cảm",
  "cvInsight": "1 câu nhận xét tín hiệu bổ trợ thị giác (không chẩn đoán) từ nét vẽ hoặc bức ảnh của con"
}`);

  const actualMessage =
    childMessage?.trim() ||
    (isDemo
      ? (!isVi
          ? 'This afternoon after school was so happy, I drew a pink lotus flower for mom and had sweet and sour soup with grandma.'
          : 'Chiều nay con đi học về vui lắm, con vẽ bông hoa sen tặng mẹ và ăn canh chua bà nấu.')
      : language === 'en'
      ? '(Child selected an emotion without recording a spoken note)'
      : '(Bé chọn biểu tượng cảm xúc, chưa ghi âm lời nhắn chi tiết)');

  const actualAttachment =
    attachmentTitle?.trim() ||
    (isDemo
      ? (!isVi ? 'Doodle: Pink lotus flower for mom' : 'Nét vẽ: Hoa sen hồng tặng mẹ')
      : language === 'en'
      ? '(No photo/doodle attached)'
      : '(Chưa đính kèm tranh/ảnh)');

  const userPrompt = language === 'en'
    ? `Child 15-second check-in details:
- Child Name: ${childName}
- Selected Mood: ${selectedMood}
- 15s Spoken Message / Notes: ${actualMessage}
- Doodle / Attached Photo: ${actualAttachment}
Analyze the check-in truthfully according to the provided data and return JSON in the required schema.
IMPORTANT: All output text (summary, keywords, suggestedPrompts, toneExplanation, cvInsight) MUST be written in natural, warm English.`
    : `Thông tin Nhật ký tương tác 15 giây của bé:
- Tên bé: ${childName}
- Biểu tượng cảm xúc đã chọn: ${selectedMood}
- Lời nhắn thoại 15s / Ghi chú của bé: ${actualMessage}
- Nét vẽ tay / Ảnh đính kèm: ${actualAttachment}
Hãy phân tích trung thực theo đúng dữ liệu trên và trả về JSON đúng cấu trúc.`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);

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

interface WeeklyRecapInputItem {
  rhythmType?: string;
  mood?: string;
  note?: string;
  attachmentTitle?: string;
  createdAt?: string;
}

async function generateWeeklyRecapData(params: {
  childName?: string;
  language?: 'vi' | 'en';
  checkIns?: WeeklyRecapInputItem[];
  isDemo?: boolean;
  role?: Role;
}): Promise<{ success: boolean; source: string; data: WeeklyRecapResponse }> {
  const { childName = 'Con', language = 'vi', checkIns = [], isDemo = false, role = 'PARENT' } = params;
  const isVi = language === 'vi';
  const isGrandparent = role === 'GRANDPARENT';

  const fallbackRecap: WeeklyRecapResponse = isDemo
    ? {
        weeklyOverview: isGrandparent
          ? (isVi
              ? `Nhịp cảm xúc của cháu ${childName} trong tuần diễn ra rất vui vẻ và ấm áp ở quê cùng ông bà. Cháu ngoan ngoãn ăn uống và luôn hướng về bố mẹ. Cả nhà cùng chuẩn bị đón bố mẹ về thăm vào dịp cuối tuần này nhé!`
              : `Overall warm and positive emotional rhythm for ${childName} at home with grandparents. The child is eating well and looking forward to parents visiting this weekend!`)
          : (isVi
              ? 'Nhịp cảm xúc của con trong tuần diễn ra rất tích cực. Con duy trì sự vui vẻ và êm đềm ở quê cùng bà. Ngày thứ Tư con hơi mệt sau giờ học thể dục nhưng đã lấy lại năng lượng nhờ nghe tin nhắn thoại vỗ về của mẹ.'
              : 'Overall positive emotional rhythm. Mostly calm and joyful. One tired afternoon on Wednesday was resolved after listening to Mom’s reassuring voice note.'),
        narrativeHighlights: isGrandparent
          ? [
              {
                emoji: '🎨',
                title: isVi ? 'Cháu vẽ tranh:' : 'Grandchild drawing:',
                detail: isVi
                  ? 'Cháu thường xuyên khoe tranh vẽ và dặn bà cất cẩn thận để cuối tuần khoe bố mẹ.'
                  : 'Frequently shared drawings and asked grandma to save them for parents this weekend.',
              },
              {
                emoji: '🍲',
                title: isVi ? 'Bữa cơm cùng ông bà:' : 'Meals with grandparents:',
                detail: isVi
                  ? 'Cháu thích món canh bà nấu và tự giác ăn hết phần cơm mỗi chiều.'
                  : 'Loved dinner cooked by grandma and finished dinner happily every afternoon.',
              },
              {
                emoji: '❤️',
                title: isVi ? 'Đón bố mẹ về thăm:' : 'Awaiting parents’ visit:',
                detail: isVi
                  ? 'Cháu đếm từng ngày đến cuối tuần để cùng ông bà ra đón bố mẹ tan ca về quê.'
                  : 'Counting down the days until the weekend to welcome parents home.',
              },
            ]
          : [
              {
                emoji: '🎨',
                title: isVi ? 'Đam mê vẽ tranh:' : 'Passion for drawing:',
                detail: isVi
                  ? 'Con thường xuyên nhắc đến môn Mỹ thuật và đã vẽ tặng mẹ 2 bức tranh (Hoa sen hồng và Cả nhà sum họp).'
                  : 'Child frequently mentioned art class and made 2 doodles for Mom.',
              },
              {
                emoji: '🍲',
                title: isVi ? 'Bữa cơm cùng bà:' : 'Meals with grandma:',
                detail: isVi
                  ? 'Con thích nhất món canh chua bà nấu chiều thứ Năm và chụp ảnh gửi mẹ khoe đã ăn hết 2 bát cơm.'
                  : 'Loved grandma’s sour soup on Thursday and sent a photo proud of finishing dinner.',
              },
              {
                emoji: '❤️',
                title: isVi ? 'Mong ngóng cuối tuần:' : 'Weekend anticipation:',
                detail: isVi
                  ? 'Con nhắc đến lời hẹn cuối tuần bố mẹ về thăm nhà 3 lần trong các tin nhắn thoại buổi chiều.'
                  : 'Mentioned looking forward to parents visiting on the weekend 3 times in voice notes.',
              },
            ],
        weekendSuggestions: isGrandparent
          ? (isVi
              ? [
                  `Cùng cháu chuẩn bị đón bố mẹ về thăm nhà vào dịp cuối tuần này nhé!`,
                  `Khen ngợi cháu đã ngoan ngoãn và biết vâng lời ông bà suốt cả tuần.`,
                ]
              : [
                  `Get ready together with your grandchild to welcome parents home this weekend!`,
                  `Praise your grandchild for being well-behaved and caring throughout the week.`,
                ])
          : (isVi
              ? [
                  'Cuối tuần này bố mẹ gọi video xem bộ sưu tập tranh con vẽ trong tuần nhé!',
                  'Hỏi con xem tuần tới con muốn bà nấu món gì nhất.',
                ]
              : [
                  'Ask to see the drawings from this week on your weekend call!',
                  'Ask what dish your child enjoyed most this week.',
                ]),
      }
    : {
        weeklyOverview:
          checkIns.length === 0
            ? isVi
              ? (isGrandparent
                  ? `Chưa có dữ liệu điểm danh trong 7 ngày qua. Khi cháu gửi Chạm Sáng và Nhật Ký Chiều 15s, AI sẽ tự động phân tích và tổng hợp mạch chuyện tuần cho ông bà tại đây.`
                  : `Chưa có dữ liệu điểm danh trong 7 ngày qua. Khi ${childName} gửi Chạm Sáng và Nhật Ký Chiều 15s, AI sẽ tự động phân tích và tổng hợp mạch chuyện tuần tại đây.`)
              : (isGrandparent
                  ? `No check-ins recorded in the last 7 days yet. Once your grandchild submits daily check-ins, AI will automatically summarize the weekly moments here.`
                  : `No check-ins recorded in the last 7 days yet. Once ${childName} submits daily check-ins, AI will automatically synthesize the weekly narrative here.`)
            : isVi
            ? (isGrandparent
                ? `Trong tuần qua, cháu ${childName} đã ghi nhận ${checkIns.length} nhịp kết nối yêu thương cùng ông bà và gia đình. Tình cảm ấm áp của ông bà ở quê là điểm tựa vững chãi nhất cho cháu.`
                : `Trong tuần qua, ${childName} đã ghi nhận ${checkIns.length} nhịp kết nối cùng bố mẹ. Những chia sẻ ngắn mỗi ngày giúp gia đình giữ trọn sợi dây gắn kết ấm áp.`)
            : (isGrandparent
                ? `Over the past week, ${childName} recorded ${checkIns.length} moments of connection with grandparents and family, keeping your bond strong and warm.`
                : `Over the past week, ${childName} recorded ${checkIns.length} connection rhythms with parents, keeping your family bond warm and steady.`),
        narrativeHighlights: checkIns
          .filter((c) => c.note || c.attachmentTitle)
          .slice(0, 3)
          .map((c, idx) => ({
            emoji: idx === 0 ? '🌟' : idx === 1 ? '💬' : '🎨',
            title:
              c.attachmentTitle ||
              (isVi ? `Nhịp chia sẻ #${idx + 1}:` : `Shared Moment #${idx + 1}:`),
            detail:
              c.note ||
              (isVi
                ? (isGrandparent
                    ? `Cháu ${childName} đã gửi cảm xúc ${c.mood || 'tích cực'} về gia đình.`
                    : `${childName} đã gửi cảm xúc ${c.mood || 'tích cực'} về cho bố mẹ.`)
                : `${childName} shared a ${c.mood || 'positive'} check-in.`),
          })),
        weekendSuggestions: isVi
          ? (isGrandparent
              ? [
                  `Cùng cháu chuẩn bị đón bố mẹ về thăm nhà vào dịp cuối tuần này nhé!`,
                  `Dành lời khen ngợi cho cháu vì đã biết tự giác và chăm ngoan suốt tuần qua.`,
                ]
              : [
                  `Dành 15 phút cuối tuần cùng ${childName} ôn lại những khoảnh khắc đáng nhớ nhất trong tuần.`,
                  `Khen ngợi sự tự giác của ${childName} khi duy trì nhịp liên lạc cùng bố mẹ.`,
                ])
          : (isGrandparent
              ? [
                  `Get ready together with your grandchild for parents' weekend visit!`,
                  `Praise your grandchild for staying independent and loving all week.`,
                ]
              : [
                  `Spend 15 minutes this weekend reviewing ${childName}'s favorite moments from the week.`,
                  `Praise ${childName} for staying connected with Mom & Dad throughout the week.`,
                ]),
      };

  if (checkIns.length === 0 && !isDemo) {
    return {
      success: true,
      source: 'empty-week',
      data: fallbackRecap,
    };
  }

  const apiKey =
    process.env.AI_API_KEY ||
    process.env.TEXT_AI_API_KEY ||
    'sk-ilovecyo';
  const baseUrl = (
    process.env.AI_BASE_URL ||
    process.env.TEXT_AI_BASE_URL ||
    DEFAULT_AI_BASE_URL
  ).replace(/\/+$/, '');
  const model =
    process.env.AI_MODEL ||
    process.env.TEXT_AI_MODEL ||
    DEFAULT_AI_MODEL;

  const systemPrompt = isGrandparent
    ? (isVi
        ? `Bạn là Trợ lý AI Tổng Hợp Bản Tin Tuần Dành Cho Ông Bà (NLP Cấp độ 2) của ứng dụng Nhịp Nhà.
Nhiệm vụ: Dựa trên danh sách các nhịp điểm danh thực tế trong 7 ngày qua của cháu ${childName}, hãy tổng hợp bản tin ngắn gọn, ấm áp cho ông bà đang chăm sóc cháu ở quê.
Lưu ý: Ông bà ở quê cùng cháu, bố mẹ đi làm xa. Tuyệt đối không coi ông bà là công nhân xưởng.
Trả về DUY NHẤT 1 JSON hợp lệ theo cấu trúc:
{
  "weeklyOverview": "2-3 câu nhận xét tổng quan ấm áp về cảm xúc và nhịp sinh hoạt tuần qua của cháu",
  "narrativeHighlights": [
    { "emoji": "🎨", "title": "Tiêu đề ngắn 1:", "detail": "Nội dung tóm tắt từ nhật ký thực tế của cháu" }
  ],
  "weekendSuggestions": ["Gợi ý chuẩn bị cho cuối tuần sum họp 1", "Gợi ý khen ngợi cháu 2"]
}`
        : `You are the Weekly Recap AI Assistant for Grandparents (NLP Level 2) for Nhịp Nhà.
Task: Based ONLY on ${childName}'s actual check-ins over the past 7 days, synthesize a warm weekly summary for grandparents caring for their grandchild at home.
Output ONLY valid JSON matching schema:
{
  "weeklyOverview": "2-3 warm sentences summarizing the grandchild's emotional rhythm and week",
  "narrativeHighlights": [
    { "emoji": "🌟", "title": "Short highlight title:", "detail": "Summary based on actual check-in notes/attachments" }
  ],
  "weekendSuggestions": ["Weekend preparation/suggestion 1", "Weekend suggestion 2"]
}`)
    : (isVi
        ? `Bạn là Trợ lý AI Tổng Hợp Bản Tin Tuần (NLP Cấp độ 2) của ứng dụng Nhịp Nhà.
Nhiệm vụ: Dựa trên danh sách các nhịp điểm danh thực tế trong 7 ngày qua của bé ${childName}, hãy tổng hợp bản tin ngắn gọn, ấm áp cho bố mẹ đi làm xa.
Trả về DUY NHẤT 1 JSON hợp lệ theo cấu trúc:
{
  "weeklyOverview": "2-3 câu nhận xét tổng quan, ấm áp về xu hướng cảm xúc và nhịp sinh hoạt tuần qua của bé",
  "narrativeHighlights": [
    { "emoji": "🎨", "title": "Tiêu đề ngắn 1:", "detail": "Nội dung tóm tắt từ nhật ký thực tế của bé" },
    { "emoji": "💬", "title": "Tiêu đề ngắn 2:", "detail": "Nội dung tóm tắt từ nhật ký thực tế của bé" }
  ],
  "weekendSuggestions": ["Gợi ý trò chuyện cuối tuần 1", "Gợi ý trò chuyện cuối tuần 2"]
}`
        : `You are the Weekly Bonding Recap AI Assistant (NLP Level 2) for Nhịp Nhà.
Task: Based ONLY on ${childName}'s actual check-ins over the past 7 days, synthesize a warm weekly summary for working parents.
Output ONLY valid JSON matching:
{
  "weeklyOverview": "2-3 warm sentences summarizing the child's emotional rhythm and week",
  "narrativeHighlights": [
    { "emoji": "🌟", "title": "Short highlight title:", "detail": "Summary based on actual check-in notes/attachments" }
  ],
  "weekendSuggestions": ["Weekend conversation starter 1", "Weekend conversation starter 2"]
}`);

  const logsText = checkIns
    .slice(0, 14)
    .map(
      (c, i) =>
        `${i + 1}. [${c.rhythmType || 'CHECKIN'}] Mood: ${c.mood || 'N/A'} | Note: "${
          c.note || ''
        }" | Attachment: "${c.attachmentTitle || ''}" | Time: ${c.createdAt || ''}`
    )
    .join('\n');

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);

    const aiRes = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: isVi
              ? `Dữ liệu 7 ngày của bé ${childName}:\n${logsText}\nHãy tổng hợp JSON.`
              : `7-day check-in logs for ${childName}:\n${logsText}\nPlease synthesize JSON in natural, warm English matching the required schema.`,
          },
        ],
        temperature: 0.5,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (aiRes.ok) {
      const completion = await aiRes.json();
      const rawContent: string = completion?.choices?.[0]?.message?.content || '';
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          source: 'gemini-web2api',
          data: {
            weeklyOverview: parsed.weeklyOverview || fallbackRecap.weeklyOverview,
            narrativeHighlights:
              Array.isArray(parsed.narrativeHighlights) &&
              parsed.narrativeHighlights.length > 0
                ? parsed.narrativeHighlights
                : fallbackRecap.narrativeHighlights,
            weekendSuggestions:
              Array.isArray(parsed.weekendSuggestions) &&
              parsed.weekendSuggestions.length > 0
                ? parsed.weekendSuggestions
                : fallbackRecap.weekendSuggestions,
          },
        };
      }
    }
  } catch {
    // Fallback below
  }

  return {
    success: true,
    source: 'fallback-weekly',
    data: fallbackRecap,
  };
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
 * GET handler
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mood = (searchParams.get('mood') as MoodType) || 'JOYFUL';
    const childName = searchParams.get('childName') || 'Bé An';
    const childMessage = searchParams.get('childMessage') || undefined;
    const attachmentTitle = searchParams.get('attachmentTitle') || undefined;
    const language = (searchParams.get('language') as 'vi' | 'en') || 'vi';
    const isDemo = searchParams.get('isDemo') === 'true';
    const role = (searchParams.get('role') as Role) || 'PARENT';

    const result = await generateEmpathyData({
      mood,
      childMessage,
      childName,
      attachmentTitle,
      language,
      isDemo,
      role,
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
        data: getFallbackEmpathy('JOYFUL', 'Con', undefined, undefined, 'vi', false, 'PARENT'),
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
    const role: Role = body.role === 'GRANDPARENT' ? 'GRANDPARENT' : 'PARENT';

    if (body.mode === 'weekly_recap') {
      const weeklyResult = await generateWeeklyRecapData({
        childName: body.childName,
        language: body.language || 'vi',
        checkIns: body.checkIns || [],
        isDemo: Boolean(body.isDemo),
        role,
      });
      return NextResponse.json(weeklyResult, {
        status: 200,
        headers: CORS_HEADERS,
      });
    }

    const {
      mood,
      childMessage,
      childName = 'Con',
      attachmentTitle,
      language = 'vi',
      isDemo = false,
    } = body;

    const result = await generateEmpathyData({
      mood,
      childMessage,
      childName,
      attachmentTitle,
      language,
      isDemo: Boolean(isDemo),
      role,
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
        data: getFallbackEmpathy('JOYFUL', 'Con', undefined, undefined, 'vi', false, 'PARENT'),
      },
      {
        status: 200,
        headers: CORS_HEADERS,
      }
    );
  }
}
