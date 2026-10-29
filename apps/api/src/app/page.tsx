'use client';

import React, { useState } from 'react';

type Lang = 'vi' | 'en';
type Persona = 'CHILD' | 'PARENT' | 'GRANDPARENT';
type Mood = 'JOYFUL' | 'CALM' | 'TIRED' | 'NEED_HUG';

export default function HomePage() {
  const [lang, setLang] = useState<Lang>('vi');
  const [persona, setPersona] = useState<Persona>('CHILD');
  const [selectedMood, setSelectedMood] = useState<Mood>('JOYFUL');
  const [selectedDoodle, setSelectedDoodle] = useState<number>(0);
  const [morningDone, setMorningDone] = useState<boolean>(true);
  const [afternoonDone, setAfternoonDone] = useState<boolean>(true);
  const [eveningDone, setEveningDone] = useState<boolean>(false);

  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [liveAiResult, setLiveAiResult] = useState<{
    summary?: string;
    keywords?: string[];
    suggestedPrompts?: string[];
    cvInsight?: string;
    source?: string;
  } | null>(null);

  const triggerLiveServerAi = async (moodToUse: Mood, doodleIdx: number, langToUse: Lang) => {
    setAiLoading(true);
    try {
      const d = doodles[doodleIdx];
      const res = await fetch('/api/ai/empathy-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: moodToUse,
          childName: 'Bé An',
          attachmentTitle: langToUse === 'vi' ? d.vi : d.en,
          language: langToUse,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setLiveAiResult({ ...json.data, source: json.source });
      }
    } catch {
      // Fallback to preset if network error
    } finally {
      setAiLoading(false);
    }
  };

  const isVi = lang === 'vi';
  const isElder = persona === 'GRANDPARENT';

  const moods: { id: Mood; emoji: string; vi: string; en: string; subVi: string; subEn: string; bg: string; border: string; text: string }[] = [
    { id: 'JOYFUL', emoji: '😄', vi: 'Vui vẻ', en: 'Joyful', subVi: 'Nhiều chuyện vui', subEn: 'Lots of happy news', bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
    { id: 'CALM', emoji: '⛅', vi: 'Bình yên', en: 'Calm', subVi: 'Một ngày êm đềm', subEn: 'A peaceful day', bg: '#E0F2FE', border: '#0284C7', text: '#075985' },
    { id: 'TIRED', emoji: '🌧️', vi: 'Hơi mệt', en: 'Tired', subVi: 'Cần nghỉ ngơi xíu', subEn: 'Need a little rest', bg: '#F3F4F6', border: '#6B7280', text: '#374151' },
    { id: 'NEED_HUG', emoji: '🫂', vi: 'Cần ôm', en: 'Need a Hug', subVi: 'Nhớ bố mẹ nhiều', subEn: 'Miss parents a lot', bg: '#FCE7F3', border: '#EC4899', text: '#9D174D' },
  ];

  const doodles = [
    {
      emoji: '🪷',
      vi: 'Nét vẽ: Hoa sen hồng tặng mẹ',
      en: 'Doodle: Pink lotus flower for Mom',
      cvVi: 'Tín hiệu bổ trợ Thị giác máy tính: Gam màu hồng ấm & vàng tươi — Trẻ giàu tình cảm, hướng về gia đình.',
      cvEn: 'Computer Vision Supplemental Signal: Warm pink & bright yellow — Positive family affection.',
    },
    {
      emoji: '🏡',
      vi: 'Nét vẽ: Cả nhà mình sum họp',
      en: 'Doodle: Our family together at home',
      cvVi: 'Tín hiệu bổ trợ Thị giác máy tính: Chủ đề ngôi nhà & mặt trời — Trẻ mong ngóng ngày cuối tuần bố mẹ về thăm.',
      cvEn: 'Computer Vision Supplemental Signal: Home & sunshine theme — Looking forward to parents visiting.',
    },
    {
      emoji: '🍲',
      vi: 'Ảnh chụp: Bữa cơm canh chua bà nấu',
      en: "Photo: Grandma's sour soup dinner",
      cvVi: 'Tín hiệu bổ trợ Thị giác máy tính: Sinh hoạt bữa tối — Trẻ ăn uống đầy đủ cùng ông bà tại quê nhà.',
      cvEn: 'Computer Vision Supplemental Signal: Daily meal — Nutritious dinner shared with grandparents.',
    },
  ];

  const aiPromptsByMood: Record<Mood, { summaryVi: string; summaryEn: string; promptsVi: string[]; promptsEn: string[] }> = {
    JOYFUL: {
      summaryVi: 'Bé An hôm nay có nhiều niềm vui ở lớp, được cô giáo khen vẽ hoa sen đẹp và ăn cơm ngon cùng bà.',
      summaryEn: 'Be An had a joyful day at class, was praised by the teacher for drawing a lotus flower, and ate dinner with Grandma.',
      promptsVi: [
        'Hôm nay ở trường có chuyện gì làm con cười nhiều nhất thế? Kể mẹ nghe với!',
        'Bức tranh hoa sen hồng con vẽ có mấy cánh thế, cuối tuần mẹ về con tặng mẹ nhé!',
        'Bà nấu món canh chua gì cho An ăn chiều thế? Mẹ ở xưởng cũng thấy vui lây luôn!',
      ],
      promptsEn: [
        'What made you laugh the most at school today? Tell Mom all about it!',
        'How many petals did you draw on your pink lotus flower? Save it for Mom this weekend!',
        'What kind of sour soup did Grandma cook for you tonight? Hearing your happy voice makes my day!',
      ],
    },
    CALM: {
      summaryVi: 'Bé An trải qua một ngày êm đềm, chiều mát ngồi ngoài hiên nhà cùng Bà Nội.',
      summaryEn: 'Be An had a peaceful day and sat on the porch in the cool afternoon breeze with Grandma.',
      promptsVi: [
        'Chiều nay gió mát, con có ra sân chơi hay tưới cây phụ bà nội không?',
        'Hôm nay con và bà ăn tối chưa? Con nhớ lấy nước ấm cho bà uống nhé.',
      ],
      promptsEn: [
        'Was the breeze nice this afternoon? Did you help Grandma water the garden?',
        'Have you and Grandma eaten dinner yet? Remember to pour warm water for Grandma!',
      ],
    },
    TIRED: {
      summaryVi: 'Bé An thấy hơi mệt sau giờ học. Cần lời vỗ về nhẹ nhàng, tránh nhắc chuyện bài vở.',
      summaryEn: 'Be An feels a bit tired after school. Needs gentle reassurance without homework pressure.',
      promptsVi: [
        'Mẹ nghe giọng con hơi mệt, tối nay con nghỉ ngơi sớm đi nhé, không cần lo bài vở đâu.',
        'Mẹ gửi một cái ôm thật ấm về quê cho An nè, con uống ly sữa ấm rồi ngủ ngoan nha!',
      ],
      promptsEn: [
        'You sound a little tired, sweetheart. Rest early tonight, do not worry about homework.',
        'Mom is sending you a big warm hug from afar—drink some warm milk and sleep tight!',
      ],
    },
    NEED_HUG: {
      summaryVi: 'Bé An đang rất nhớ bố mẹ vào buổi chiều tối. Cần lời cam kết yêu thương và hẹn ngày về thăm.',
      summaryEn: 'Be An misses Mom and Dad deeply this evening. Needs unconditional love and reassurance.',
      promptsVi: [
        'Mẹ cũng nhớ An nhiều lắm! Mẹ đang nhìn bức vẽ hoa sen của con ngay bàn làm việc đây nè.',
        'Chỉ còn mấy ngày nữa là cuối tuần bố mẹ về thăm con rồi, hai mẹ con mình đi chợ quê nhé!',
      ],
      promptsEn: [
        'Mom misses you so much too! I am looking at your lotus drawing right now.',
        'Only a few more days until the weekend when Mom and Dad come home to visit you!',
      ],
    },
  };

  const currentAi = aiPromptsByMood[selectedMood];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FDF8F2', paddingBottom: 60 }}>
      {/* Top Navigation Bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'rgba(253, 248, 242, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '2px solid #EDE2D5',
          padding: '14px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 18,
                backgroundColor: '#FEF3C7',
                border: '2px solid #F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
              }}
            >
              🏡
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 900, fontSize: 22, color: '#3B1800', letterSpacing: -0.4 }}>
                  Nhịp Nhà
                </span>
                <span
                  style={{
                    backgroundColor: '#DCFCE7',
                    color: '#15803D',
                    fontSize: 12,
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: 999,
                    border: '1px solid #86EFAC',
                  }}
                >
                  ● API & Web Live
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#78350F' }}>
                {isVi
                  ? 'Hệ sinh thái gắn kết và tự lập "Bước Chân Nhỏ"'
                  : '"Little Footsteps" Family Bonding & Independence Ecosystem'}
              </div>
            </div>
          </div>

          {/* Language & API Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                backgroundColor: '#F2EAE0',
                padding: 4,
                borderRadius: 999,
                border: '1.5px solid #D8C2B9',
              }}
            >
              <button
                onClick={() => setLang('vi')}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 14px',
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: 13,
                  backgroundColor: isVi ? '#FFFFFF' : 'transparent',
                  color: isVi ? '#B45309' : '#4E4039',
                  boxShadow: isVi ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                🇻🇳 Tiếng Việt
              </button>
              <button
                onClick={() => setLang('en')}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 14px',
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: 13,
                  backgroundColor: !isVi ? '#FFFFFF' : 'transparent',
                  color: !isVi ? '#B45309' : '#4E4039',
                  boxShadow: !isVi ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                🇬🇧 English
              </button>
            </div>

            <a
              href="/api/health"
              target="_blank"
              style={{
                textDecoration: 'none',
                backgroundColor: '#FFFBEB',
                color: '#92400E',
                border: '2px solid #FCD34D',
                padding: '8px 14px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              ⚡ /api/health
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 20px' }}>
        {/* Hero Banner + Interactive Mobile Simulator Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 28,
            alignItems: 'start',
          }}
        >
          {/* Left Column: Ecosystem Philosophy & API Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div
              style={{
                backgroundColor: '#FFF8EB',
                border: '2.5px solid #FCD34D',
                borderRadius: 32,
                padding: 28,
                boxShadow: '0 12px 28px rgba(62, 39, 35, 0.07)',
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                  border: '1px solid #F59E0B',
                  padding: '5px 14px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 800,
                  marginBottom: 12,
                }}
              >
                {isVi
                  ? '🌟 HỆ SINH THÁI "BƯỚC CHÂN NHỎ" • SDG 3, 4, 8'
                  : '🌟 "LITTLE FOOTSTEPS" ECOSYSTEM • SDG 3, 4, 8'}
              </div>

              <h1
                style={{
                  fontSize: 34,
                  lineHeight: 1.2,
                  fontWeight: 900,
                  color: '#3B1800',
                  margin: '0 0 12px 0',
                  letterSpacing: -0.6,
                }}
              >
                {isVi
                  ? 'Gần nhau dù cách xa qua "3 Nhịp Gắn Kết" mỗi ngày'
                  : 'Close at heart, miles apart through "3 Daily Bonding Rhythms"'}
              </h1>

              <p style={{ fontSize: 16, lineHeight: 1.6, color: '#4E4039', fontWeight: 600, margin: 0 }}>
                {isVi
                  ? 'Xóa bỏ áp lực "phải gọi cùng lúc" và hội chứng cắn rứt lương tâm của cha mẹ công nhân đi làm xa (10–12 tiếng/ngày). Trao cho trẻ em ở quê (6–12 tuổi) và ông bà một kênh an toàn, tự nguyện, không phán xét hay tra hỏi điểm số.'
                  : 'Removes simultaneous call pressure and parental guilt for migrant workers (10–12h shifts), while giving rural children (6–12 y/o) and grandparents a safe, voluntary, judgment-free channel.'}
              </p>

              {/* 4 Core Pillars from Section 5.1 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: 12,
                  marginTop: 20,
                }}
              >
                <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 24, border: '2px solid #FDE68A' }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>🔔</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#451A03' }}>
                    {isVi ? 'Hộp thư thoại 1 chạm' : '1-Touch Voice Mailbox'}
                  </div>
                  <div style={{ fontSize: 13, color: '#78350F', marginTop: 4, fontWeight: 600 }}>
                    {isVi
                      ? '"Tiếng chuông buổi sáng" hẹn giờ & lời chúc ngủ ngon bất đồng bộ.'
                      : 'Scheduled "Morning Bell" & async bedtime voice notes.'}
                  </div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 24, border: '2px solid #FED7AA' }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>🎨</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#431407' }}>
                    {isVi ? 'Nhật ký tương tác 15s' : '15s Interactive Diary'}
                  </div>
                  <div style={{ fontSize: 13, color: '#9A3412', marginTop: 4, fontWeight: 600 }}>
                    {isVi
                      ? 'Điểm danh 4 cảm xúc, thu âm 15s & gửi nét vẽ tay/ảnh chụp nhanh.'
                      : '4 emotion icons, 15s voice note & quick doodle/photo.'}
                  </div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 24, border: '2px solid #86EFAC' }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>🌿</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#052E16' }}>
                    {isVi ? 'AI Gợi ý thấu cảm 30s' : '30s AI Empathy Prompts'}
                  </div>
                  <div style={{ fontSize: 13, color: '#166534', marginTop: 4, fontWeight: 600 }}>
                    {isVi
                      ? 'Trích xuất từ khóa, tín hiệu thị giác & gợi ý câu hỏi mở tránh hỏi điểm.'
                      : 'Extracts keywords, vision signals & open-ended questions.'}
                  </div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 24, border: '2px solid #C7D2FE' }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>📰</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#1E1B4B' }}>
                    {isVi ? 'Bản tin tổng kết tuần' : 'Weekly Recap Digest'}
                  </div>
                  <div style={{ fontSize: 13, color: '#3730A3', marginTop: 4, fontWeight: 600 }}>
                    {isVi
                      ? 'Tổng hợp cột mốc, xu hướng cảm xúc & chủ đề con nhắc nhiều trong 7 ngày.'
                      : '7-day summary of milestones, mood trends & recurring topics.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Serverless API Endpoints Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '2px solid #E6DFD7',
                borderRadius: 28,
                padding: 24,
                boxShadow: '0 6px 16px rgba(62, 39, 35, 0.05)',
              }}
            >
              <h2 style={{ margin: '0 0 12px 0', fontSize: 20, fontWeight: 900, color: '#1E1510' }}>
                🔌 {isVi ? 'Hệ thống Serverless API & Neon PostgreSQL' : 'Serverless API Endpoints & Neon PostgreSQL'}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { method: 'GET', path: '/api/health', descVi: 'Trạng thái hệ thống & SDG metadata', descEn: 'System health & SDG metadata' },
                  { method: 'GET', path: '/api/family/timeline?familyId=fam_dongthap_001', descVi: 'Mạch kết nối 3 nhịp sinh hoạt gia đình', descEn: 'Family 3-rhythm daily timeline' },
                  { method: 'GET', path: '/api/checkins?familyId=fam_dongthap_001', descVi: 'Danh sách điểm danh cảm xúc, voice 15s & nét vẽ', descEn: 'Emotion check-ins, 15s voice & doodles' },
                  { method: 'GET', path: '/api/messages?familyId=fam_dongthap_001', descVi: 'Hộp thư thoại bất đồng bộ của bố mẹ', descEn: 'Async voice mailbox messages' },
                  { method: 'GET', path: '/api/auth/qr-pair', descVi: 'Mã ghép đôi 1 chạm Zero-Type QR (NHIP-8868)', descEn: '1-Touch Zero-Type QR pairing payload' },
                ].map((ep, i) => (
                  <a
                    key={i}
                    href={ep.path}
                    target="_blank"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: '#FAF6F0',
                      borderRadius: 16,
                      border: '1.5px solid #E6DFD7',
                      textDecoration: 'none',
                      color: '#1E1510',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          backgroundColor: '#FEF3C7',
                          color: '#B45309',
                          fontWeight: 900,
                          fontSize: 11,
                          padding: '3px 8px',
                          borderRadius: 999,
                        }}
                      >
                        {ep.method}
                      </span>
                      <code style={{ fontWeight: 800, fontSize: 13, color: '#3B1800' }}>{ep.path}</code>
                    </div>
                    <span style={{ fontSize: 12, color: '#79675E', fontWeight: 600 }}>
                      {isVi ? ep.descVi : ep.descEn} →
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Material 3 Expressive App Preview */}
          <div
            style={{
              backgroundColor: '#1E1510',
              borderRadius: 44,
              padding: 12,
              boxShadow: '0 24px 48px rgba(30, 21, 16, 0.22)',
              maxWidth: 460,
              width: '100%',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                backgroundColor: '#FDF8F2',
                borderRadius: 34,
                padding: 18,
                minHeight: 720,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                {/* Phone Status Pill */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 14,
                    padding: '0 6px',
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#78350F' }}>
                    NHIP-8868 • Đồng Tháp
                  </span>
                  <span
                    style={{
                      backgroundColor: '#FEF3C7',
                      color: '#92400E',
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    {persona === 'CHILD'
                      ? isVi
                        ? '🧒 Bé An (8 tuổi)'
                        : '🧒 Be An (8 y/o)'
                      : persona === 'GRANDPARENT'
                      ? isVi
                        ? '👵 Bà Nội (Chữ lớn)'
                        : '👵 Grandma (Large Font)'
                      : isVi
                      ? '👩‍🏭 Mẹ Hoa (KCN)'
                      : '👩‍🏭 Mother Hoa'}
                  </span>
                </div>

                {/* CHILD OR GRANDPARENT VIEW */}
                {persona !== 'PARENT' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Family Hearth Card */}
                    <div
                      style={{
                        backgroundColor: '#FFF8EB',
                        border: '2px solid #FCD34D',
                        borderRadius: 28,
                        padding: 16,
                      }}
                    >
                      <div style={{ fontWeight: 900, fontSize: isElder ? 23 : 20, color: '#3B1800' }}>
                        🏠 Gia đình Bác Ba & Bé An
                      </div>
                      <div style={{ fontSize: isElder ? 16 : 13, color: '#78350F', fontWeight: 700, marginTop: 2 }}>
                        {isVi
                          ? 'Nhịp sinh hoạt 3 nhịp gắn kết • Hộp thư thoại bất đồng bộ'
                          : '3-Rhythm Daily Bonding • Async Voice Mailbox'}
                      </div>
                    </div>

                    {/* Rhythm 1: Morning */}
                    <div
                      style={{
                        backgroundColor: '#FFFDF5',
                        border: '2px solid #FCD34D',
                        borderRadius: 28,
                        padding: 16,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            fontSize: 11,
                            fontWeight: 900,
                            padding: '3px 10px',
                            borderRadius: 999,
                          }}
                        >
                          ☀️ {isVi ? 'SÁNG (06:30 – 07:15)' : 'MORNING (06:30 – 07:15)'}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#15803D' }}>
                          {morningDone ? (isVi ? '✓ Đã chào 06:45' : '✓ Sent 06:45') : ''}
                        </span>
                      </div>
                      <div style={{ fontWeight: 900, fontSize: isElder ? 22 : 19, color: '#451A03', marginTop: 8 }}>
                        {isVi ? 'Tiếng chuông buổi sáng & Hộp thư 1 chạm' : 'Morning Bell & 1-Touch Mailbox'}
                      </div>
                      <div
                        style={{
                          backgroundColor: '#FEF3C7',
                          borderRadius: 18,
                          padding: 10,
                          marginTop: 8,
                          fontSize: isElder ? 16 : 13,
                          fontWeight: 700,
                          color: '#78350F',
                        }}
                      >
                        🔔 {isVi ? 'Lời chúc hẹn giờ của mẹ: “An ơi dậy ăn sáng cùng bà rồi đi học vui nhé!”' : 'Mom’s scheduled bell: “Wake up and have breakfast with Grandma, An!”'}
                      </div>
                      <button
                        onClick={() => setMorningDone(true)}
                        style={{
                          width: '100%',
                          marginTop: 10,
                          backgroundColor: '#F59E0B',
                          border: '2px solid #D97706',
                          borderBottomWidth: 5,
                          borderRadius: 22,
                          padding: '12px 16px',
                          fontWeight: 900,
                          fontSize: isElder ? 18 : 15,
                          color: '#3B1800',
                          cursor: 'pointer',
                        }}
                      >
                        🎙️ {isVi ? '“Con chuẩn bị đi học đây ạ!” (1 Chạm)' : '“I am ready for school!” (1-Tap)'}
                      </button>
                    </div>

                    {/* Rhythm 2: Afternoon 15s Diary */}
                    <div
                      style={{
                        backgroundColor: '#FFF9F5',
                        border: '2px solid #FDBA74',
                        borderRadius: 28,
                        padding: 16,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            backgroundColor: '#FFEDD5',
                            color: '#9A3412',
                            fontSize: 11,
                            fontWeight: 900,
                            padding: '3px 10px',
                            borderRadius: 999,
                          }}
                        >
                          🎒 {isVi ? 'CHIỀU (17:00 – 18:30)' : 'AFTERNOON (17:00 – 18:30)'}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#166534' }}>
                          🛡️ {isVi ? 'Kênh an toàn' : 'Safe Channel'}
                        </span>
                      </div>

                      <div style={{ fontWeight: 900, fontSize: isElder ? 22 : 19, color: '#431407', marginTop: 8 }}>
                        {isVi ? 'Nhật ký tương tác 15 giây' : '15s Interactive Flash Diary'}
                      </div>

                      {/* 4 Mood Pills */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                        {moods.map((m) => {
                          const active = selectedMood === m.id;
                          return (
                            <button
                              key={m.id}
                              onClick={() => setSelectedMood(m.id)}
                              style={{
                                backgroundColor: active ? m.bg : '#FFFFFF',
                                border: active ? `3px solid ${m.border}` : '1.5px solid #E6DFD7',
                                borderRadius: 18,
                                padding: '8px 10px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                              }}
                            >
                              <span style={{ fontSize: 24 }}>{m.emoji}</span>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: isElder ? 16 : 14, color: m.text }}>
                                  {isVi ? m.vi : m.en}
                                </div>
                                <div style={{ fontSize: 11, color: m.text, opacity: 0.85 }}>
                                  {isVi ? m.subVi : m.subEn}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Doodle / Photo Picker */}
                      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                        {doodles.map((d, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedDoodle(idx)}
                            style={{
                              flex: 1,
                              backgroundColor: selectedDoodle === idx ? '#FFEDD5' : '#FFFFFF',
                              border: selectedDoodle === idx ? '2px solid #EA580C' : '1.5px solid #E6DFD7',
                              borderRadius: 16,
                              padding: '8px 6px',
                              cursor: 'pointer',
                              fontSize: 11,
                              fontWeight: 800,
                              color: '#431407',
                            }}
                          >
                            <div style={{ fontSize: 20 }}>{d.emoji}</div>
                            {isVi ? d.vi.split(':')[1] : d.en.split(':')[1]}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setAfternoonDone(true)}
                        style={{
                          width: '100%',
                          marginTop: 10,
                          backgroundColor: '#EA580C',
                          border: '2px solid #C2410C',
                          borderBottomWidth: 5,
                          borderRadius: 22,
                          padding: '12px 16px',
                          fontWeight: 900,
                          fontSize: isElder ? 18 : 15,
                          color: '#FFFFFF',
                          cursor: 'pointer',
                        }}
                      >
                        💌 {isVi ? 'Gửi Cảm xúc + Ghi âm 15s + Nét vẽ' : 'Send Mood + 15s Voice + Doodle'}
                      </button>
                    </div>

                    {/* Rhythm 3: Evening */}
                    <div
                      style={{
                        backgroundColor: '#F8FAFF',
                        border: '2px solid #A5B4FC',
                        borderRadius: 28,
                        padding: 16,
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: '#E0E7FF',
                          color: '#3730A3',
                          fontSize: 11,
                          fontWeight: 900,
                          padding: '3px 10px',
                          borderRadius: 999,
                        }}
                      >
                        🌙 {isVi ? 'TỐI (20:30 – 21:00)' : 'EVENING (20:30 – 21:00)'}
                      </span>
                      <div style={{ fontWeight: 900, fontSize: isElder ? 21 : 18, color: '#1E1B4B', marginTop: 6 }}>
                        {isVi ? 'Nghe lời chúc ngủ ngon từ Mẹ Hoa' : "Hear Mother Hoa's Bedtime Note"}
                      </div>
                      <button
                        onClick={() => setEveningDone(true)}
                        style={{
                          width: '100%',
                          marginTop: 10,
                          backgroundColor: '#4338CA',
                          border: '2px solid #312E81',
                          borderBottomWidth: 5,
                          borderRadius: 22,
                          padding: '12px 16px',
                          fontWeight: 900,
                          fontSize: isElder ? 18 : 15,
                          color: '#FFFFFF',
                          cursor: 'pointer',
                        }}
                      >
                        {eveningDone
                          ? isVi
                            ? '✓ Đã nghe lời dặn dò ấm áp'
                            : '✓ Listened to bedtime message'
                          : isVi
                          ? '🎧 Bấm nghe giọng mẹ (25s)'
                          : "🎧 Play Mother's Voice (25s)"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* MIGRANT PARENT VIEW (1-3 MIN HUB) */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div
                      style={{
                        backgroundColor: '#FFF4ED',
                        border: '2px solid #FDBA74',
                        borderRadius: 26,
                        padding: 16,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 900, color: '#9A3412' }}>
                        👩‍🏭 {isVi ? 'CHA MẸ ĐI LÀM XA • THAO TÁC 1–3 PHÚT' : 'MIGRANT PARENT • 1–3 MIN CHECK-IN'}
                      </div>
                      <div style={{ fontWeight: 900, fontSize: 20, color: '#431407', marginTop: 2 }}>
                        {isVi ? 'AI Gợi ý thấu cảm (30 giây)' : '30-Second AI Empathy Assistant'}
                      </div>
                      <div style={{ fontSize: 13, color: '#7C2D12', fontWeight: 600, marginTop: 2 }}>
                        {isVi
                          ? 'Xóa bỏ cắn rứt lương tâm • Tránh hỏi điểm số khô khan'
                          : 'Relieving parental guilt • Avoiding dry grade grilling'}
                      </div>
                    </div>

                    {/* AI Analysis Card */}
                    <div
                      style={{
                        backgroundColor: '#F2FCF5',
                        border: '2px solid #86EFAC',
                        borderRadius: 26,
                        padding: 16,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {(liveAiResult?.keywords || ['#VẽHoaSen', '#ĐượcCôKhen', '#CanhChuaBàNấu']).map((kw, i) => (
                            <span
                              key={i}
                              style={{
                                backgroundColor: '#DCFCE7',
                                color: '#14532D',
                                fontSize: 11,
                                fontWeight: 800,
                                padding: '3px 9px',
                                borderRadius: 999,
                              }}
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => triggerLiveServerAi(selectedMood, selectedDoodle, lang)}
                          disabled={aiLoading}
                          style={{
                            border: '1.5px solid #22C55E',
                            backgroundColor: '#DCFCE7',
                            color: '#15803D',
                            borderRadius: 999,
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          {aiLoading ? '⏳ AI Server...' : '✨ AI Server'}
                        </button>
                      </div>

                      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 18, padding: 12, border: '1.5px solid #BBF7D0' }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: '#15803D' }}>
                          {isVi ? 'TÓM TẮT NHẬT KÝ 15S CỦA BÉ AN:' : "BE AN'S 15S DIARY SUMMARY:"}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginTop: 4 }}>
                          {liveAiResult?.summary || (isVi ? currentAi.summaryVi : currentAi.summaryEn)}
                        </div>
                      </div>

                      {/* Computer Vision Non-Diagnostic Signal */}
                      <div
                        style={{
                          backgroundColor: '#FFF7ED',
                          borderRadius: 16,
                          padding: 10,
                          marginTop: 8,
                          border: '1.5px solid #FED7AA',
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#7C2D12',
                        }}
                      >
                        {doodles[selectedDoodle].emoji}{' '}
                        {liveAiResult?.cvInsight || (isVi ? doodles[selectedDoodle].cvVi : doodles[selectedDoodle].cvEn)}
                      </div>

                      <div style={{ fontSize: 13, fontWeight: 800, color: '#052E16', marginTop: 10, marginBottom: 6 }}>
                        👇 {isVi ? 'Câu hỏi mở gợi ý cho bố mẹ (30s):' : 'Suggested Open Prompts (30s):'}
                      </div>

                      {(liveAiResult?.suggestedPrompts || (isVi ? currentAi.promptsVi : currentAi.promptsEn)).map((p, idx) => (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '2px solid #CBEAD6',
                            borderRadius: 18,
                            padding: '10px 12px',
                            marginBottom: 6,
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#1E1510',
                          }}
                        >
                          💬 “{p}”
                        </div>
                      ))}
                    </div>

                    {/* Weekly Recap Box */}
                    <div
                      style={{
                        backgroundColor: '#FFFBEB',
                        border: '2px solid #FCD34D',
                        borderRadius: 26,
                        padding: 16,
                      }}
                    >
                      <div style={{ fontWeight: 900, fontSize: 16, color: '#451A03' }}>
                        📰 {isVi ? 'Bản tin tổng kết tuần (Weekly Recap)' : 'Weekly Recap Newsletter'}
                      </div>
                      <div style={{ fontSize: 13, color: '#78350F', fontWeight: 700, marginTop: 6 }}>
                        • {isVi ? 'Cột mốc: Tự giác dậy đúng giờ 6/7 buổi sáng & vẽ hoa sen tặng mẹ.' : 'Milestone: Woke up on time 6/7 mornings & drew a lotus for Mom.'}
                      </div>
                      <div style={{ fontSize: 13, color: '#78350F', fontWeight: 700, marginTop: 4 }}>
                        • {isVi ? 'Chủ đề lặp lại (AI Cấp độ 2): Chuyện vẽ tranh ở lớp, mong cuối tuần bố mẹ về.' : 'Recurring topics (AI Level 2): Drawing class, waiting for weekend visit.'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom M3 Expressive Persona Switcher Dock */}
              <div
                style={{
                  marginTop: 18,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 999,
                  padding: 5,
                  border: '2px solid #E5DEC9',
                  display: 'flex',
                  gap: 4,
                }}
              >
                {[
                  { id: 'CHILD' as Persona, emoji: '🧒', vi: 'Bé An', en: 'Child', bg: '#FEF3C7', border: '#F59E0B' },
                  { id: 'GRANDPARENT' as Persona, emoji: '👵', vi: 'Bà Nội', en: 'Elder', bg: '#E0E7FF', border: '#4F46E5' },
                  { id: 'PARENT' as Persona, emoji: '👩‍🏭', vi: 'Mẹ Hoa', en: 'Parent', bg: '#FFEDD5', border: '#EA580C' },
                ].map((tab) => {
                  const active = persona === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setPersona(tab.id);
                        if (tab.id === 'PARENT') {
                          triggerLiveServerAi(selectedMood, selectedDoodle, lang);
                        }
                      }}
                      style={{
                        flex: 1,
                        border: active ? `1.5px solid ${tab.border}` : '1.5px solid transparent',
                        backgroundColor: active ? tab.bg : 'transparent',
                        borderRadius: 999,
                        padding: '10px 6px',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontSize: 13,
                        color: '#1E1510',
                      }}
                    >
                      {tab.emoji} {isVi ? tab.vi : tab.en}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
