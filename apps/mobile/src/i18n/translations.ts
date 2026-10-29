/**
 * Nhịp Nhà – Home Rhythm (RBPC 2026, RMIT University Vietnam, SDG 3, 4, 8)
 * Bi-lingual i18n Dictionary (Vietnamese & English)
 */

export type SupportedLanguage = 'vi' | 'en';
export type LanguagePreference = 'system' | 'vi' | 'en';

export const TRANSLATIONS = {
  vi: {
    // App info
    appName: 'Nhịp Nhà',
    appSubname: 'Gần nhau dù cách xa',
    competitionBadge: 'Đề án RBPC 2026 • RMIT Vietnam • SDG 3, 4, 8',

    // Language setting
    language: 'Ngôn ngữ / Language',
    languageSettingTitle: 'Chọn ngôn ngữ hiển thị',
    systemDefault: 'Theo hệ thống (Mặc định)',
    english: 'English (Tiếng Anh)',
    vietnamese: 'Tiếng Việt',

    // Zero-type login
    zeroTypeTitle: 'Ghép đôi 1 chạm (Zero-Type)',
    zeroTypeDesc: 'Kết nối không cần mật khẩu hay OTP. Dành cho trẻ em nông thôn và ông bà lớn tuổi.',
    familyQRCode: 'Mã QR Gia Đình',
    orEnterCode: 'Hoặc nhập mã số gia đình:',
    connectByCode: 'Kết Nối Bằng Mã Số',
    childRole: 'Vai Trẻ Em',
    parentRole: 'Vai Phụ Huynh',
    grandparentRole: 'Vai Ông Bà',
    oneTouchSuccess: 'Ghép đôi gia đình thành công!',

    // 3 Connection Rhythms
    threeRhythmsTitle: '3 Nhịp Gắn Kết Hôm Nay',
    threeRhythmsDesc: 'Bấm các nút lớn bên dưới để gửi tin yêu thương đến ba mẹ đang làm xa:',
    offlinePendingBadge: 'Chờ gửi ngoại tuyến',

    // Morning
    morningTitle: 'Chạm Sáng',
    morningSubtitle: 'Báo thức, chào ngày mới cùng ba mẹ',
    morningTimeWindow: '06:00 - 08:30 sáng',
    morningButtonPrompt: 'CHẠM ĐỂ CHÀO BA MẸ NGAY',
    morningAlreadyDone: '✓ Đã Chào Sáng Nay!',
    morningQuote: 'Chào ba mẹ, con đã dậy rồi!',
    morningAffirmation: 'Mỗi ngày con thức dậy đúng giờ, ăn sáng đầy đủ là niềm vui và động lực lớn nhất của ba mẹ khi đi làm xa.',

    // Afternoon
    afternoonTitle: 'Chạm Chiều',
    afternoonSubtitle: 'Cảm xúc tan trường & gửi lời nói 15 giây',
    afternoonTimeWindow: '16:00 - 18:30 chiều',
    afternoonStep1: '1. Hôm nay ở trường con thấy thế nào?',
    afternoonStep2: '2. Nói lời yêu thương 15 giây gửi ba mẹ',
    afternoonRecordBtn: 'Bắt Đầu Ghi Âm (15 Giây)',
    afternoonRecordAgain: 'Ghi Âm Lại (15 Giây)',
    afternoonStopBtn: 'Dừng Ghi Âm Ngay',
    afternoonSubmit: 'HOÀN TẤT & GỬI CHO BA MẸ',
    recordingTimeLeft: 'Đang thu âm: còn',
    offlineSavedMsg: 'Đã lưu trữ ngoại tuyến và sẵn sàng chuyển giao khi có mạng.',

    // 4 Emotions
    moodJoyful: 'Vui vẻ',
    moodJoyfulSub: 'Nhiều chuyện vui',
    moodCalm: 'Bình yên',
    moodCalmSub: 'Một ngày êm đềm',
    moodTired: 'Hơi mệt',
    moodTiredSub: 'Cần nghỉ ngơi xíu',
    moodNeedHug: 'Cần ôm',
    moodNeedHugSub: 'Nhớ bố mẹ nhiều',

    // Evening
    eveningTitle: 'Chạm Tối',
    eveningSubtitle: 'Nghe lời dặn dò ấm áp từ ba mẹ',
    eveningTimeWindow: '20:00 - 22:00 tối',
    eveningPlayBtn: 'BẤM ĐỂ NGHE GIỌNG NÓI CỦA MẸ',
    eveningPauseBtn: 'Tạm Dừng Nghe',
    eveningListenedBadge: '✓ Đã nghe dặn dò',
    eveningBedtimeTip: 'Dặn dò ông bà & bé: Nhớ uống ly nước ấm, mắc mùng chống muỗi và ngủ ngoan trước 21:30 nhé!',
    eveningMotherNote: 'Lời mẹ nhắn nhủ:',

    // Parent Dashboard
    parentDashboardTitle: 'Nhật Ký Ngày Của Bé',
    parentSubtitle: 'Phụ huynh công nhân làm việc xa',
    timelineTitle: 'Dòng Thời Gian "3 Nhịp" Của Con',
    aiAssistantTitle: 'Trợ Lý Thấu Cảm (AI Empathy)',
    aiAssistantDesc: 'Tóm tắt trung thực điều con kể & gợi ý câu hỏi mở trong 30 giây để tránh tra khảo điểm số:',
    aiPromptPick: 'Chọn 1 gợi ý thấu cảm để đọc/ghi âm gửi con:',
    quick30sTitle: 'Phản Hồi Nhanh 30 Giây (Gửi Bé Vào Chạm Tối)',
    quick30sDesc: 'Sau ca làm mệt mỏi, hãy dùng 30 giây tiếp thêm hơi ấm cho con:',
    quick30sRecordBtn: 'Bắt Đầu Ghi Âm 30 Giây',
    quick30sSendBtn: 'Dừng & Gửi Về Quê Cho Con Ngay',
    sentBedtimeSuccess: 'Đã gửi lời dặn dò về điện thoại bé ở quê!',

    // Common navigation & switcher
    back: 'Quay Lại',
    backHome: 'Quay Lại Trang Chủ',
    switchRoleBtn: 'Chuyển Đổi Vai Trải Nghiệm / Cài Đặt',
    switchToChild: 'Chuyển sang: Trẻ Em (Bé An 8 tuổi)',
    switchToParent: 'Chuyển sang: Phụ Huynh (Mẹ Hoa)',
    switchToGrandparent: 'Chế độ: Ông Bà (Bà Bảy 68 tuổi)',
    resetQR: 'Quét Lại Mã QR (Zero-Type Login)',
  },

  en: {
    // App info
    appName: 'Home Rhythm',
    appSubname: 'Close at heart, miles apart',
    competitionBadge: 'RBPC 2026 Project • RMIT Vietnam • SDG 3, 4, 8',

    // Language setting
    language: 'Language / Ngôn ngữ',
    languageSettingTitle: 'Display Language Selection',
    systemDefault: 'System Default',
    english: 'English',
    vietnamese: 'Tiếng Việt (Vietnamese)',

    // Zero-type login
    zeroTypeTitle: '1-Touch Zero-Type Pairing',
    zeroTypeDesc: 'No passwords or SMS OTPs needed. Tailored for rural children and elderly grandparents.',
    familyQRCode: 'Family QR Code',
    orEnterCode: 'Or enter 4-digit family code:',
    connectByCode: 'Connect with Code',
    childRole: 'Child Role',
    parentRole: 'Parent Role',
    grandparentRole: 'Grandparent Role',
    oneTouchSuccess: 'Family paired successfully!',

    // 3 Connection Rhythms
    threeRhythmsTitle: "Today's 3 Connection Rhythms",
    threeRhythmsDesc: 'Tap the large buttons below to share daily love with parents working afar:',
    offlinePendingBadge: 'Pending offline upload',

    // Morning
    morningTitle: 'Morning Touch',
    morningSubtitle: 'Wake up & greet parents before school',
    morningTimeWindow: '06:00 - 08:30 AM',
    morningButtonPrompt: 'TAP TO GREET PARENTS NOW',
    morningAlreadyDone: '✓ Greeted This Morning!',
    morningQuote: 'Good morning parents, I am awake!',
    morningAffirmation: 'Waking up on time and eating breakfast gives your parents the biggest strength while working far away.',

    // Afternoon
    afternoonTitle: 'Afternoon Touch',
    afternoonSubtitle: 'After-school feelings & 15-second voice memo',
    afternoonTimeWindow: '04:00 - 06:30 PM',
    afternoonStep1: '1. How did you feel at school today?',
    afternoonStep2: '2. Record a 15-second loving voice note',
    afternoonRecordBtn: 'Start Recording (15s)',
    afternoonRecordAgain: 'Record Again (15s)',
    afternoonStopBtn: 'Stop Recording Now',
    afternoonSubmit: 'COMPLETE & SEND TO PARENTS',
    recordingTimeLeft: 'Recording: remaining',
    offlineSavedMsg: 'Stored offline-first and queued for automatic sync when network connects.',

    // 4 Emotions
    moodJoyful: 'Joyful',
    moodJoyfulSub: 'Lots of happy news',
    moodCalm: 'Calm',
    moodCalmSub: 'A peaceful day',
    moodTired: 'Tired',
    moodTiredSub: 'Need a little rest',
    moodNeedHug: 'Need a Hug',
    moodNeedHugSub: 'Miss parents a lot',

    // Evening
    eveningTitle: 'Evening Touch',
    eveningSubtitle: 'Listen to loving bedtime messages from parents',
    eveningTimeWindow: '08:00 - 10:00 PM',
    eveningPlayBtn: "TAP TO HEAR MOTHER'S VOICE",
    eveningPauseBtn: 'Pause Audio',
    eveningListenedBadge: '✓ Listened to bedtime message',
    eveningBedtimeTip: 'Grandparent & child tip: Drink warm water, secure the mosquito net, and sleep by 9:30 PM for a great school day tomorrow!',
    eveningMotherNote: "Mother's bedtime note:",

    // Parent Dashboard
    parentDashboardTitle: "Child's Daily Diary",
    parentSubtitle: 'Migrant worker parents in industrial zones',
    timelineTitle: 'Child 3-Rhythm Timeline',
    aiAssistantTitle: 'AI Empathy Assistant',
    aiAssistantDesc: 'Faithfully summarizes child feelings & generates 30s open-ended prompts to avoid score grilling:',
    aiPromptPick: 'Choose an empathy prompt to read/record for your child:',
    quick30sTitle: '30-Second Quick Response (Sent for Evening Touch)',
    quick30sDesc: 'After a hard shift, take 30 seconds to send warmth home:',
    quick30sRecordBtn: 'Record 30-Second Bedtime Note',
    quick30sSendBtn: 'Stop & Send Home Instantly',
    sentBedtimeSuccess: 'Bedtime note sent to your child at home!',

    // Common navigation & switcher
    back: 'Back',
    backHome: 'Back to Home',
    switchRoleBtn: 'Switch Demo Role / Settings',
    switchToChild: 'Switch to: Child (Be An, 8 y/o)',
    switchToParent: 'Switch to: Parent (Mother Hoa)',
    switchToGrandparent: 'Mode: Grandparent (Grandmother Bay, 68 y/o)',
    resetQR: 'Scan QR Code Again (Zero-Type Login)',
  },
};

export type TranslationKey = keyof typeof TRANSLATIONS['vi'];
