import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { GoogleLoadingIndicator } from '../components/GoogleLoadingIndicator';

interface ParentDashboardScreenProps {
  onNavigateToSwitch: () => void;
}

export const ParentDashboardScreen: React.FC<ParentDashboardScreenProps> = ({
  onNavigateToSwitch,
}) => {
  const { family, member, isDemoAccount } = useAuth();
  const { state, refreshRhythm } = useRhythm();
  const { activeLanguage } = useLanguage();
  const { colors, isDark, toggleTheme } = useTheme();

  const [aiData, setAiData] = useState<EmpathyAssistantResponse | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [messageNote, setMessageNote] = useState<string>('');
  const [dashboardTab, setDashboardTab] = useState<'TODAY' | 'WEEKLY_RECAP'>('TODAY');

  const [weeklyRecapAi, setWeeklyRecapAi] = useState<{
    weeklyOverview: string;
    narrativeHighlights: Array<{ emoji: string; title: string; detail: string }>;
    weekendSuggestions: string[];
  } | null>(null);
  const [loadingWeeklyAi, setLoadingWeeklyAi] = useState(false);

  const [isRecording30s, setIsRecording30s] = useState(false);
  const [isTranscribingParentVoice, setIsTranscribingParentVoice] = useState(false);
  const [durationLeft, setDurationLeft] = useState(30);
  const [liveWaveform, setLiveWaveform] = useState<number[]>([]);
  const [parentVoice, setParentVoice] = useState<{
    url: string;
    duration: number;
    waveform: number[];
    transcript?: string;
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

  // Dynamically resolve the actual child's name from family members or check-ins
  const childName = useMemo(() => {
    const childMember = state.members.find((m) => m.role === 'CHILD');
    if (childMember?.name) return childMember.name;
    const checkInChild = state.checkIns.find((c) => c.memberName && c.memberId !== member?.id);
    if (checkInChild?.memberName) return checkInChild.memberName;
    if (isDemoAccount) return 'Bé An';
    return isVi ? 'Con' : 'Your Child';
  }, [state.members, state.checkIns, member?.id, isDemoAccount, isVi]);

  // Fetch AI Empathy Assistant suggestions when child diary exists
  useEffect(() => {
    async function fetchAi() {
      if (!hasDiaryToday) {
        setAiData(null);
        return;
      }
      setLoadingAi(true);
      try {
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
          childName,
          isDemoAccount
        );
        if (insights) {
          setAiData(insights);
          if (insights.suggestedPrompts?.length > 0) {
            setSelectedPrompt(insights.suggestedPrompts[0]);
          }
        }
      } finally {
        setLoadingAi(false);
      }
    }
    fetchAi();
  }, [
    hasDiaryToday,
    state.afternoonMood,
    state.afternoonNote,
    activeAttachment,
    activeLanguage,
    isVi,
    childName,
    isDemoAccount,
  ]);

  // Compute 7-day analytics from real checkIns (or demo stats when isDemoAccount is true)
  const weeklyAnalytics = useMemo(() => {
    const afternoonList = state.checkIns.filter((c) => c.rhythmType === 'AFTERNOON');

    if (isDemoAccount && afternoonList.length <= 1) {
      return {
        streakDays: 7,
        totalMoodCheckIns: 7,
        moodStats: [
          {
            mood: 'JOYFUL',
            label: isVi ? 'Vui vẻ' : 'Joyful',
            emoji: '😊',
            count: 4,
            pct: 57,
            bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
            border: '#F59E0B',
            textColor: isDark ? '#FDE68A' : '#92400E',
          },
          {
            mood: 'CALM',
            label: isVi ? 'Bình yên' : 'Calm',
            emoji: '☁️',
            count: 2,
            pct: 29,
            bg: isDark ? 'rgba(2, 132, 199, 0.15)' : '#E0F2FE',
            border: '#0284C7',
            textColor: isDark ? '#BAE6FD' : '#075985',
          },
          {
            mood: 'TIRED',
            label: isVi ? 'Hơi mệt' : 'Tired',
            emoji: '😴',
            count: 1,
            pct: 14,
            bg: isDark ? 'rgba(107, 114, 128, 0.15)' : '#F3F4F6',
            border: '#6B7280',
            textColor: isDark ? '#E5E7EB' : '#374151',
          },
        ],
        gallery: [
          {
            title: isVi ? 'Nét vẽ: Hoa sen hồng tặng mẹ' : 'Doodle: Pink lotus for Mom',
            icon: 'local_florist',
            color: '#F472B6',
            day: isVi ? 'Thứ Hai' : 'Mon',
            imageUrl: undefined as string | undefined,
          },
          {
            title: isVi ? 'Nét vẽ: Cả nhà mình sum họp' : 'Doodle: Family together',
            icon: 'home',
            color: '#F59E0B',
            day: isVi ? 'Thứ Ba' : 'Tue',
            imageUrl: undefined as string | undefined,
          },
          {
            title: isVi ? 'Ảnh chụp: Bữa cơm canh chua' : 'Photo: Sour soup dinner',
            icon: 'restaurant',
            color: '#10B981',
            day: isVi ? 'Thứ Năm' : 'Thu',
            imageUrl: undefined as string | undefined,
          },
          {
            title: isVi ? 'Nét vẽ: Chiều mưa ngoài hiên' : 'Doodle: Rainy afternoon',
            icon: 'grain',
            color: '#60A5FA',
            day: isVi ? 'Hôm nay' : 'Today',
            imageUrl: undefined as string | undefined,
          },
        ],
      };
    }

    const uniqueDays = new Set(
      state.checkIns
        .map((c) => (c.createdAt ? c.createdAt.slice(0, 10) : ''))
        .filter(Boolean)
    );
    const total = afternoonList.length;
    const countMood = (m: string) => afternoonList.filter((c) => c.mood === m).length;
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

    const joyfulCount = countMood('JOYFUL');
    const calmCount = countMood('CALM');
    const tiredCount = countMood('TIRED');
    const hugCount = countMood('NEED_HUG');

    const moodStats = [
      {
        mood: 'JOYFUL',
        label: isVi ? 'Vui vẻ' : 'Joyful',
        emoji: '😊',
        count: joyfulCount,
        pct: pct(joyfulCount),
        bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
        border: '#F59E0B',
        textColor: isDark ? '#FDE68A' : '#92400E',
      },
      {
        mood: 'CALM',
        label: isVi ? 'Bình yên' : 'Calm',
        emoji: '☁️',
        count: calmCount,
        pct: pct(calmCount),
        bg: isDark ? 'rgba(2, 132, 199, 0.15)' : '#E0F2FE',
        border: '#0284C7',
        textColor: isDark ? '#BAE6FD' : '#075985',
      },
      {
        mood: 'TIRED',
        label: isVi ? 'Hơi mệt' : 'Tired',
        emoji: '😴',
        count: tiredCount,
        pct: pct(tiredCount),
        bg: isDark ? 'rgba(107, 114, 128, 0.15)' : '#F3F4F6',
        border: '#6B7280',
        textColor: isDark ? '#E5E7EB' : '#374151',
      },
      {
        mood: 'NEED_HUG',
        label: isVi ? 'Cần ôm' : 'Need a Hug',
        emoji: '🫂',
        count: hugCount,
        pct: pct(hugCount),
        bg: isDark ? 'rgba(236, 72, 153, 0.15)' : '#FCE7F3',
        border: '#EC4899',
        textColor: isDark ? '#FBCFE8' : '#9D174D',
      },
    ];

    const gallery = afternoonList
      .filter((c) => c.attachment)
      .slice(0, 8)
      .map((c) => {
        const d = c.createdAt ? new Date(c.createdAt) : new Date();
        const dayStr = d.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
          weekday: 'short',
          month: 'numeric',
          day: 'numeric',
        });
        return {
          title: isVi
            ? c.attachment?.titleVi || 'Khoảnh khắc buổi chiều'
            : c.attachment?.titleEn || 'Afternoon moment',
          icon: c.attachment?.emoji || 'photo_camera',
          color: c.attachment?.dominantColor || '#DF5018',
          day: dayStr,
          imageUrl: c.attachment?.imageUrl,
        };
      });

    return {
      streakDays: uniqueDays.size,
      totalMoodCheckIns: total,
      moodStats,
      gallery,
    };
  }, [state.checkIns, isDemoAccount, isVi, isDark]);

  // Fetch AI Weekly Recap when switching to WEEKLY_RECAP tab
  useEffect(() => {
    if (dashboardTab !== 'WEEKLY_RECAP') return;

    async function loadWeeklyAi() {
      setLoadingWeeklyAi(true);
      try {
        const recap = await apiClient.getWeeklyRecap({
          childName,
          language: activeLanguage,
          checkIns: state.checkIns.map((c) => ({
            rhythmType: c.rhythmType,
            mood: c.mood,
            note: c.note,
            attachmentTitle: isVi ? c.attachment?.titleVi : c.attachment?.titleEn,
            createdAt: c.createdAt,
          })),
          isDemo: isDemoAccount,
        });
        if (recap) {
          setWeeklyRecapAi(recap);
        }
      } finally {
        setLoadingWeeklyAi(false);
      }
    }
    loadWeeklyAi();
  }, [dashboardTab, childName, activeLanguage, state.checkIns, isDemoAccount, isVi]);

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
    const started = await webAudioService.startAudioRecording(
      (waveform) => {
        setLiveWaveform(waveform);
      },
      undefined,
      isVi ? 'vi-VN' : 'en-US'
    );
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
    const localCaptured = (result.transcript || '').trim();

    if (result.url && result.url.startsWith('data:audio')) {
      setIsTranscribingParentVoice(true);
      try {
        const aiStt = await apiClient.transcribeAudio({
          audioUrl: result.url,
          language: activeLanguage,
          localTranscript: localCaptured,
          isDemo: isDemoAccount,
          speakerRole: 'PARENT',
        });
        const finalText = aiStt.transcript || localCaptured;
        setParentVoice({ ...result, transcript: finalText || undefined });
        if (finalText) {
          setMessageNote(finalText);
        }
      } finally {
        setIsTranscribingParentVoice(false);
      }
    } else {
      setParentVoice(result);
      if (localCaptured) {
        setMessageNote(localCaptured);
      }
    }
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
          : isDemoAccount
          ? isVi
            ? 'Chiều nay con đi học về vui lắm, con ăn canh chua bà nấu ngon ơi là ngon!'
            : 'School was so fun today, I took a photo of dinner with Grandma to show you!'
          : '';
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
        state.eveningExtraNote || '',
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
        parentVoice.transcript || messageNote || selectedPrompt || '',
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
        transcription:
          messageNote.trim() ||
          parentVoice?.transcript ||
          selectedPrompt ||
          (isVi ? `Chúc ${childName} ngủ ngon nhé, bố mẹ thương con nhiều!` : `Good night ${childName}, Mom & Dad love you so much!`),
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

  // Clean display transcript for the child's voice note
  const childVoiceTranscript =
    state.afternoonNote &&
    !state.afternoonNote.startsWith('Ảnh chụp:') &&
    !state.afternoonNote.startsWith('Nét vẽ:')
      ? state.afternoonNote
      : isDemoAccount
      ? isVi
        ? 'Chiều nay con đi học về vui lắm, con ăn canh chua bà nấu và chụp ảnh khoe bố mẹ nè!'
        : 'School was so fun today, I took a photo of dinner with Grandma to show you!'
      : '';

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
                  🔥 {isVi ? `Chuỗi ${weeklyAnalytics.streakDays} ngày gắn kết` : `${weeklyAnalytics.streakDays}-Day Streak`}
                </span>
              </div>

              <span style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 700 }}>
                {isVi ? 'Tổng hợp 7 ngày vừa qua' : 'Last 7 days summary'}
              </span>
            </div>

            <AccessibleText variant="h1" weight="900" color={isDark ? '#FFDBCF' : '#3B0900'}>
              {isVi
                ? `Bản Tin Đồng Hành Tuần Này Của ${childName}`
                : `${childName}'s Weekly Bonding Recap`}
            </AccessibleText>

            <AccessibleText variant="bodyLarge" color={isDark ? '#F4CBB8' : '#6A2A10'} weight="600">
              {isVi
                ? 'Tổng hợp toàn bộ nhịp chuyện, cảm xúc và khoảnh khắc của con trong tuần để bố mẹ đi làm xa không bao giờ bỏ lỡ quá trình khôn lớn của con.'
                : 'A warm summary of your child’s emotions, moments, and daily stories so you never miss a step.'}
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
                {isVi ? 'Xu Hướng Cảm Xúc 7 Ngày Qua (Dữ Liệu Thực Tế)' : '7-Day Emotion Trend Analytics'}
              </AccessibleText>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
              {weeklyAnalytics.moodStats.map((stat) => (
                <div
                  key={stat.mood}
                  style={{
                    padding: 16,
                    borderRadius: 20,
                    backgroundColor: stat.bg,
                    border: `1px solid ${stat.border}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: 13, color: stat.textColor }}>
                      {stat.emoji} {stat.label}
                    </span>
                    <span style={{ fontWeight: 900, fontSize: 13, color: stat.textColor }}>
                      {stat.count} {isVi ? 'lần' : 'days'} ({stat.pct}%)
                    </span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${stat.pct}%`,
                        backgroundColor: stat.border,
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                padding: '12px 16px',
                borderRadius: 18,
                backgroundColor: colors.surfaceContainer,
                fontSize: 13,
                color: colors.textSecondary,
                lineHeight: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              {loadingWeeklyAi ? (
                <>
                  <GoogleLoadingIndicator size={18} strokeWidth={2.5} multiColor={true} />
                  <span>{isVi ? 'AI đang phân tích dữ liệu tuần của con...' : 'AI is analyzing this week’s check-ins...'}</span>
                </>
              ) : (
                <div>
                  <strong>💡 {isVi ? 'Tín hiệu AI tổng quan:' : 'AI Overview:'}</strong>{' '}
                  {weeklyRecapAi?.weeklyOverview ||
                    (isVi
                      ? `Đã ghi nhận ${weeklyAnalytics.totalMoodCheckIns} nhật ký cảm xúc trong 7 ngày qua.`
                      : `Recorded ${weeklyAnalytics.totalMoodCheckIns} emotional check-ins over the past 7 days.`)}
                </div>
              )}
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
                {isVi ? 'Mạch Chuyện Trong Tuần (AI Tổng Hợp Cấp Độ 2)' : 'Weekly Narrative Summary (AI Level 2)'}
              </AccessibleText>
            </div>

            {loadingWeeklyAi ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
                <GoogleLoadingIndicator size={22} strokeWidth={3} multiColor={true} />
                <span style={{ fontSize: 13, fontWeight: 700, color: colors.textSecondary }}>
                  {isVi ? 'Đang tổng hợp mạch chuyện từ nhật ký của con...' : 'Synthesizing weekly highlights from check-ins...'}
                </span>
              </div>
            ) : weeklyRecapAi?.narrativeHighlights && weeklyRecapAi.narrativeHighlights.length > 0 ? (
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
                {weeklyRecapAi.narrativeHighlights.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 16 }}>{item.emoji || '🌟'}</span>
                    <div>
                      <strong>{item.title}</strong> {item.detail}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AccessibleText variant="caption" color={colors.textSecondary}>
                {isVi
                  ? `Chưa có ghi chú lời nói hoặc nhật ký chi tiết nào trong tuần này. Khi ${childName} gửi Nhật Ký Chiều 15s, AI sẽ tóm tắt các câu chuyện nổi bật tại đây.`
                  : `No detailed voice notes or diary entries recorded yet this week. Once ${childName} sends 15s Afternoon Diaries, AI will summarize key stories here.`}
              </AccessibleText>
            )}
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
                {weeklyAnalytics.gallery.length} {isVi ? 'khoảnh khắc' : 'moments'}
              </span>
            </div>

            {weeklyAnalytics.gallery.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                {weeklyAnalytics.gallery.map((item, idx) => (
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
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }}
                        />
                      ) : (
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
                      )}
                      <span style={{ fontSize: 11, fontWeight: 800, color: colors.textSecondary }}>{item.day}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: colors.textDark }}>
                      {item.title}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AccessibleText variant="caption" color={colors.textSecondary}>
                {isVi
                  ? 'Chưa có tranh vẽ hoặc hình ảnh đính kèm nào trong 7 ngày qua.'
                  : 'No photos or doodles attached in the last 7 days yet.'}
              </AccessibleText>
            )}
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
                    {isVi ? `Dòng Thời Gian Của ${childName}` : `${childName}'s Daily Timeline`}
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
                        {childVoiceTranscript ? (
                          <div
                            style={{
                              marginTop: 8,
                              padding: '10px 14px',
                              borderRadius: 14,
                              backgroundColor: colors.surfaceContainerHighest,
                              borderLeft: `4px solid ${colors.afternoonPrimary}`,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <MIcon name="record_voice_over" size={16} color={colors.afternoonPrimary} />
                              <span style={{ fontSize: 11, fontWeight: 900, color: colors.afternoonPrimary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {isVi ? 'Văn bản lời con nói (AI Nhận diện):' : 'Child Voice Transcript (AI):'}
                              </span>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: colors.textDark, fontStyle: 'italic', lineHeight: 1.45 }}>
                              “{childVoiceTranscript}”
                            </div>
                          </div>
                        ) : null}
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
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                            : state.eveningCompleted
                            ? isVi
                              ? 'Đã gửi lời nhắn tối nay (chờ bé nghe)'
                              : 'Sent tonight (waiting for child to listen)'
                            : isVi
                            ? 'Chưa gửi lời nhắn tối nay'
                            : 'Not sent yet tonight'}
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
                    {state.eveningListened
                      ? isVi
                        ? 'Bé Đã Nghe'
                        : 'Listened'
                      : state.eveningCompleted
                      ? isVi
                        ? 'Đã Gửi'
                        : 'Sent'
                      : isVi
                      ? 'Chưa gửi'
                      : 'Pending'}
                  </span>
                </div>

                {/* Child's Evening Reply back to Parents */}
                {state.eveningExtraReplied && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 14,
                      backgroundColor: colors.surfaceContainerHighest,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: colors.eveningPrimary }}>
                        💖 {isVi ? `Phản hồi chúc ngủ ngon từ ${childName}:` : `Goodnight reply from ${childName}:`}
                      </span>
                      {state.eveningExtraTime && (
                        <span style={{ fontSize: 11, color: colors.textSecondary }}>{state.eveningExtraTime}</span>
                      )}
                    </div>
                    {state.eveningExtraVoiceUrl && (
                      <AudioWaveform
                        isPlaying={isPlayingChildEveningVoice}
                        onPlayToggle={handleTogglePlayChildEveningVoice}
                        durationSec={state.eveningExtraVoiceDuration || 8}
                        accentColor={colors.eveningPrimary}
                      />
                    )}
                    {state.eveningExtraNote && (
                      <div style={{ fontSize: 13, fontStyle: 'italic', color: colors.textDark }}>
                        “{state.eveningExtraNote}”
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: AI Empathy Assistant & Bedtime 30s Voice Recorder */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* AI Empathy Assistant Card */}
            {loadingAi ? (
              <div
                style={{
                  backgroundColor: colors.surfaceContainerLow,
                  borderRadius: 28,
                  padding: 24,
                  border: `1px solid ${colors.outlineVariant}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  textAlign: 'center',
                }}
              >
                <GoogleLoadingIndicator size={36} strokeWidth={3.5} multiColor={true} />
                <AccessibleText variant="bodyLarge" weight="800" color={colors.textDark}>
                  {isVi
                    ? `AI đang phân tích Nhật Ký Chiều của ${childName}...`
                    : `AI is analyzing ${childName}'s Afternoon Diary...`}
                </AccessibleText>
              </div>
            ) : aiData ? (
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
                      ? `Ngay khi ${childName} gửi Nhật Ký Chiều (cảm xúc, giọng nói & hình ảnh), AI sẽ phân tích và gợi ý câu hỏi mở giúp ba mẹ phản hồi ấm áp.`
                      : `When ${childName} submits their afternoon diary, AI will generate open-ended empathy prompts based on their real check-in.`}
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
                  {isRecording30s ? `00:${durationLeft.toString().padStart(2, '0')}` : isVi ? 'Tối đa 30s' : 'Max 30s'}
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

              {isTranscribingParentVoice && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GoogleLoadingIndicator size={16} strokeWidth={2.5} multiColor={true} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary }}>
                    {isVi ? 'AI đang nhận diện giọng nói của bạn...' : 'AI is transcribing your voice note...'}
                  </span>
                </div>
              )}

              {/* Recording Controls */}
              <div style={{ display: 'flex', gap: 10 }}>
                {!isRecording30s ? (
                  <BigButton
                    variant="evening"
                    iconName={parentVoice ? 'replay' : 'mic'}
                    onClick={handleStartRecording}
                    loading={isTranscribingParentVoice}
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
                loading={sendingMessage || isTranscribingParentVoice}
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
