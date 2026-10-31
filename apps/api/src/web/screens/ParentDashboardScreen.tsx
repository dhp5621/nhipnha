import React, { useState, useEffect, useRef } from 'react';
import type { EmpathyAssistantResponse } from '@nhipnha/shared';
import { useAuth } from '../context/AuthContext';
import { useRhythm } from '../context/RhythmContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { apiClient } from '../services/api';
import { webAudioService } from '../services/webAudio';
import { EmpathyPromptCard } from '../components/EmpathyPromptCard';
import { AudioWaveform } from '../components/AudioWaveform';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { MIcon } from '../components/MIcon';

interface ParentDashboardScreenProps {
  onNavigateToSwitch: () => void;
}

export const ParentDashboardScreen: React.FC<ParentDashboardScreenProps> = ({
  onNavigateToSwitch,
}) => {
  const { family, member } = useAuth();
  const { state, refreshRhythm } = useRhythm();
  const { activeLanguage } = useLanguage();
  const { colors, isDark, toggleTheme } = useTheme();

  const [aiData, setAiData] = useState<EmpathyAssistantResponse | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [messageNote, setMessageNote] = useState<string>('');
  const [dashboardTab, setDashboardTab] = useState<'TODAY' | 'WEEKLY_RECAP'>('TODAY');

  const [isRecording30s, setIsRecording30s] = useState(false);
  const [durationLeft, setDurationLeft] = useState(30);
  const [liveWaveform, setLiveWaveform] = useState<number[]>([]);
  const [parentVoice, setParentVoice] = useState<{
    url: string;
    duration: number;
    waveform: number[];
  } | null>(null);

  const [isPlayingChildVoice, setIsPlayingChildVoice] = useState(false);
  const [isPlayingChildEveningVoice, setIsPlayingChildEveningVoice] = useState(false);
  const [isPlayingParentVoice, setIsPlayingParentVoice] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const timerRef = useRef<number | null>(null);
  const isVi = activeLanguage === 'vi';

  const hasDiaryToday = state.afternoonCompleted;
  const activeAttachment = state.afternoonAttachment;

  // Fetch AI Empathy Assistant suggestions when child diary exists
  useEffect(() => {
    async function fetchAi() {
      if (!hasDiaryToday) {
        setAiData(null);
        return;
      }
      const mood = state.afternoonMood || 'JOYFUL';
      const attachTitle = activeAttachment
        ? isVi
          ? activeAttachment.titleVi
          : activeAttachment.titleEn
        : undefined;

      const insights = await apiClient.getEmpathySuggestions(
        mood,
        state.afternoonNote,
        attachTitle,
        activeLanguage,
        'Bé An'
      );
      if (insights) {
        setAiData(insights);
        if (insights.suggestedPrompts?.length > 0) {
          setSelectedPrompt(insights.suggestedPrompts[0]);
        }
      }
    }
    fetchAi();
  }, [hasDiaryToday, state.afternoonMood, state.afternoonNote, activeAttachment, activeLanguage, isVi]);

  // 30s Recording countdown
  useEffect(() => {
    if (isRecording30s && durationLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setDurationLeft((prev) => {
          if (prev <= 1) {
            handleStopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording30s, durationLeft]);

  const handleStartRecording = async () => {
    const started = await webAudioService.startAudioRecording((waveform) => {
      setLiveWaveform(waveform);
    });
    if (!started) {
      alert(isVi ? 'Không thể truy cập microphone' : 'Microphone access denied');
      return;
    }
    setDurationLeft(30);
    setIsRecording30s(true);
    setParentVoice(null);
  };

  const handleStopRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording30s(false);
    const result = await webAudioService.stopAudioRecording(30 - durationLeft || 28);
    setParentVoice(result);
  };

  const handleTogglePlayChildVoice = () => {
    if (!state.afternoonVoiceUrl) return;
    if (isPlayingChildVoice) {
      webAudioService.stopAudioPlayback();
      setIsPlayingChildVoice(false);
    } else {
      setIsPlayingChildVoice(true);
      const childSpeech =
        state.afternoonNote &&
        !state.afternoonNote.startsWith('Ảnh chụp:') &&
        !state.afternoonNote.startsWith('Nét vẽ:')
          ? state.afternoonNote
          : (isVi
              ? 'Chiều nay con đi học về vui lắm, con ăn canh chua bà nấu ngon ơi là ngon!'
              : 'School was so fun today, I took a photo of dinner with Grandma to show you!');
      webAudioService.playAudioUrl(state.afternoonVoiceUrl, childSpeech, () => {
        setIsPlayingChildVoice(false);
      });
    }
  };

  const handleTogglePlayChildEveningVoice = () => {
    if (!state.eveningExtraVoiceUrl) return;
    if (isPlayingChildEveningVoice) {
      webAudioService.stopAudioPlayback();
      setIsPlayingChildEveningVoice(false);
    } else {
      setIsPlayingChildEveningVoice(true);
      webAudioService.playAudioUrl(
        state.eveningExtraVoiceUrl,
        state.eveningExtraNote || 'Lời chúc ngủ ngon của con',
        () => {
          setIsPlayingChildEveningVoice(false);
        }
      );
    }
  };

  const handleTogglePlayParentVoice = () => {
    if (!parentVoice?.url) return;
    if (isPlayingParentVoice) {
      webAudioService.stopAudioPlayback();
      setIsPlayingParentVoice(false);
    } else {
      setIsPlayingParentVoice(true);
      webAudioService.playAudioUrl(
        parentVoice.url,
        selectedPrompt || 'Bố mẹ dặn dò con chúc ngủ ngon',
        () => {
          setIsPlayingParentVoice(false);
        }
      );
    }
  };

  const handleSendBedtimeMessage = async () => {
    if (!family?.id || !member?.id) return;
    setSendingMessage(true);
    try {
      await apiClient.sendBedtimeMessage({
        familyId: family.id,
        senderId: member.id,
        senderName: member.name,
        rhythmType: 'EVENING',
        audioUrl: parentVoice?.url,
        transcription: selectedPrompt || messageNote || 'Con yêu ngủ ngon nhé, bố mẹ thương con nhiều!',
        durationSec: parentVoice?.duration || 28,
        aiSummary: aiData?.summary,
        aiSuggestedPrompts: aiData?.suggestedPrompts,
      });

      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3500);
      await refreshRhythm();
    } finally {
      setSendingMessage(false);
    }
  };

  const getMoodBadge = (mood?: string) => {
    switch (mood) {
      case 'JOYFUL':
        return {
          label: isVi ? 'Vui vẻ 😄' : 'Joyful 😄',
          bg: isDark ? 'rgba(254, 243, 199, 0.2)' : '#FEF3C7',
          color: isDark ? '#FDE68A' : '#92400E',
        };
      case 'CALM':
        return {
          label: isVi ? 'Bình yên ⛅' : 'Calm ⛅',
          bg: isDark ? 'rgba(224, 242, 254, 0.2)' : '#E0F2FE',
          color: isDark ? '#BAE6FD' : '#075985',
        };
      case 'TIRED':
        return {
          label: isVi ? 'Hơi mệt 🌧️' : 'Tired 🌧️',
          bg: isDark ? 'rgba(243, 244, 246, 0.2)' : '#F3F4F6',
          color: isDark ? '#E5E7EB' : '#374151',
        };
      case 'NEED_HUG':
        return {
          label: isVi ? 'Cần ôm 🫂' : 'Need a Hug 🫂',
          bg: isDark ? 'rgba(252, 231, 243, 0.2)' : '#FCE7F3',
          color: isDark ? '#FBCFE8' : '#9D174D',
        };
      default:
        return { label: isVi ? 'Chưa điểm danh' : 'Pending', bg: colors.surfaceContainerLow, color: colors.textMuted };
    }
  };

  const moodBadge = getMoodBadge(state.afternoonMood);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 1120,
        margin: '0 auto',
        padding: '20px 16px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        backgroundColor: colors.background,
        color: colors.textDark,
        transition: 'background-color 0.2s cubic-bezier(0.2, 0, 0, 1), color 0.2s cubic-bezier(0.2, 0, 0, 1)',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.surfaceContainerLow,
          padding: '14px 20px',
          borderRadius: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/icon.png"
            alt="Nhịp Nhà"
            style={{ width: 44, height: 44, borderRadius: 14 }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AccessibleText variant="h2" weight="900" color={colors.textDark}>
                {family?.name}
              </AccessibleText>
              <span
                style={{
                  backgroundColor: isDark ? 'rgba(255, 181, 156, 0.2)' : '#FFDCC6',
                  color: isDark ? '#FFB59C' : '#331200',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: 999,
                }}
              >
                {member?.name} ({isVi ? 'Phụ huynh' : 'Parent'})
              </span>
            </div>
            <AccessibleText variant="caption" color={colors.textSecondary}>
              {isVi ? 'Dòng thời gian đồng hành & trợ lý thấu cảm từ xa' : 'Remote bonding timeline & AI Assistant'}
            </AccessibleText>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => refreshRhythm()}
            type="button"
            style={{
              border: 'none',
              backgroundColor: colors.surfaceContainerHigh,
              width: 38,
              height: 38,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Refresh"
          >
            <MIcon name="refresh" size={18} color={colors.textDark} />
          </button>

          <button
            onClick={toggleTheme}
            type="button"
            style={{
              border: 'none',
              backgroundColor: colors.surfaceContainerHigh,
              width: 38,
              height: 38,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MIcon name={isDark ? 'dark_mode' : 'wb_sunny'} size={18} color="#F59E0B" />
          </button>

          <button
            onClick={onNavigateToSwitch}
            type="button"
            style={{
              border: 'none',
              backgroundColor: colors.surfaceContainerHigh,
              width: 38,
              height: 38,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MIcon name="tune" size={18} color={colors.textDark} />
          </button>
        </div>
      </div>

      {/* Top Segmented Tab Switcher: Today Rhythms vs Weekly Recap */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          backgroundColor: colors.surfaceContainerLow,
          padding: 6,
          borderRadius: 999,
          border: `1.5px solid ${colors.outlineVariant}`,
          width: 'fit-content',
        }}
      >
        <button
          type="button"
          onClick={() => setDashboardTab('TODAY')}
          style={{
            padding: '8px 18px',
            borderRadius: 999,
            border: 'none',
            backgroundColor: dashboardTab === 'TODAY' ? colors.primary : 'transparent',
            color: dashboardTab === 'TODAY' ? colors.onPrimary : colors.textSecondary,
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.18s ease',
          }}
        >
          <MIcon name="calendar_today" size={16} />
          <span>{isVi ? 'Nhịp Hôm Nay' : 'Today Rhythms'}</span>
        </button>

        <button
          type="button"
          onClick={() => setDashboardTab('WEEKLY_RECAP')}
          style={{
            padding: '8px 18px',
            borderRadius: 999,
            border: 'none',
            backgroundColor: dashboardTab === 'WEEKLY_RECAP' ? colors.primary : 'transparent',
            color: dashboardTab === 'WEEKLY_RECAP' ? colors.onPrimary : colors.textSecondary,
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.18s ease',
          }}
        >
          <MIcon name="auto_stories" size={16} />
          <span>{isVi ? 'Bản Tin Tổng Kết Tuần' : 'Weekly Recap'}</span>
          <span
            style={{
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 999,
              backgroundColor: dashboardTab === 'WEEKLY_RECAP' ? 'rgba(255,255,255,0.25)' : colors.primaryContainer,
              color: dashboardTab === 'WEEKLY_RECAP' ? '#FFFFFF' : colors.onPrimaryContainer,
              fontWeight: 900,
            }}
          >
            {isVi ? '7 Ngày' : '7 Days'}
          </span>
        </button>
      </div>

      {dashboardTab === 'WEEKLY_RECAP' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Hero Recap Header Card */}
          <div
            style={{
              background: isDark
                ? 'linear-gradient(135deg, #2E1508 0%, #1A0D04 100%)'
                : 'linear-gradient(135deg, #FFE8D6 0%, #FFD3B6 100%)',
              borderRadius: 32,
              padding: '24px 22px',
              border: `1.5px solid ${colors.outlineVariant}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span
                  style={{
                    backgroundColor: '#B84318',
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 900,
                    padding: '4px 12px',
                    borderRadius: 999,
                    letterSpacing: 0.5,
                  }}
                >
                  {isVi ? 'BẢN TIN TỔNG KẾT TUẦN' : 'WEEKLY RECAP'}
                </span>
                <span
                  style={{
                    backgroundColor: isDark ? 'rgba(34, 197, 94, 0.22)' : '#DCFCE7',
                    color: isDark ? '#86EFAC' : '#15803D',
                    fontSize: 12,
                    fontWeight: 900,
                    padding: '4px 10px',
                    borderRadius: 999,
                  }}
                >
                  🔥 {isVi ? 'Chuỗi 7 ngày gắn kết' : '7-Day Streak'}
                </span>
              </div>

              <span style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 700 }}>
                {isVi ? 'Tổng hợp 7 ngày vừa qua' : 'Last 7 days summary'}
              </span>
            </div>

            <AccessibleText variant="h1" weight="900" color={isDark ? '#FFDBCF' : '#3B0900'}>
              {isVi ? 'Bản Tin Đồng Hành Tuần Này Của Bé An' : "An's Weekly Bonding Recap"}
            </AccessibleText>

            <AccessibleText variant="bodyLarge" color={isDark ? '#F4CBB8' : '#6A2A10'} weight="600">
              {isVi
                ? 'Tổng hợp toàn bộ nhịp chuyện, cảm xúc và các nét vẽ của con trong tuần để bố mẹ đi làm xa không bao giờ bỏ lỡ quá trình khôn lớn của con.'
                : 'A warm summary of your child’s emotions, doodles, and daily stories so you never miss a step.'}
            </AccessibleText>
          </div>

          {/* 7-Day Emotion Analytics Card */}
          <div
            style={{
              backgroundColor: colors.surfaceContainerLow,
              borderRadius: 30,
              padding: 22,
              border: `1.5px solid ${colors.outlineVariant}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MIcon name="insights" size={22} color={colors.primary} />
              <AccessibleText variant="h2" weight="900" color={colors.textDark}>
                {isVi ? 'Xu Hướng Cảm Xúc 7 Ngày Qua (Phân Tích Dữ Liệu)' : '7-Day Emotion Trend Analytics'}
              </AccessibleText>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div
                style={{
                  padding: 16,
                  borderRadius: 20,
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                  border: '1px solid #F59E0B',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: '#92400E' }}>😊 {isVi ? 'Vui vẻ' : 'Joyful'}</span>
                  <span style={{ fontWeight: 900, fontSize: 13, color: '#92400E' }}>4 ngày (57%)</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, backgroundColor: 'rgba(245, 158, 11, 0.3)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '57%', backgroundColor: '#F59E0B', borderRadius: 999 }} />
                </div>
              </div>

              <div
                style={{
                  padding: 16,
                  borderRadius: 20,
                  backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#E0F2FE',
                  border: '1px solid #0284C7',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: '#075985' }}>☁️ {isVi ? 'Bình yên' : 'Calm'}</span>
                  <span style={{ fontWeight: 900, fontSize: 13, color: '#075985' }}>2 ngày (29%)</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, backgroundColor: 'rgba(2, 132, 199, 0.3)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '29%', backgroundColor: '#0284C7', borderRadius: 999 }} />
                </div>
              </div>

              <div
                style={{
                  padding: 16,
                  borderRadius: 20,
                  backgroundColor: isDark ? 'rgba(107, 114, 128, 0.15)' : '#F3F4F6',
                  border: '1px solid #6B7280',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: '#374151' }}>😴 {isVi ? 'Hơi mệt' : 'Tired'}</span>
                  <span style={{ fontWeight: 900, fontSize: 13, color: '#374151' }}>1 ngày (14%)</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, backgroundColor: 'rgba(107, 114, 128, 0.3)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '14%', backgroundColor: '#6B7280', borderRadius: 999 }} />
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '12px 16px',
                borderRadius: 18,
                backgroundColor: colors.surfaceContainer,
                fontSize: 13,
                color: colors.textSecondary,
                lineHeight: '20px',
              }}
            >
              <strong>💡 {isVi ? 'Tín hiệu AI tổng quan:' : 'AI Overview:'}</strong>{' '}
              {isVi
                ? 'Nhịp cảm xúc của con trong tuần diễn ra rất tích cực. Con duy trì sự vui vẻ và êm đềm ở quê cùng bà. Ngày thứ Tư con hơi mệt sau giờ học thể dục nhưng đã lấy lại năng lượng nhờ nghe tin nhắn thoại vỗ về của mẹ.'
                : 'Overall positive emotional rhythm. Mostly calm and joyful. One tired afternoon on Wednesday was resolved after listening to Mom’s reassuring voice note.'}
            </div>
          </div>

          {/* AI Narrative Summary Card (NLP Cấp độ 2) */}
          <div
            style={{
              backgroundColor: colors.surfaceContainerLow,
              borderRadius: 30,
              padding: 22,
              border: `1.5px solid ${colors.outlineVariant}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MIcon name="psychology" size={22} color={colors.primary} />
              <AccessibleText variant="h2" weight="900" color={colors.textDark}>
                {isVi ? 'Mạch Chuyện Trong Tuần (AI Tổng Hợp Cấp Độ 2)' : 'Weekly Narrative Summary (NLP Level 2)'}
              </AccessibleText>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                fontSize: 14,
                lineHeight: '22px',
                color: colors.textDark,
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16 }}>🎨</span>
                <div>
                  <strong>{isVi ? 'Đam mê vẽ tranh:' : 'Passion for drawing:'}</strong>{' '}
                  {isVi
                    ? 'Con thường xuyên nhắc đến môn Mỹ thuật và đã vẽ tặng mẹ 2 bức tranh (Hoa sen hồng và Cả nhà sum họp).'
                    : 'Child frequently mentioned art class and made 2 doodles for Mom.'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16 }}>🍲</span>
                <div>
                  <strong>{isVi ? 'Bữa cơm cùng bà:' : 'Meals with grandma:'}</strong>{' '}
                  {isVi
                    ? 'Con thích nhất món canh chua bà nấu chiều thứ Năm và chụp ảnh gửi mẹ khoe đã ăn hết 2 bát cơm.'
                    : 'Loved grandma’s sour soup on Thursday and sent a photo proud of finishing dinner.'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16 }}>❤️</span>
                <div>
                  <strong>{isVi ? 'Mong ngóng cuối tuần:' : 'Weekend anticipation:'}</strong>{' '}
                  {isVi
                    ? 'Con nhắc đến lời hẹn cuối tuần bố mẹ về thăm nhà 3 lần trong các tin nhắn thoại buổi chiều.'
                    : 'Mentioned looking forward to parents visiting on the weekend 3 times in voice notes.'}
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Creative Gallery (Doodles & Photos from 15s Diary) */}
          <div
            style={{
              backgroundColor: colors.surfaceContainerLow,
              borderRadius: 30,
              padding: 22,
              border: `1.5px solid ${colors.outlineVariant}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MIcon name="photo_library" size={22} color={colors.primary} />
                <AccessibleText variant="h2" weight="900" color={colors.textDark}>
                  {isVi ? 'Bộ Sưu Tập Nhật Ký 15s Tuần Này' : 'Weekly 15s Diary Gallery'}
                </AccessibleText>
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: colors.primary }}>
                {isVi ? '4 khoảnh khắc' : '4 moments'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {[
                { title: isVi ? 'Nét vẽ: Hoa sen hồng tặng mẹ' : 'Doodle: Pink lotus for Mom', icon: 'local_florist', color: '#F472B6', day: isVi ? 'Thứ Hai' : 'Mon' },
                { title: isVi ? 'Nét vẽ: Cả nhà mình sum họp' : 'Doodle: Family together', icon: 'home', color: '#F59E0B', day: isVi ? 'Thứ Ba' : 'Tue' },
                { title: isVi ? 'Ảnh chụp: Bữa cơm canh chua' : 'Photo: Sour soup dinner', icon: 'restaurant', color: '#10B981', day: isVi ? 'Thứ Năm' : 'Thu' },
                { title: isVi ? 'Nét vẽ: Chiều mưa ngoài hiên' : 'Doodle: Rainy afternoon', icon: 'grain', color: '#60A5FA', day: isVi ? 'Hôm nay' : 'Today' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 16,
                    borderRadius: 22,
                    backgroundColor: colors.surfaceContainer,
                    border: `1px solid ${colors.outlineVariant}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        backgroundColor: item.color,
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MIcon name={item.icon} size={22} color="#FFFFFF" />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: colors.textSecondary }}>{item.day}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: colors.textDark }}>
                    {item.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: 24,
            alignItems: 'start',
          }}
        >
        {/* Left Column: Child's Daily Connection Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              backgroundColor: colors.surfaceContainerLow,
              borderRadius: 30,
              padding: 22,
              border: `1px solid ${colors.outlineVariant}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MIcon name="timeline" size={22} color={colors.primary} />
                <AccessibleText variant="h2" weight="900" color={colors.textDark}>
                  {isVi ? 'Dòng Thời Gian Của Con Ở Quê' : "Child's Daily Timeline"}
                </AccessibleText>
              </div>

              <span
                style={{
                  backgroundColor: '#DCFCE7',
                  color: '#15803D',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: 999,
                }}
              >
                {isVi ? 'Đồng bộ từ máy chủ' : 'Server Live'}
              </span>
            </div>

            {/* Rhythm 1: Morning wake-up check */}
            <div
              style={{
                backgroundColor: colors.surfaceContainer,
                padding: '14px 18px',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: '#FFDEA8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MIcon name="wb_sunny" size={22} color="#8C4F00" />
                </div>
                <div>
                  <AccessibleText variant="bodyLarge" weight="800" color={colors.textDark}>
                    ☀️ {isVi ? 'Nhịp Sáng Chào Đi Học' : 'Morning Wake-Up'}
                  </AccessibleText>
                  <div>
                    <AccessibleText variant="caption" color={colors.textSecondary}>
                      {state.morningCompleted
                        ? isVi
                          ? `Con đã gửi lúc ${state.morningTime || 'sáng nay'}`
                          : `Sent at ${state.morningTime || 'this morning'}`
                        : isVi
                        ? 'Chưa nhận được lời chào'
                        : 'Pending'}
                    </AccessibleText>
                  </div>
                </div>
              </div>

              <span
                style={{
                  backgroundColor: state.morningCompleted ? '#DCFCE7' : colors.surfaceContainerHighest,
                  color: state.morningCompleted ? '#15803D' : colors.textMuted,
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: 999,
                }}
              >
                {state.morningCompleted ? (isVi ? 'Đã Chào' : 'Completed') : isVi ? 'Chờ con' : 'Waiting'}
              </span>
            </div>

            {/* Rhythm 2: Afternoon Diary (Mood, Voice, Doodle/Photo) */}
            <div
              style={{
                backgroundColor: colors.surfaceContainer,
                padding: '16px 18px',
                borderRadius: 22,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      backgroundColor: '#FFDBCE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MIcon name="palette" size={22} color="#9E3306" />
                  </div>
                  <div>
                    <AccessibleText variant="bodyLarge" weight="800" color={colors.textDark}>
                      🎒 {isVi ? 'Nhật Ký Chiều 15s' : 'Afternoon 15s Diary'}
                    </AccessibleText>
                    <div>
                      <AccessibleText variant="caption" color={colors.textSecondary}>
                        {state.afternoonCompleted
                          ? isVi
                            ? `Gửi lúc ${state.afternoonTime || 'chiều nay'}`
                            : `Sent at ${state.afternoonTime || 'afternoon'}`
                          : isVi
                          ? 'Đang chờ con tan học về gửi'
                          : 'Waiting for child'}
                      </AccessibleText>
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    backgroundColor: moodBadge.bg,
                    color: moodBadge.color,
                    fontSize: 12,
                    fontWeight: 900,
                    padding: '4px 10px',
                    borderRadius: 999,
                  }}
                >
                  {moodBadge.label}
                </span>
              </div>

              {state.afternoonCompleted ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                  {/* Voice recording from child */}
                  {state.afternoonVoiceUrl ? (
                    <div>
                      <AccessibleText variant="caption" weight="800" color={colors.textSecondary} style={{ marginBottom: 4, display: 'block' }}>
                        {isVi ? 'Giọng nói con gửi về (15s):' : "Child's Voice Note:"}
                      </AccessibleText>
                      <AudioWaveform
                        isPlaying={isPlayingChildVoice}
                        onPlayToggle={handleTogglePlayChildVoice}
                        durationSec={state.afternoonVoiceDuration || 15}
                        accentColor={colors.afternoonPrimary}
                      />

                      {/* Transcribed speech text directly below the voice player */}
                      <div
                        style={{
                          marginTop: 8,
                          padding: '10px 14px',
                          borderRadius: 14,
                          backgroundColor: colors.surfaceContainer,
                          borderLeft: `4px solid ${colors.afternoonPrimary}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MIcon name="record_voice_over" size={16} color={colors.afternoonPrimary} />
                          <span style={{ fontSize: 11, fontWeight: 900, color: colors.afternoonPrimary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {isVi ? 'Văn bản lời con nói (AI Nhận diện):' : 'Child Voice Transcript:'}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: colors.textDark, fontStyle: 'italic', lineHeight: 1.45 }}>
                          “{state.afternoonNote && !state.afternoonNote.startsWith('Ảnh chụp:') && !state.afternoonNote.startsWith('Nét vẽ:')
                            ? state.afternoonNote
                            : (isVi
                                ? 'Chiều nay con đi học về vui lắm, con ăn canh chua bà nấu và chụp ảnh khoe bố mẹ nè!'
                                : 'School was so fun today, I took a photo of dinner with Grandma to show you!')}”
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Attachment (doodle or photo) */}
                  {activeAttachment ? (
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 18,
                        backgroundColor: colors.surfaceContainerHighest,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      {activeAttachment.imageUrl ? (
                        <img
                          src={activeAttachment.imageUrl}
                          alt="Child attachment"
                          style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: 14,
                            backgroundColor: '#FFDBCE',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <MIcon name={activeAttachment.emoji} size={28} color={activeAttachment.dominantColor} />
                        </div>
                      )}

                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: colors.textDark, display: 'block' }}>
                          {isVi ? activeAttachment.titleVi : activeAttachment.titleEn}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: colors.textSecondary }}>
                          {isVi ? activeAttachment.cvSignalVi : activeAttachment.cvSignalEn}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* Additional note (only if distinct from voice transcript and attachment) */}
                  {state.afternoonNote &&
                  !state.afternoonNote.startsWith('Ảnh chụp:') &&
                  !state.afternoonNote.startsWith('Nét vẽ:') &&
                  !state.afternoonVoiceUrl ? (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: 14,
                        backgroundColor: colors.surfaceContainerHighest,
                        fontStyle: 'italic',
                        fontSize: 13,
                        color: colors.textDark,
                      }}
                    >
                      “{state.afternoonNote}”
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Rhythm 3: Evening status */}
            <div
              style={{
                backgroundColor: colors.surfaceContainer,
                padding: '14px 18px',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: '#E1E0FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MIcon name="nights_stay" size={22} color="#3D32B8" />
                </div>
                <div>
                  <AccessibleText variant="bodyLarge" weight="800" color={colors.textDark}>
                    🌙 {isVi ? 'Hộp Thư Thoại Tối' : 'Bedtime Guidance'}
                  </AccessibleText>
                  <div>
                    <AccessibleText variant="caption" color={colors.textSecondary}>
                      {state.eveningListened
                        ? isVi
                          ? 'Bé đã nghe thông điệp của bạn'
                          : 'Child listened to your message'
                        : isVi
                        ? 'Chưa gửi hoặc bé chưa nghe'
                        : 'Pending'}
                    </AccessibleText>
                  </div>
                </div>
              </div>

              <span
                style={{
                  backgroundColor: state.eveningListened ? '#DCFCE7' : colors.surfaceContainerHighest,
                  color: state.eveningListened ? '#15803D' : colors.textMuted,
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: 999,
                }}
              >
                {state.eveningListened ? (isVi ? 'Bé Đã Nghe' : 'Listened') : isVi ? 'Chưa nghe' : 'Not listened'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: AI Empathy Assistant & Bedtime 30s Voice Recorder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* AI Empathy Assistant Card */}
          {aiData ? (
            <EmpathyPromptCard
              data={aiData}
              selectedPrompt={selectedPrompt}
              onSelectPrompt={setSelectedPrompt}
            />
          ) : (
            <div
              style={{
                backgroundColor: colors.surfaceContainerLow,
                borderRadius: 28,
                padding: 22,
                border: `1px solid ${colors.outlineVariant}`,
                textAlign: 'center',
              }}
            >
              <MIcon name="auto_awesome" size={32} color="#9C4400" />
              <div style={{ marginTop: 8 }}>
                <AccessibleText variant="h2" weight="900" color={colors.textDark}>
                  {isVi ? 'Trợ Lý Thấu Cảm Sẵn Sàng' : 'AI Empathy Assistant Ready'}
                </AccessibleText>
              </div>
              <div style={{ marginTop: 4 }}>
                <AccessibleText variant="caption" color={colors.textSecondary}>
                  {isVi
                    ? 'Ngay khi con gửi Nhật Ký Chiều (cảm xúc & nét vẽ), AI sẽ phân tích và gợi ý câu hỏi mở giúp ba mẹ phản hồi ấm áp, tránh tra khảo điểm số.'
                    : 'When your child submits their afternoon diary, AI will generate open-ended empathy prompts.'}
                </AccessibleText>
              </div>
            </div>
          )}

          {/* 30-Second Bedtime Voice Note Recorder */}
          <div
            style={{
              backgroundColor: colors.surfaceContainerLow,
              borderRadius: 30,
              padding: 22,
              border: `1px solid ${colors.outlineVariant}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MIcon name="mic" size={22} color={colors.eveningPrimary} />
                <AccessibleText variant="h2" weight="900" color={colors.textDark}>
                  {isVi ? 'Ghi Âm Dặn Dò Buổi Tối (30s)' : 'Parent Bedtime Voice (30s)'}
                </AccessibleText>
              </div>

              <span
                style={{
                  backgroundColor: isRecording30s ? colors.errorBg : colors.surfaceContainerHighest,
                  color: isRecording30s ? colors.error : colors.textSecondary,
                  fontSize: 12,
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: 999,
                }}
              >
                {isRecording30s ? `00:${durationLeft.toString().padStart(2, '0')}` : 'Tối đa 30s'}
              </span>
            </div>

            {selectedPrompt ? (
              <div
                style={{
                  backgroundColor: colors.surfaceContainer,
                  padding: '10px 14px',
                  borderRadius: 16,
                  borderLeft: `4px solid ${colors.eveningPrimary}`,
                  fontSize: 13,
                  fontWeight: 700,
                  color: colors.textDark,
                }}
              >
                <span style={{ fontSize: 11, color: colors.textSecondary, display: 'block', marginBottom: 2 }}>
                  {isVi ? 'Gợi ý đọc khi thu âm:' : 'Suggested prompt to read:'}
                </span>
                “{selectedPrompt}”
              </div>
            ) : null}

            {/* Audio Waveform */}
            <AudioWaveform
              isRecording={isRecording30s}
              remainingSec={durationLeft}
              durationSec={parentVoice?.duration}
              waveform={isRecording30s ? liveWaveform : parentVoice?.waveform}
              isPlaying={isPlayingParentVoice}
              onPlayToggle={parentVoice ? handleTogglePlayParentVoice : undefined}
              accentColor={colors.eveningPrimary}
            />

            {/* Recording Controls */}
            <div style={{ display: 'flex', gap: 10 }}>
              {!isRecording30s ? (
                <BigButton
                  variant="evening"
                  iconName={parentVoice ? 'replay' : 'mic'}
                  onClick={handleStartRecording}
                >
                  {parentVoice
                    ? isVi
                      ? 'Thu Âm Lại (30s)'
                      : 'Re-Record (30s)'
                    : isVi
                    ? 'Bắt Đầu Thu Âm Dặn Dò 30s'
                    : 'Start 30s Voice Note'}
                </BigButton>
              ) : (
                <BigButton
                  variant="danger"
                  iconName="stop"
                  onClick={handleStopRecording}
                >
                  {isVi ? 'Dừng & Lưu Giọng Nói' : 'Stop & Save Voice'}
                </BigButton>
              )}
            </div>

            {/* Optional message text */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, display: 'block', marginBottom: 4 }}>
                {isVi ? 'Lời nhắn chúc ngủ ngon gửi kèm:' : 'Bedtime guidance message:'}
              </label>
              <textarea
                value={messageNote || selectedPrompt}
                onChange={(e) => setMessageNote(e.target.value)}
                rows={2}
                placeholder={isVi ? 'Nhập lời dặn dò yêu thương...' : 'Type guidance message...'}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 16,
                  fontSize: 14,
                  backgroundColor: colors.surfaceContainer,
                  border: `1.5px solid ${colors.outlineVariant}`,
                  color: colors.textDark,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {sendSuccess ? (
              <div
                style={{
                  padding: '12px 18px',
                  borderRadius: 18,
                  backgroundColor: isDark ? 'rgba(21, 128, 61, 0.2)' : '#DCFCE7',
                  color: isDark ? '#86EFAC' : '#15803D',
                  border: isDark ? '1px solid rgba(134, 239, 172, 0.3)' : 'none',
                  fontSize: 14,
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                {isVi ? 'Đã gửi lời dặn dò tối về máy con thành công!' : 'Bedtime message sent to child!'}
              </div>
            ) : null}

            <BigButton
              variant="primary"
              iconName="send"
              onClick={handleSendBedtimeMessage}
              loading={sendingMessage}
              minHeight={62}
            >
              {isVi ? 'GỬI LỜI DẶN DÒ TỐI VỀ CHO CON' : 'SEND BEDTIME GUIDANCE TO CHILD'}
            </BigButton>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
