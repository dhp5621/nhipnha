/**
 * Nhịp Nhà – Hệ sinh thái gắn kết và tự lập "Bước Chân Nhỏ" (Little Footsteps)
 * Bi-lingual i18n Dictionary (Vietnamese & English)
 * Aligned with Proposal Section 5.1 – 5.6
 */

export type SupportedLanguage = 'vi' | 'en';
export type LanguagePreference = 'system' | 'vi' | 'en';

export const TRANSLATIONS = {
  vi: {
    // App & Ecosystem Identity (Section 5)
    appName: 'Nhịp Nhà',
    appSubname: 'Hệ sinh thái gắn kết & tự lập "Bước Chân Nhỏ"',
    competitionBadge: 'Hệ sinh thái "Bước Chân Nhỏ" • Nhịp sinh hoạt 3 nhịp gắn kết',
    ecosystemTag: 'BƯỚC CHÂN NHỎ • KÊNH AN TOÀN CHO TRẺ XA CHA MẸ',

    // Language setting
    language: 'Ngôn ngữ / Language',
    languageSettingTitle: 'Ngôn ngữ hiển thị (2 Ngôn ngữ)',
    systemDefault: 'Tự động theo máy',
    english: 'English (Tiếng Anh)',
    vietnamese: 'Tiếng Việt',

    // Zero-type login
    zeroTypeTitle: 'Ghép đôi 1 chạm (Zero-Type)',
    zeroTypeDesc: 'Thiết kế tối ưu cho điện thoại cũ của ông bà và máy tính bảng giá rẻ. Không cần mật khẩu hay OTP.',
    familyQRCode: 'Mã QR Gia Đình Ở Quê',
    orEnterCode: 'Hoặc nhập mã số gia đình:',
    connectByCode: 'Kết Nối Gia Đình Ngay',
    childRole: 'Trẻ ở quê (6–12 tuổi)',
    parentRole: 'Cha mẹ đi làm xa (28–42 tuổi)',
    grandparentRole: 'Ông bà chăm cháu (Chữ lớn)',
    oneTouchSuccess: 'Ghép đôi gia đình thành công!',

    // 3 Connection Rhythms Overview (Section 5.2)
    threeRhythmsTitle: 'Nhịp Sinh Hoạt "3 Nhịp Gắn Kết"',
    threeRhythmsDesc: 'Hộp thư thoại bất đồng bộ 1 chạm & Nhật ký tương tác 15s — Tự nguyện, nhẹ nhàng, xóa bỏ áp lực phải gọi cùng lúc:',
    offlinePendingBadge: 'Chế độ Offline gửi sau',

    // Morning (Section 5.1 & 5.2: 06:30 - 07:15)
    morningTitle: 'Nhịp Sáng',
    morningSubtitle: 'Tiếng chuông buổi sáng & Hộp thư thoại 1 chạm',
    morningTimeWindow: '06:30 – 07:15 sáng',
    morningBellTitle: 'Tiếng chuông buổi sáng từ Bố Mẹ (Hẹn giờ)',
    morningBellMessage: '“An ơi dậy đi học nhé! Bố mẹ vào ca sáng rồi, chúc con yêu hôm nay ở lớp thật vui vẻ nha!”',
    morningListenBellBtn: 'Nghe Lời Chúc Hẹn Giờ Của Bố Mẹ',
    morningButtonPrompt: 'GỬI TIN NHẮN THOẠI CHÀO BUỔI SÁNG (1 CHẠM)',
    morningAlreadyDone: 'Đã Gửi Lời Chào Buổi Sáng!',
    morningQuote: 'Con chuẩn bị đi học đây ạ!',
    morningAffirmation: 'Tạo điểm tựa tinh thần giúp con vững tin bước vào lớp, bố mẹ an tâm bắt đầu ca làm việc nơi xa.',

    // Afternoon (Section 5.1 & 5.2: 17:00 - 18:30)
    afternoonTitle: 'Nhịp Chiều',
    afternoonSubtitle: 'Nhật ký tương tác 15 giây (Tự nguyện & Nhẹ nhàng)',
    afternoonTimeWindow: '17:00 – 18:30 chiều',
    afternoonSafeChannelBadge: 'Kênh an toàn: Không ép buộc, không phán xét hay tra hỏi điểm số',
    afternoonStep1: '1. Điểm danh cảm xúc hôm nay:',
    afternoonStep2: '2. Ghi âm nhanh 15 giây kể chuyện trong ngày:',
    afternoonStep3: '3. Đính kèm 1 bức ảnh chụp hoặc nét vẽ tay nhanh:',
    afternoonRecordBtn: 'Bắt Đầu Ghi Âm 15 Giây',
    afternoonRecordAgain: 'Thu Âm Lại (15 Giây)',
    afternoonStopBtn: 'Dừng Ghi Âm Ngay',
    afternoonSubmit: 'GỬI NHẬT KÝ 15 GIÂY VÀO HỘP THƯ GIA ĐÌNH',
    recordingTimeLeft: 'Đang thu âm: còn',
    offlineSavedMsg: 'Đã lưu vào Hộp thư thoại bất đồng bộ (tự động gửi khi có mạng).',

    // 4 Emotions
    moodJoyful: 'Vui vẻ',
    moodJoyfulSub: 'Nhiều chuyện vui',
    moodCalm: 'Bình yên',
    moodCalmSub: 'Một ngày êm đềm',
    moodTired: 'Hơi mệt',
    moodTiredSub: 'Cần nghỉ ngơi xíu',
    moodNeedHug: 'Cần ôm',
    moodNeedHugSub: 'Nhớ bố mẹ nhiều',

    // Evening & Weekend (Section 5.2: 20:30 - 21:00)
    eveningTitle: 'Nhịp Tối & Cuối Tuần',
    eveningSubtitle: 'Hộp thư thoại chúc ngủ ngon & Tâm sự thêm',
    eveningTimeWindow: '20:30 – 21:00 tối',
    eveningPlayBtn: 'BẤM NGHE LỜI CHÚC NGỦ NGON TỪ BỐ MẸ',
    eveningPauseBtn: 'Tạm Dừng Phát',
    eveningListenedBadge: 'Đã nghe thông điệp yêu thương',
    eveningBedtimeTip: 'Xoa dịu nỗi cô đơn ban đêm, nuôi dưỡng tình cảm gia đình đều đặn trước giờ đi ngủ.',
    eveningMotherNote: 'Thông điệp yêu thương trong hộp thư tối:',
    eveningExtraReplyTitle: 'Con có tâm sự thêm muốn gửi bố mẹ trước khi ngủ?',
    eveningExtraReplyBtn: 'Gửi Thêm Tâm Sự Qua Hộp Thư Thoại',
    eveningExtraReplySent: 'Đã gửi tâm sự tối cho bố mẹ!',

    // Parent Dashboard (Section 5.1, 5.2, 5.3, 5.4, 5.6)
    parentDashboardTitle: 'Không Gian Cha Mẹ Đi Làm Xa',
    parentSubtitle: 'Thao tác nhanh 1–3 phút sau ca làm 10–12 tiếng • Xóa bỏ cắn rứt lương tâm',
    timelineTitle: 'Mạch Kết Nối "3 Nhịp Sinh Hoạt" Hôm Nay',
    aiAssistantTitle: 'AI Gợi Ý Thấu Cảm (Hỗ Trợ 30 Giây)',
    aiAssistantDesc: 'AI tự động chuyển giọng nói địa phương thành văn bản, trích xuất từ khóa & gợi ý câu hỏi mở để cha mẹ kiệt sức sau ca làm dễ dàng bắt chuyện đúng tâm lý:',
    aiLevelBadge: 'AI Cấp độ 1 & 2 • Lấy con người làm trung tâm',
    aiHumanCenteredNote: 'Nguyên tắc AI: AI chỉ hỗ trợ bố mẹ lắng nghe tốt hơn, tuyệt đối không tự diễn giải hay dán nhãn tâm lý thay cho người lớn.',
    aiKeywordsLabel: 'Từ khóa nhật ký hôm nay:',
    cvSignalTitle: 'Tín hiệu bổ trợ Thị giác máy tính (Từ nét vẽ/ảnh của con):',
    aiPromptPick: 'Chọn 1 câu hỏi mở thấu cảm (thay vì hỏi điểm số khô khan):',
    quick30sTitle: 'Hộp Thư Thoại & Hẹn Giờ Tiếng Chuông Sáng',
    quick30sDesc: 'Gửi lời chúc ngủ ngon tối nay hoặc hẹn giờ "Tiếng chuông buổi sáng" (06:30) cho con:',
    quick30sRecordBtn: 'Ghi Âm 30 Giây Gửi Hộp Thư Thoại',
    quick30sSendBtn: 'Dừng & Gửi Về Quê Cho Con Ngay',
    sentBedtimeSuccess: 'Đã gửi vào Hộp thư thoại bất đồng bộ cho con!',

    // Weekly Recap (Section 5.1 & 5.2: Bản tin tổng kết tuần)
    weeklyRecapTitle: 'Bản Tin Tổng Kết Tuần (Weekly Recap)',
    weeklyRecapSubtitle: 'Toàn cảnh mạch chuyện, cảm xúc và cột mốc 7 ngày để bố mẹ không bỏ lỡ hành trình khôn lớn của con:',
    weeklyMilestone1: 'Cột mốc: Tự giác dậy đúng giờ 6/7 buổi sáng & khoe nét vẽ hoa sen tặng mẹ.',
    weeklyMilestone2: 'Xu hướng cảm xúc: 5 ngày Vui vẻ/Bình yên, 1 buổi chiều Cần ôm vì nhớ bố mẹ.',
    weeklyRecurringTopics: 'Chủ đề con nhắc nhiều (AI Cấp độ 2): Chuyện vẽ tranh ở lớp, món canh chua bà nấu, mong cuối tuần bố mẹ về.',
    weeklyEditableNote: 'Bản tóm tắt nội dung trò chuyện (Phụ huynh & trẻ có quyền chỉnh sửa hoặc bỏ qua).',

    // Common navigation & switcher
    back: 'Quay Lại',
    backHome: 'Về Màn Hình Chính',
    switchRoleBtn: 'Chuyển Đổi Vai Trò & Ngôn Ngữ',
    switchToChild: 'Trẻ ở quê: Bé An (8 tuổi – Tiểu học)',
    switchToParent: 'Cha mẹ đi làm xa: Mẹ Hoa (KCN Bình Dương)',
    switchToGrandparent: 'Ông bà ở quê: Bà Nội Bảy (Chữ cực lớn)',
    resetQR: 'Quét Lại Mã QR Gia Đình (Zero-Type Login)',
  },

  en: {
    // App & Ecosystem Identity (Section 5)
    appName: 'Nhịp Nhà (Home Rhythm)',
    appSubname: '"Little Footsteps" Bonding & Independence Ecosystem',
    competitionBadge: '"Little Footsteps" Ecosystem • 3-Rhythm Daily Bonding',
    ecosystemTag: 'LITTLE FOOTSTEPS • SAFE CHANNEL FOR LEFT-BEHIND CHILDREN',

    // Language setting
    language: 'Language / Ngôn ngữ',
    languageSettingTitle: 'Display Language (Bilingual)',
    systemDefault: 'System Auto',
    english: 'English',
    vietnamese: 'Tiếng Việt (Vietnamese)',

    // Zero-type login
    zeroTypeTitle: '1-Touch Zero-Type Pairing',
    zeroTypeDesc: 'Optimized for grandparents’ older phones and budget tablets. No passwords or SMS OTPs needed.',
    familyQRCode: 'Home Family QR Code',
    orEnterCode: 'Or enter 4-digit family code:',
    connectByCode: 'Connect Family Now',
    childRole: 'Rural Child (6–12 y/o)',
    parentRole: 'Migrant Parent (28–42 y/o)',
    grandparentRole: 'Grandparent (Extra-Large Font)',
    oneTouchSuccess: 'Family paired successfully!',

    // 3 Connection Rhythms Overview (Section 5.2)
    threeRhythmsTitle: '3-Rhythm Daily Bonding Routine',
    threeRhythmsDesc: '1-Touch Async Voice Mailbox & 15s Interactive Diary — Voluntary, gentle, removing the pressure of simultaneous calls:',
    offlinePendingBadge: 'Offline-first deferred sync',

    // Morning (Section 5.1 & 5.2: 06:30 - 07:15)
    morningTitle: 'Morning Rhythm',
    morningSubtitle: 'Scheduled Morning Bell & 1-Touch Voice Mailbox',
    morningTimeWindow: '06:30 – 07:15 AM',
    morningBellTitle: 'Scheduled Morning Bell from Parents',
    morningBellMessage: '“Time to wake up for school, An! Mom and Dad just started our morning shift, have a joyful day at class!”',
    morningListenBellBtn: "Play Parents' Scheduled Morning Bell",
    morningButtonPrompt: 'SEND 1-TOUCH MORNING VOICE GREETING',
    morningAlreadyDone: 'Morning Voice Greeting Sent!',
    morningQuote: 'I am ready to go to school now!',
    morningAffirmation: 'Creates an emotional anchor so children step into class with confidence and parents start their shift with peace of mind.',

    // Afternoon (Section 5.1 & 5.2: 17:00 - 18:30)
    afternoonTitle: 'Afternoon Rhythm',
    afternoonSubtitle: '15-Second Interactive Diary (Voluntary & Gentle)',
    afternoonTimeWindow: '05:00 – 06:30 PM',
    afternoonSafeChannelBadge: 'Safe Channel: Voluntary, judgment-free, zero academic interrogation',
    afternoonStep1: '1. Check in your emotion today:',
    afternoonStep2: '2. Record a quick 15-second voice story:',
    afternoonStep3: '3. Attach 1 quick photo or hand-drawn doodle:',
    afternoonRecordBtn: 'Start 15-Second Voice Diary',
    afternoonRecordAgain: 'Record Again (15s)',
    afternoonStopBtn: 'Stop Recording Now',
    afternoonSubmit: 'SEND 15S DIARY TO FAMILY MAILBOX',
    recordingTimeLeft: 'Recording: remaining',
    offlineSavedMsg: 'Saved to Async Voice Mailbox (auto-syncs when online).',

    // 4 Emotions
    moodJoyful: 'Joyful',
    moodJoyfulSub: 'Lots of happy news',
    moodCalm: 'Calm',
    moodCalmSub: 'A peaceful day',
    moodTired: 'Tired',
    moodTiredSub: 'Need a little rest',
    moodNeedHug: 'Need a Hug',
    moodNeedHugSub: 'Miss parents a lot',

    // Evening & Weekend (Section 5.2: 20:30 - 21:00)
    eveningTitle: 'Evening & Weekend Rhythm',
    eveningSubtitle: 'Bedtime Voice Mailbox & Extra Heart-to-Heart',
    eveningTimeWindow: '08:30 – 09:00 PM',
    eveningPlayBtn: "PLAY PARENTS' BEDTIME VOICE MESSAGE",
    eveningPauseBtn: 'Pause Playback',
    eveningListenedBadge: 'Listened to loving message',
    eveningBedtimeTip: 'Soothes nighttime loneliness and nurtures steady family warmth before sleep.',
    eveningMotherNote: 'Loving message in tonight’s voice mailbox:',
    eveningExtraReplyTitle: 'Want to share more thoughts with Mom & Dad before sleep?',
    eveningExtraReplyBtn: 'Send Extra Bedtime Voice Reply',
    eveningExtraReplySent: 'Bedtime reply sent to parents!',

    // Parent Dashboard (Section 5.1, 5.2, 5.3, 5.4, 5.6)
    parentDashboardTitle: 'Migrant Parent Hub (1–3 Min)',
    parentSubtitle: 'Quick 1–3 min check-in after a 10–12h shift • Relieving parental guilt',
    timelineTitle: "Today's 3-Rhythm Connection Flow",
    aiAssistantTitle: '30-Second AI Empathy Assistant',
    aiAssistantDesc: 'Transcribes regional Vietnamese speech, extracts keywords & suggests open-ended prompts so exhausted parents can connect empathetically:',
    aiLevelBadge: 'Human-Centered AI • Level 1 & 2',
    aiHumanCenteredNote: 'Human-Centered Principle: AI only helps adults listen better—it never diagnoses or labels a child’s psychology.',
    aiKeywordsLabel: "Today's diary keywords:",
    cvSignalTitle: 'Computer Vision Supplemental Signal (Doodle/Photo):',
    aiPromptPick: 'Pick 1 open-ended empathy question (avoiding dry grade grilling):',
    quick30sTitle: 'Async Voice Mailbox & Morning Bell Scheduler',
    quick30sDesc: 'Send tonight’s bedtime note or schedule tomorrow’s 06:30 AM Morning Bell:',
    quick30sRecordBtn: 'Record 30s Voice Mailbox Note',
    quick30sSendBtn: 'Stop & Send to Family Mailbox',
    sentBedtimeSuccess: 'Sent to your child’s Async Voice Mailbox!',

    // Weekly Recap (Section 5.1 & 5.2)
    weeklyRecapTitle: 'Weekly Recap Newsletter',
    weeklyRecapSubtitle: '7-day overview of stories, mood trends, and milestones so busy parents never miss their child growing up:',
    weeklyMilestone1: 'Milestone: Woke up on time 6/7 mornings & drew a pink lotus flower for Mom.',
    weeklyMilestone2: 'Mood Trend: 5 Joyful/Calm days, 1 afternoon needing a hug while missing parents.',
    weeklyRecurringTopics: 'Recurring Themes (AI Level 2): Drawing class, Grandma’s sour soup, waiting for parents’ weekend visit.',
    weeklyEditableNote: 'Conversation Summary (Parents & children can edit, skip, or delete at any time).',

    // Common navigation & switcher
    back: 'Back',
    backHome: 'Back to Home',
    switchRoleBtn: 'Switch Persona & Language',
    switchToChild: 'Rural Child: Be An (8 y/o – Primary School)',
    switchToParent: 'Migrant Parent: Mother Hoa (Industrial Zone)',
    switchToGrandparent: 'Grandparent: Grandma Bay (Extra-Large Font)',
    resetQR: 'Scan Family QR Code Again (Zero-Type Login)',
  },
};

export type TranslationKey = keyof typeof TRANSLATIONS['vi'];
