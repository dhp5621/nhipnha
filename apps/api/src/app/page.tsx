'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CREATIVE_ATTACHMENTS } from '@nhipnha/shared';

type Lang = 'vi' | 'en';
type Persona = 'CHILD' | 'PARENT' | 'GRANDPARENT';
type Mood = 'JOYFUL' | 'CALM' | 'TIRED' | 'NEED_HUG';

function MIcon({
  name,
  size = 20,
  color,
  style,
}: {
  name: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className="material-icons"
      style={{
        fontSize: size,
        color,
        verticalAlign: 'middle',
        userSelect: 'none',
        ...style,
      }}
    >
      {name}
    </span>
  );
}

export default function HomePage() {
  const [lang, setLang] = useState<Lang>('vi');
  const [persona, setPersona] = useState<Persona>('CHILD');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [familyCode, setFamilyCode] = useState<string>('NHIP-8868');
  const [familyId, setFamilyId] = useState<string>('fam_dongthap_001');
  const [familyName, setFamilyName] = useState<string>('Gia đình Bác Ba & Bé An');

  const [selectedMood, setSelectedMood] = useState<Mood>('JOYFUL');
  const [selectedDoodleIdx, setSelectedDoodleIdx] = useState<number>(0);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string>('');
  const [uploadedPhotoName, setUploadedPhotoName] = useState<string>('');
  const [isRecordingWebAudio, setIsRecordingWebAudio] = useState<boolean>(false);
  const [recordedAudioDataUrl, setRecordedAudioDataUrl] = useState<string>('');
  const [recordedAudioSec, setRecordedAudioSec] = useState<number>(0);
  const mediaRecorderRef = React.useRef<any>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const recordStartRef = React.useRef<number>(0);

  const [morningDone, setMorningDone] = useState<boolean>(false);
  const [morningTime, setMorningTime] = useState<string>('');
  const [afternoonDone, setAfternoonDone] = useState<boolean>(false);
  const [eveningDone, setEveningDone] = useState<boolean>(false);
  const [eveningMessageText, setEveningMessageText] = useState<string>('');

  const [submitting, setSubmitting] = useState<string | null>(null);
  const [lastServerResponse, setLastServerResponse] = useState<string>('');
  const [dbCheckInsCount, setDbCheckInsCount] = useState<number>(0);
  const [dbMessagesCount, setDbMessagesCount] = useState<number>(0);

  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [liveAiResult, setLiveAiResult] = useState<{
    summary?: string;
    keywords?: string[];
    suggestedPrompts?: string[];
    cvInsight?: string;
    source?: string;
  } | null>(null);

  const isVi = lang === 'vi';
  const isElder = persona === 'GRANDPARENT';

  const loadFromServerDb = useCallback(async (targetFamilyId: string) => {
    try {
      const res = await fetch(`/api/family/timeline?familyId=${encodeURIComponent(targetFamilyId)}`);
      const data = await res.json();
      if (data.success) {
        if (data.family) {
          setFamilyName(data.family.name);
          setFamilyCode(data.family.code);
        }
        const checkIns = data.checkIns || [];
        const messages = data.messages || [];
        setDbCheckInsCount(checkIns.length);
        setDbMessagesCount(messages.length);

        const morningChk = checkIns.find((c: any) => c.rhythmType === 'MORNING');
        const afternoonChk = checkIns.find((c: any) => c.rhythmType === 'AFTERNOON');
        const eveningMsg = messages.find((m: any) => m.rhythmType === 'EVENING');

        setMorningDone(!!morningChk);
        if (morningChk?.createdAt) {
          const d = new Date(morningChk.createdAt);
          setMorningTime(
            `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
          );
        }
        setAfternoonDone(!!afternoonChk);
        if (afternoonChk?.mood) {
          setSelectedMood(afternoonChk.mood);
        }
        if (afternoonChk?.attachment?.id) {
          const idx = CREATIVE_ATTACHMENTS.findIndex((a) => a.id === afternoonChk.attachment.id);
          if (idx >= 0) setSelectedDoodleIdx(idx);
        }
        if (afternoonChk?.attachment?.imageUrl) {
          setUploadedPhotoUrl(afternoonChk.attachment.imageUrl);
          setUploadedPhotoName(afternoonChk.attachment.titleVi || 'Photo');
        }
        if (afternoonChk?.voiceUrl && afternoonChk.voiceUrl.startsWith('data:audio')) {
          setRecordedAudioDataUrl(afternoonChk.voiceUrl);
          setRecordedAudioSec(afternoonChk.voiceDurationSec || 15);
        }
        if (eveningMsg?.transcription) {
          setEveningMessageText(eveningMsg.transcription);
          setEveningDone(!!eveningMsg.listenedAt);
        }
      }
    } catch (e) {
      console.error('Failed to load timeline from DB:', e);
    }
  }, []);

  useEffect(() => {
    loadFromServerDb(familyId);
  }, [familyId, loadFromServerDb]);

  const triggerLiveServerAi = async (moodToUse: Mood, doodleIdx: number, langToUse: Lang) => {
    setAiLoading(true);
    try {
      const att = CREATIVE_ATTACHMENTS[doodleIdx] || CREATIVE_ATTACHMENTS[0];
      const res = await fetch('/api/ai/empathy-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: moodToUse,
          childName: 'Bé An',
          attachmentTitle: langToUse === 'vi' ? att.titleVi : att.titleEn,
          language: langToUse,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setLiveAiResult({ ...json.data, source: json.source });
        if (json.data.suggestedPrompts?.[0]) {
          setSelectedPrompt(json.data.suggestedPrompts[0]);
        }
      }
    } catch {
      // Fallback
    } finally {
      setAiLoading(false);
    }
  };

  const handleSendMorningToDb = async () => {
    setSubmitting('MORNING');
    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId,
          memberId: 'mem_child_an',
          memberName: 'Bé An',
          rhythmType: 'MORNING',
          note: isVi ? 'Con chuẩn bị đi học đây ạ!' : 'I am ready to go to school!',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setLastServerResponse(`POST /api/checkins → Saved ID: ${json.data.id} (MORNING)`);
        await loadFromServerDb(familyId);
      }
    } finally {
      setSubmitting(null);
    }
  };

  const handleToggleWebVoiceRecord = async () => {
    if (isRecordingWebAudio && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecordingWebAudio(false);
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new (window as any).MediaRecorder(stream);
        audioChunksRef.current = [];
        recordStartRef.current = Date.now();
        mr.ondataavailable = (ev: any) => {
          if (ev.data && ev.data.size > 0) audioChunksRef.current.push(ev.data);
        };
        mr.onstop = () => {
          stream.getTracks().forEach((t: any) => t.stop());
          const sec = Math.max(1, Math.round((Date.now() - recordStartRef.current) / 1000));
          setRecordedAudioSec(sec);
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            setRecordedAudioDataUrl(reader.result as string);
          };
          reader.readAsDataURL(blob);
        };
        mediaRecorderRef.current = mr;
        mr.start();
        setIsRecordingWebAudio(true);
      } catch {
        setRecordedAudioDataUrl('mock://audio/recorded-12s.aac');
        setRecordedAudioSec(12);
      }
    }
  };

  const handlePickWebPhoto = (useCamera: boolean) => {
    if (typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (useCamera) input.setAttribute('capture', 'environment');
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const raw = ev.target?.result as string;
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 480;
          let w = img.width;
          let h = img.height;
          if (w > h && w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
          setUploadedPhotoUrl(canvas.toDataURL('image/jpeg', 0.78));
          setUploadedPhotoName(file.name);
        };
        img.src = raw;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleSendAfternoonToDb = async () => {
    setSubmitting('AFTERNOON');
    try {
      const baseAtt = CREATIVE_ATTACHMENTS[selectedDoodleIdx] || CREATIVE_ATTACHMENTS[0];
      const att = uploadedPhotoUrl
        ? {
            id: `photo_custom_${Date.now()}`,
            type: 'PHOTO' as const,
            titleVi: `Ảnh tải lên: ${uploadedPhotoName || 'Ảnh gia đình'}`,
            titleEn: `Uploaded photo: ${uploadedPhotoName || 'Family photo'}`,
            emoji: 'photo-camera',
            dominantColor: '#10B981',
            imageUrl: uploadedPhotoUrl,
            cvSignalVi: 'Ảnh thực tế từ gia đình — Khoảnh khắc sinh hoạt đời thường tại quê nhà.',
            cvSignalEn: 'Real family photo — Everyday home life moment.',
          }
        : baseAtt;

      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId,
          memberId: 'mem_child_an',
          memberName: 'Bé An',
          rhythmType: 'AFTERNOON',
          mood: selectedMood,
          voiceDurationSec: recordedAudioSec || 15,
          voiceUrl: recordedAudioDataUrl || undefined,
          attachment: att,
          note: isVi
            ? `Nhật ký 15s: Tâm trạng ${selectedMood} • ${att.titleVi}`
            : `15s Diary: Mood ${selectedMood} • ${att.titleEn}`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setLastServerResponse(
          `POST /api/checkins → Saved ID: ${json.data.id} (Mood: ${selectedMood}, Photo/Attachment: ${att.id})`
        );
        await loadFromServerDb(familyId);
        await triggerLiveServerAi(selectedMood, selectedDoodleIdx, lang);
      }
    } finally {
      setSubmitting(null);
    }
  };

  const handleSendParentMessageToDb = async () => {
    setSubmitting('EVENING_MSG');
    try {
      const textToSend =
        selectedPrompt ||
        (isVi
          ? 'Con yêu ngủ ngoan nhé, cuối tuần bố mẹ về thăm con!'
          : 'Sleep tight sweetheart, Mom and Dad will visit this weekend!');
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId,
          senderId: 'mem_parent_hoa',
          senderName: 'Mẹ Hoa',
          recipientId: 'mem_child_an',
          transcription: textToSend,
          durationSec: 25,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setLastServerResponse(`POST /api/messages → Saved ID: ${json.data.id}`);
        await loadFromServerDb(familyId);
      }
    } finally {
      setSubmitting(null);
    }
  };

  const moods: {
    id: Mood;
    icon: string;
    vi: string;
    en: string;
    subVi: string;
    subEn: string;
    bg: string;
    border: string;
    text: string;
  }[] = [
    {
      id: 'JOYFUL',
      icon: 'sentiment_very_satisfied',
      vi: 'Vui vẻ',
      en: 'Joyful',
      subVi: 'Nhiều chuyện vui',
      subEn: 'Lots of happy news',
      bg: '#FEF3C7',
      border: '#F59E0B',
      text: '#92400E',
    },
    {
      id: 'CALM',
      icon: 'wb_cloudy',
      vi: 'Bình yên',
      en: 'Calm',
      subVi: 'Một ngày êm đềm',
      subEn: 'A peaceful day',
      bg: '#E0F2FE',
      border: '#0284C7',
      text: '#075985',
    },
    {
      id: 'TIRED',
      icon: 'bedtime',
      vi: 'Hơi mệt',
      en: 'Tired',
      subVi: 'Cần nghỉ ngơi xíu',
      subEn: 'Need a little rest',
      bg: '#F3F4F6',
      border: '#6B7280',
      text: '#374151',
    },
    {
      id: 'NEED_HUG',
      icon: 'favorite',
      vi: 'Cần ôm',
      en: 'Need a Hug',
      subVi: 'Nhớ bố mẹ nhiều',
      subEn: 'Miss parents a lot',
      bg: '#FCE7F3',
      border: '#EC4899',
      text: '#9D174D',
    },
  ];

  const doodleIcons = ['local_florist', 'home', 'restaurant', 'grain'];

  const bgMain = isDark ? '#16120E' : '#FDF8F2';
  const surfaceLow = isDark ? '#211B16' : '#F6EFE6';
  const surfaceHigh = isDark ? '#322922' : '#E8DFD3';
  const textPrimary = isDark ? '#F5EDE4' : '#1E1510';
  const textSecondary = isDark ? '#D2C3B6' : '#57443B';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgMain, color: textPrimary, paddingBottom: 60 }}>
      {/* Top Navigation Bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: isDark ? 'rgba(22, 18, 14, 0.92)' : 'rgba(253, 248, 242, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${isDark ? '#42362D' : '#EDE2D5'}`,
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
            <img
              src="/icon.png"
              alt="Nhịp Nhà"
              style={{ width: 46, height: 46, borderRadius: 16 }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 900, fontSize: 22, color: textPrimary, letterSpacing: -0.4 }}>
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
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <MIcon name="cloud_done" size={15} color="#15803D" />
                  PostgreSQL & API Live
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: textSecondary }}>
                {isVi
                  ? 'Hệ sinh thái gắn kết và tự lập "Bước Chân Nhỏ"'
                  : '"Little Footsteps" Family Bonding & Independence Ecosystem'}
              </div>
            </div>
          </div>

          {/* Theme, Language & API Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setIsDark(!isDark)}
              style={{
                border: 'none',
                cursor: 'pointer',
                padding: '8px 14px',
                borderRadius: 999,
                fontWeight: 800,
                fontSize: 13,
                backgroundColor: surfaceHigh,
                color: textPrimary,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <MIcon name={isDark ? 'dark_mode' : 'wb_sunny'} size={18} color="#F59E0B" />
              {isDark ? (isVi ? 'Chế độ Tối' : 'Dark') : isVi ? 'Chế độ Sáng' : 'Light'}
            </button>

            <div
              style={{
                display: 'flex',
                backgroundColor: surfaceHigh,
                padding: 4,
                borderRadius: 999,
              }}
            >
              <button
                onClick={() => setLang('vi')}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  padding: '7px 14px',
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: 13,
                  backgroundColor: isVi ? '#9C4400' : 'transparent',
                  color: isVi ? '#FFFFFF' : textPrimary,
                }}
              >
                Tiếng Việt
              </button>
              <button
                onClick={() => setLang('en')}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  padding: '7px 14px',
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: 13,
                  backgroundColor: !isVi ? '#9C4400' : 'transparent',
                  color: !isVi ? '#FFFFFF' : textPrimary,
                }}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 28,
            alignItems: 'start',
          }}
        >
          {/* Left Column: Live Database Inspector & API Endpoints */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div
              style={{
                backgroundColor: surfaceLow,
                borderRadius: 34,
                padding: 28,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: '#FFDCC6',
                  color: '#331200',
                  padding: '5px 14px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 800,
                  marginBottom: 12,
                }}
              >
                <MIcon name="verified" size={16} color="#9C4400" />
                {isVi
                  ? 'HỆ SINH THÁI "BƯỚC CHÂN NHỎ" • MATERIAL 3 EXPRESSIVE'
                  : '"LITTLE FOOTSTEPS" ECOSYSTEM • MATERIAL 3 EXPRESSIVE'}
              </div>

              <h1
                style={{
                  fontSize: 32,
                  lineHeight: 1.2,
                  fontWeight: 900,
                  color: textPrimary,
                  margin: '0 0 12px 0',
                  letterSpacing: -0.6,
                }}
              >
                {isVi
                  ? 'Gần nhau dù cách xa qua "3 Nhịp Gắn Kết" mỗi ngày'
                  : 'Close at heart, miles apart through "3 Daily Bonding Rhythms"'}
              </h1>

              <p style={{ fontSize: 15, lineHeight: 1.6, color: textSecondary, fontWeight: 600, margin: 0 }}>
                {isVi
                  ? 'Mọi thao tác chạm sáng, chọn cảm xúc chiều, đính kèm nét vẽ và gửi hộp thư thoại bên khung tương tác đều được gửi trực tiếp lên máy chủ và lưu vào cơ sở dữ liệu PostgreSQL.'
                  : 'Every morning check-in, afternoon emotion selection, doodle attachment, and bedtime voice note in the interactive preview is sent directly to the server and saved in the PostgreSQL database.'}
              </p>

              {/* Live Database Sync Status Box */}
              <div
                style={{
                  marginTop: 18,
                  padding: 16,
                  borderRadius: 22,
                  backgroundColor: surfaceHigh,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MIcon name="storage" size={20} color="#15803D" />
                    <span style={{ fontWeight: 800, fontSize: 14 }}>
                      {isVi ? 'Trạng thái Cơ sở dữ liệu Thực tế:' : 'Live Database State:'}
                    </span>
                  </div>
                  <button
                    onClick={() => loadFromServerDb(familyId)}
                    style={{
                      border: 'none',
                      backgroundColor: '#9C4400',
                      color: '#FFFFFF',
                      borderRadius: 999,
                      padding: '5px 12px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <MIcon name="refresh" size={15} color="#FFFFFF" />
                    {isVi ? 'Đồng bộ DB' : 'Refresh DB'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 13, fontWeight: 700 }}>
                  <span>
                    Family: <code>{familyCode}</code> ({familyId})
                  </span>
                  <span>• Check-ins in DB: {dbCheckInsCount}</span>
                  <span>• Voice Messages in DB: {dbMessagesCount}</span>
                </div>

                {lastServerResponse ? (
                  <div
                    style={{
                      marginTop: 10,
                      padding: '8px 12px',
                      borderRadius: 12,
                      backgroundColor: '#DCFCE7',
                      color: '#14532D',
                      fontSize: 12,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <MIcon name="check_circle" size={16} color="#15803D" />
                    {lastServerResponse}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Live Serverless API Endpoints Card */}
            <div
              style={{
                backgroundColor: surfaceLow,
                borderRadius: 34,
                padding: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <MIcon name="dns" size={22} color="#9C4400" />
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900 }}>
                  {isVi ? 'Danh sách API Endpoints (Server & Database)' : 'Server & Database API Endpoints'}
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  {
                    method: 'POST / GET',
                    path: `/api/checkins?familyId=${familyId}`,
                    descVi: 'Lưu & tải điểm danh Sáng / Chiều (mood, voice, doodle)',
                    descEn: 'Save & fetch Morning / Afternoon check-ins',
                  },
                  {
                    method: 'POST / GET',
                    path: `/api/messages?familyId=${familyId}`,
                    descVi: 'Lưu & tải Hộp thư thoại buổi tối của bố mẹ',
                    descEn: 'Save & fetch Parent bedtime voice messages',
                  },
                  {
                    method: 'GET',
                    path: `/api/family/timeline?familyId=${familyId}`,
                    descVi: 'Mạch kết nối 3 nhịp sinh hoạt tổng hợp từ DB',
                    descEn: '3-rhythm family timeline aggregated from DB',
                  },
                  {
                    method: 'POST',
                    path: '/api/ai/empathy-assistant',
                    descVi: 'AI Gợi ý thấu cảm trên máy chủ (gemini-web2api)',
                    descEn: 'Server-side AI Empathy Assistant',
                  },
                  {
                    method: 'POST / GET',
                    path: '/api/auth/qr-pair',
                    descVi: 'Ghép đôi QR / Mã gia đình & tạo gia đình mới trong DB',
                    descEn: 'QR / Code pairing & family creation in DB',
                  },
                ].map((ep, i) => (
                  <a
                    key={i}
                    href={ep.path}
                    target="_blank"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: surfaceHigh,
                      borderRadius: 18,
                      textDecoration: 'none',
                      color: textPrimary,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          backgroundColor: '#FFDCC6',
                          color: '#331200',
                          fontWeight: 900,
                          fontSize: 11,
                          padding: '4px 9px',
                          borderRadius: 999,
                        }}
                      >
                        {ep.method}
                      </span>
                      <code style={{ fontWeight: 800, fontSize: 13 }}>{ep.path}</code>
                    </div>
                    <span style={{ fontSize: 12, color: textSecondary, fontWeight: 700 }}>
                      {isVi ? ep.descVi : ep.descEn}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Material 3 Expressive App Preview Connected to DB */}
          <div
            style={{
              backgroundColor: '#261D17',
              borderRadius: 44,
              padding: 12,
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.25)',
              maxWidth: 460,
              width: '100%',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                backgroundColor: bgMain,
                borderRadius: 34,
                padding: 18,
                minHeight: 720,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                {/* Phone Status Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 14,
                    padding: '0 4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MIcon name="home" size={20} color="#9C4400" />
                    <span style={{ fontSize: 13, fontWeight: 800 }}>
                      {familyName} ({familyCode})
                    </span>
                  </div>
                  <span
                    style={{
                      backgroundColor: '#FFDCC6',
                      color: '#331200',
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <MIcon
                      name={
                        persona === 'CHILD'
                          ? 'child_care'
                          : persona === 'GRANDPARENT'
                          ? 'elderly'
                          : 'supervisor_account'
                      }
                      size={15}
                      color="#331200"
                    />
                    {persona === 'CHILD'
                      ? isVi
                        ? 'Bé An'
                        : 'Child'
                      : persona === 'GRANDPARENT'
                      ? isVi
                        ? 'Bà Nội (Chữ lớn)'
                        : 'Elder (Large Font)'
                      : isVi
                      ? 'Mẹ Hoa'
                      : 'Parent'}
                  </span>
                </div>

                {/* CHILD OR GRANDPARENT VIEW */}
                {persona !== 'PARENT' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Rhythm 1: Morning (Top Asymmetric Card) */}
                    <div
                      style={{
                        backgroundColor: isDark ? '#2B200E' : '#FFF3DC',
                        borderRadius: '32px 32px 14px 14px',
                        padding: 18,
                        color: isDark ? '#FFDF9E' : '#261900',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            backgroundColor: isDark ? '#5C4000' : '#FFE08A',
                            fontSize: 11,
                            fontWeight: 900,
                            padding: '4px 10px',
                            borderRadius: 999,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <MIcon name="wb_sunny" size={14} />
                          06:30 – 07:15
                        </span>
                        {morningDone && (
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              color: '#15803D',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <MIcon name="check_circle" size={16} color="#15803D" />
                            {morningTime || 'Synced'}
                          </span>
                        )}
                      </div>

                      <div style={{ fontWeight: 900, fontSize: isElder ? 22 : 19, marginTop: 8 }}>
                        {isVi ? 'Nhịp Sáng – Tiếng chuông & 1 chạm' : 'Morning Rhythm – 1-Touch'}
                      </div>

                      <button
                        onClick={handleSendMorningToDb}
                        disabled={submitting === 'MORNING'}
                        style={{
                          width: '100%',
                          marginTop: 10,
                          backgroundColor: '#F59E0B',
                          border: 'none',
                          borderRadius: 24,
                          padding: '13px 16px',
                          fontWeight: 900,
                          fontSize: isElder ? 17 : 14,
                          color: '#241000',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                        }}
                      >
                        <MIcon name={morningDone ? 'check_circle' : 'mic'} size={20} color="#241000" />
                        {submitting === 'MORNING'
                          ? isVi
                            ? 'Đang lưu lên Server...'
                            : 'Saving to Server...'
                          : morningDone
                          ? isVi
                            ? 'Đã gửi lời chào sáng (Bấm để gửi lại)'
                            : 'Morning Greeting Saved in DB'
                          : isVi
                          ? 'Gửi lời chào buổi sáng lên Server'
                          : 'Send Morning Greeting to Server'}
                      </button>
                    </div>

                    {/* Rhythm 2: Afternoon 15s Diary (Middle Card) */}
                    <div
                      style={{
                        backgroundColor: isDark ? '#301A12' : '#FFEDE3',
                        borderRadius: 14,
                        padding: 18,
                        color: isDark ? '#FFDBCE' : '#351002',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            backgroundColor: isDark ? '#6B270E' : '#FFD3BD',
                            fontSize: 11,
                            fontWeight: 900,
                            padding: '4px 10px',
                            borderRadius: 999,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <MIcon name="palette" size={14} />
                          17:00 – 18:30
                        </span>
                        {afternoonDone && (
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              color: '#15803D',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <MIcon name="check_circle" size={16} color="#15803D" />
                            Saved in DB
                          </span>
                        )}
                      </div>

                      <div style={{ fontWeight: 900, fontSize: isElder ? 22 : 19, marginTop: 8 }}>
                        {isVi ? 'Nhịp Chiều – Nhật ký tương tác 15s' : 'Afternoon – 15s Flash Diary'}
                      </div>

                      {/* 4 Mood Pills with Material Icons */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                        {moods.map((m) => {
                          const active = selectedMood === m.id;
                          return (
                            <button
                              key={m.id}
                              onClick={() => setSelectedMood(m.id)}
                              style={{
                                backgroundColor: active ? m.bg : isDark ? '#211B16' : '#FFFFFF',
                                border: active ? `2.5px solid ${m.border}` : '2.5px solid transparent',
                                borderRadius: active ? 999 : 18,
                                padding: '8px 12px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                              }}
                            >
                              <MIcon name={m.icon} size={24} color={m.border} />
                              <div>
                                <div
                                  style={{
                                    fontWeight: 800,
                                    fontSize: isElder ? 15 : 13,
                                    color: active ? m.text : textPrimary,
                                  }}
                                >
                                  {isVi ? m.vi : m.en}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Voice Recording + Photo Capture/Upload Row */}
                      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                        <button
                          onClick={handleToggleWebVoiceRecord}
                          style={{
                            flex: 1,
                            backgroundColor: isRecordingWebAudio ? '#DC2626' : isDark ? '#211B16' : '#FFFFFF',
                            color: isRecordingWebAudio ? '#FFFFFF' : textPrimary,
                            border: 'none',
                            borderRadius: 999,
                            padding: '9px 10px',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 5,
                          }}
                        >
                          <MIcon
                            name={isRecordingWebAudio ? 'stop' : 'mic'}
                            size={18}
                            color={isRecordingWebAudio ? '#FFFFFF' : '#DF5018'}
                          />
                          {isRecordingWebAudio
                            ? isVi
                              ? 'Dừng thu'
                              : 'Stop'
                            : recordedAudioSec > 0
                            ? `${recordedAudioSec}s ✓`
                            : isVi
                            ? 'Thu âm'
                            : 'Record'}
                        </button>

                        <button
                          onClick={() => handlePickWebPhoto(true)}
                          style={{
                            flex: 1,
                            backgroundColor: isDark ? '#211B16' : '#FFFFFF',
                            color: textPrimary,
                            border: 'none',
                            borderRadius: 999,
                            padding: '9px 10px',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 5,
                          }}
                        >
                          <MIcon name="add_a_photo" size={18} color="#10B981" />
                          {isVi ? 'Chụp ảnh' : 'Camera'}
                        </button>

                        <button
                          onClick={() => handlePickWebPhoto(false)}
                          style={{
                            flex: 1,
                            backgroundColor: isDark ? '#211B16' : '#FFFFFF',
                            color: textPrimary,
                            border: 'none',
                            borderRadius: 999,
                            padding: '9px 10px',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 5,
                          }}
                        >
                          <MIcon name="file_upload" size={18} color="#0284C7" />
                          {isVi ? 'Tải ảnh' : 'Upload'}
                        </button>
                      </div>

                      {uploadedPhotoUrl ? (
                        <div
                          style={{
                            marginTop: 8,
                            backgroundColor: isDark ? '#211B16' : '#FFFFFF',
                            borderRadius: 16,
                            padding: 8,
                          }}
                        >
                          <img
                            src={uploadedPhotoUrl}
                            alt="Uploaded"
                            style={{
                              width: '100%',
                              height: 130,
                              objectFit: 'cover',
                              borderRadius: 12,
                            }}
                          />
                          <div style={{ fontSize: 11, fontWeight: 800, marginTop: 4, color: '#15803D' }}>
                            <MIcon name="check_circle" size={14} color="#15803D" /> {uploadedPhotoName}
                          </div>
                        </div>
                      ) : null}

                      {/* Doodle / Photo Picker with Material Icons */}
                      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                        {CREATIVE_ATTACHMENTS.map((d, idx) => {
                          const active = selectedDoodleIdx === idx;
                          return (
                            <button
                              key={d.id}
                              onClick={() => setSelectedDoodleIdx(idx)}
                              style={{
                                flex: 1,
                                backgroundColor: active ? '#FFD3BD' : isDark ? '#211B16' : '#FFFFFF',
                                border: active ? '2px solid #DF5018' : '2px solid transparent',
                                borderRadius: active ? 22 : 14,
                                padding: '8px 4px',
                                cursor: 'pointer',
                                fontSize: 11,
                                fontWeight: 800,
                                color: active ? '#351002' : textPrimary,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <MIcon name={doodleIcons[idx] || 'brush'} size={20} color={d.dominantColor} />
                              <span>{isVi ? d.titleVi.split(':')[1] : d.titleEn.split(':')[1]}</span>
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={handleSendAfternoonToDb}
                        disabled={submitting === 'AFTERNOON'}
                        style={{
                          width: '100%',
                          marginTop: 10,
                          backgroundColor: '#DF5018',
                          border: 'none',
                          borderRadius: 24,
                          padding: '13px 16px',
                          fontWeight: 900,
                          fontSize: isElder ? 17 : 14,
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                        }}
                      >
                        <MIcon name="send" size={19} color="#FFFFFF" />
                        {submitting === 'AFTERNOON'
                          ? isVi
                            ? 'Đang gửi lên Server DB...'
                            : 'Saving to Server DB...'
                          : isVi
                          ? 'Gửi Cảm xúc & Nét vẽ lên Server'
                          : 'Save Mood & Doodle to Server'}
                      </button>
                    </div>

                    {/* Rhythm 3: Evening (Bottom Asymmetric Card) */}
                    <div
                      style={{
                        backgroundColor: isDark ? '#1D1B38' : '#EDEFFF',
                        borderRadius: '14px 14px 32px 32px',
                        padding: 18,
                        color: isDark ? '#E1E0FF' : '#151152',
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: isDark ? '#322C7A' : '#DCE0FF',
                          fontSize: 11,
                          fontWeight: 900,
                          padding: '4px 10px',
                          borderRadius: 999,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <MIcon name="nights_stay" size={14} />
                        20:30 – 21:00
                      </span>
                      <div style={{ fontWeight: 900, fontSize: isElder ? 20 : 17, marginTop: 8 }}>
                        {eveningMessageText
                          ? `“${eveningMessageText}”`
                          : isVi
                          ? 'Hộp thư thoại buổi tối từ Bố Mẹ'
                          : 'Bedtime Voice Mailbox from Parents'}
                      </div>
                      <button
                        onClick={() => setEveningDone(true)}
                        style={{
                          width: '100%',
                          marginTop: 10,
                          backgroundColor: '#4C43D6',
                          border: 'none',
                          borderRadius: 24,
                          padding: '12px 16px',
                          fontWeight: 900,
                          fontSize: isElder ? 17 : 14,
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                        }}
                      >
                        <MIcon name={eveningDone ? 'check_circle' : 'play_arrow'} size={20} color="#FFFFFF" />
                        {eveningDone
                          ? isVi
                            ? 'Đã nghe lời chúc ngủ ngon'
                            : 'Listened to bedtime note'
                          : isVi
                          ? 'Bấm nghe giọng mẹ'
                          : "Play Mother's Voice"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* MIGRANT PARENT VIEW */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div
                      style={{
                        backgroundColor: surfaceLow,
                        borderRadius: '32px 32px 14px 14px',
                        padding: 18,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MIcon name="auto_awesome" size={20} color="#9C4400" />
                          <span style={{ fontWeight: 900, fontSize: 17 }}>
                            {isVi ? 'AI Gợi ý thấu cảm (Từ Server)' : 'Server AI Empathy Assistant'}
                          </span>
                        </div>
                        <button
                          onClick={() => triggerLiveServerAi(selectedMood, selectedDoodleIdx, lang)}
                          disabled={aiLoading}
                          style={{
                            border: 'none',
                            backgroundColor: '#FFDCC6',
                            color: '#331200',
                            borderRadius: 999,
                            padding: '5px 12px',
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          {aiLoading ? 'Loading...' : isVi ? 'Phân tích lại' : 'Re-analyze'}
                        </button>
                      </div>

                      <div
                        style={{
                          backgroundColor: surfaceHigh,
                          borderRadius: 18,
                          padding: 12,
                          marginTop: 10,
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {liveAiResult?.summary ||
                          (isVi
                            ? `Tâm trạng của Bé An trong DB: ${selectedMood}. Bấm chọn 1 câu hỏi gợi ý bên dưới để gửi vào hộp thư thoại tối cho con:`
                            : `Be An's mood in DB: ${selectedMood}. Pick a suggested prompt below to send to your child's bedtime mailbox:`)}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                        {(
                          liveAiResult?.suggestedPrompts || [
                            isVi
                              ? 'Hôm nay ở trường có chuyện gì làm con cười nhiều nhất thế?'
                              : 'What made you laugh the most at school today?',
                            isVi
                              ? 'Bà nấu món canh gì cho An ăn chiều thế? Cuối tuần bố mẹ về nhé!'
                              : 'What did Grandma cook for dinner? Mom and Dad will visit this weekend!',
                          ]
                        ).map((p, idx) => {
                          const active = selectedPrompt === p;
                          return (
                            <button
                              key={idx}
                              onClick={() => setSelectedPrompt(p)}
                              style={{
                                textAlign: 'left',
                                backgroundColor: active ? '#FFDCC6' : surfaceHigh,
                                color: active ? '#331200' : textPrimary,
                                border: 'none',
                                borderRadius: active ? 24 : 16,
                                padding: '10px 14px',
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                              }}
                            >
                              <MIcon
                                name={active ? 'check_circle' : 'chat_bubble_outline'}
                                size={18}
                                color={active ? '#9C4400' : textSecondary}
                              />
                              <span>“{p}”</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundColor: isDark ? '#1D1B38' : '#EDEFFF',
                        borderRadius: '14px 14px 32px 32px',
                        padding: 18,
                        color: isDark ? '#E1E0FF' : '#151152',
                      }}
                    >
                      <div style={{ fontWeight: 900, fontSize: 17 }}>
                        {isVi ? 'Gửi Hộp thư thoại 30s về quê (Lưu vào DB)' : 'Send 30s Bedtime Voice Note to DB'}
                      </div>
                      <button
                        onClick={handleSendParentMessageToDb}
                        disabled={submitting === 'EVENING_MSG'}
                        style={{
                          width: '100%',
                          marginTop: 10,
                          backgroundColor: '#4C43D6',
                          border: 'none',
                          borderRadius: 24,
                          padding: '13px 16px',
                          fontWeight: 900,
                          fontSize: 14,
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                        }}
                      >
                        <MIcon name="send" size={19} color="#FFFFFF" />
                        {submitting === 'EVENING_MSG'
                          ? isVi
                            ? 'Đang lưu vào DB...'
                            : 'Saving to DB...'
                          : isVi
                          ? 'Gửi lời nhắn tối vào Hộp thư Gia đình'
                          : 'Send Bedtime Note to Family Mailbox'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom M3 Expressive Persona Switcher Dock with Material Icons */}
              <div
                style={{
                  marginTop: 16,
                  backgroundColor: surfaceHigh,
                  borderRadius: 999,
                  padding: 5,
                  display: 'flex',
                  gap: 6,
                }}
              >
                {[
                  { id: 'CHILD' as Persona, icon: 'child_care', vi: 'Bé An', en: 'Child' },
                  { id: 'GRANDPARENT' as Persona, icon: 'elderly', vi: 'Bà Nội', en: 'Elder' },
                  { id: 'PARENT' as Persona, icon: 'supervisor_account', vi: 'Mẹ Hoa', en: 'Parent' },
                ].map((tab) => {
                  const active = persona === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setPersona(tab.id);
                        if (tab.id === 'PARENT') {
                          triggerLiveServerAi(selectedMood, selectedDoodleIdx, lang);
                        }
                      }}
                      style={{
                        flex: 1,
                        border: 'none',
                        backgroundColor: active ? '#FFDCC6' : 'transparent',
                        borderRadius: active ? 999 : 18,
                        padding: '10px 8px',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontSize: 13,
                        color: active ? '#331200' : textPrimary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <MIcon name={tab.icon} size={18} color={active ? '#9C4400' : textSecondary} />
                      {isVi ? tab.vi : tab.en}
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
