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

  const [isRecording30s, setIsRecording30s] = useState(false);
  const [durationLeft, setDurationLeft] = useState(30);
  const [liveWaveform, setLiveWaveform] = useState<number[]>([]);
  const [parentVoice, setParentVoice] = useState<{
    url: string;
    duration: number;
    waveform: number[];
  } | null>(null);

  const [isPlayingChildVoice, setIsPlayingChildVoice] = useState(false);
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
      webAudioService.playAudioUrl(state.afternoonVoiceUrl, 'Giọng nói chiều của con', () => {
        setIsPlayingChildVoice(false);
      });
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
        return { label: isVi ? 'Vui vẻ 😄' : 'Joyful 😄', bg: '#FEF3C7', color: '#92400E' };
      case 'CALM':
        return { label: isVi ? 'Bình yên ⛅' : 'Calm ⛅', bg: '#E0F2FE', color: '#075985' };
      case 'TIRED':
        return { label: isVi ? 'Hơi mệt 🌧️' : 'Tired 🌧️', bg: '#F3F4F6', color: '#374151' };
      case 'NEED_HUG':
        return { label: isVi ? 'Cần ôm 🫂' : 'Need a Hug 🫂', bg: '#FCE7F3', color: '#9D174D' };
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
                  backgroundColor: '#FFDCC6',
                  color: '#331200',
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

      {/* Responsive Two-Column Layout (PC side-by-side, Mobile stacked) */}
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

                  {/* Child's note text */}
                  {state.afternoonNote ? (
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
                  backgroundColor: '#DCFCE7',
                  color: '#15803D',
                  fontSize: 14,
                  fontWeight: 800,
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
    </div>
  );
};
