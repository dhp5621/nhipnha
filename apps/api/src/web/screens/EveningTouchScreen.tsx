import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRhythm } from '../context/RhythmContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { apiClient } from '../services/api';
import { webAudioService } from '../services/webAudio';
import { AudioWaveform } from '../components/AudioWaveform';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { MIcon } from '../components/MIcon';
import { GoogleLoadingIndicator } from '../components/GoogleLoadingIndicator';

interface EveningTouchScreenProps {
  onBack: () => void;
}

export const EveningTouchScreen: React.FC<EveningTouchScreenProps> = ({ onBack }) => {
  const { isDemoAccount } = useAuth();
  const { state, markEveningListened, submitEveningExtraReply } = useRhythm();
  const { activeLanguage } = useLanguage();
  const { colors, isDark } = useTheme();

  const [isPlaying, setIsPlaying] = useState(false);
  const [sendingExtra, setSendingExtra] = useState(false);
  const [extraSentSuccess, setExtraSentSuccess] = useState(false);
  const [isRecordingReply, setIsRecordingReply] = useState(false);
  const [isTranscribingReply, setIsTranscribingReply] = useState(false);
  const [replyDuration, setReplyDuration] = useState(10);
  const [replyWaveform, setReplyWaveform] = useState<number[]>([]);
  const [replyVoice, setReplyVoice] = useState<{
    url: string;
    duration: number;
    waveform: number[];
    transcript?: string;
  } | null>(null);
  const [isPlayingReply, setIsPlayingReply] = useState(false);
  const replyTimerRef = React.useRef<number | null>(null);

  const isVi = activeLanguage === 'vi';

  const demoBedtimeMessage = isVi
    ? 'An yêu của mẹ ơi, hôm nay con ở quê có ngoan không? Bố mẹ vừa tan ca làm xong, nhớ con nhiều lắm. Con chúc bà ngủ sớm rồi đi ngủ ngoan nhé, mai bố mẹ lại gọi cho con!'
    : 'My sweet child, how was your day at home with grandma? Parents just finished our factory shift, we miss you so much. Sleep tight and sweet dreams!';

  const hasParentEveningMessage = Boolean(
    state.eveningCompleted || state.eveningMessageText || state.eveningAudioUrl || isDemoAccount
  );

  const messageText =
    state.eveningMessageText ||
    (isDemoAccount
      ? demoBedtimeMessage
      : isVi
      ? 'Bố mẹ chưa gửi lời nhắn thoại tối nay. Khi bố mẹ tan ca và gửi lời dặn dò, con sẽ nghe được ngay tại đây nhé!'
      : "Parents haven't sent tonight's bedtime voice message yet. Once they send it after work, you can listen right here!");

  const togglePlayback = () => {
    if (!hasParentEveningMessage) return;
    if (!isPlaying) {
      setIsPlaying(true);
      markEveningListened();
      webAudioService.playAudioUrl(state.eveningAudioUrl, messageText, () => {
        setIsPlaying(false);
      });
    } else {
      webAudioService.stopAudioPlayback();
      setIsPlaying(false);
    }
  };

  const handleStartRecordingReply = async () => {
    const started = await webAudioService.startAudioRecording(
      (waveform) => {
        setReplyWaveform(waveform);
      },
      undefined,
      isVi ? 'vi-VN' : 'en-US'
    );
    if (!started) {
      alert(isVi ? 'Không thể truy cập microphone' : 'Microphone access denied');
      return;
    }
    setReplyDuration(10);
    setIsRecordingReply(true);
    setReplyVoice(null);

    replyTimerRef.current = window.setInterval(() => {
      setReplyDuration((prev) => {
        if (prev <= 1) {
          handleStopRecordingReply();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStopRecordingReply = async () => {
    if (replyTimerRef.current) clearInterval(replyTimerRef.current);
    setIsRecordingReply(false);
    const result = await webAudioService.stopAudioRecording(10 - replyDuration || 8);

    let finalTranscript = (result.transcript || '').trim();
    if (result.url && result.url.startsWith('data:audio')) {
      setIsTranscribingReply(true);
      try {
        const aiStt = await apiClient.transcribeAudio({
          audioUrl: result.url,
          language: activeLanguage,
          localTranscript: finalTranscript,
          isDemo: isDemoAccount,
          speakerRole: 'CHILD',
        });
        if (aiStt.transcript) {
          finalTranscript = aiStt.transcript;
        }
      } finally {
        setIsTranscribingReply(false);
      }
    }

    setReplyVoice({
      ...result,
      transcript: finalTranscript || undefined,
    });
  };

  const handleTogglePlayReply = () => {
    if (!replyVoice?.url) return;
    if (isPlayingReply) {
      webAudioService.stopAudioPlayback();
      setIsPlayingReply(false);
    } else {
      setIsPlayingReply(true);
      webAudioService.playAudioUrl(replyVoice.url, replyVoice.transcript || '', () => {
        setIsPlayingReply(false);
      });
    }
  };

  const handleSendVoiceReply = async () => {
    if (!replyVoice) return;
    setSendingExtra(true);
    try {
      await submitEveningExtraReply(
        replyVoice,
        replyVoice.transcript || (isVi ? 'Con chúc bố mẹ ngủ ngon ạ, con thương bố mẹ nhiều!' : 'Good night Mom & Dad, love you!')
      );
      setExtraSentSuccess(true);
      setReplyVoice(null);
      setTimeout(() => setExtraSentSuccess(false), 4000);
    } finally {
      setSendingExtra(false);
    }
  };

  const handleExtraReply = async () => {
    setSendingExtra(true);
    try {
      await submitEveningExtraReply(
        undefined,
        isVi ? 'Con chúc bố mẹ ngủ ngon ạ, con yêu bố mẹ!' : 'Good night Mom & Dad, I love you!'
      );
      setExtraSentSuccess(true);
      setTimeout(() => setExtraSentSuccess(false), 3000);
    } finally {
      setSendingExtra(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 720,
        margin: '0 auto',
        padding: '20px 16px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* Top App Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onBack}
          type="button"
          style={{
            border: 'none',
            backgroundColor: colors.surfaceContainerHigh,
            width: 44,
            height: 44,
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MIcon name="arrow_back" size={22} color={colors.textDark} />
        </button>

        <div>
          <AccessibleText variant="h1" weight="900" color={colors.textDark}>
            {isVi ? 'Nhịp Tối (20:30 – 21:00)' : 'Evening Touch'}
          </AccessibleText>
          <div>
            <AccessibleText variant="caption" color={colors.textSecondary}>
              {isVi ? 'Hộp thư thoại dặn dò chúc ngủ ngon từ bố mẹ' : 'Bedtime voice note from parents'}
            </AccessibleText>
          </div>
        </div>
      </div>

      {/* Main Indigo Moon Card */}
      <div
        style={{
          background: isDark
            ? 'linear-gradient(145deg, #1A134D 0%, #0A0724 100%)'
            : 'linear-gradient(145deg, #ECEBFF 0%, #D8D6FF 100%)',
          borderRadius: 36,
          padding: '28px 22px',
          border: `2px solid ${colors.eveningBorder}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 16,
          boxShadow: '0 12px 36px rgba(76, 67, 214, 0.16)',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: isDark ? 'rgba(193, 193, 255, 0.2)' : '#E1E0FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(61, 50, 184, 0.25)',
          }}
        >
          <MIcon name="nights_stay" size={46} color={isDark ? '#C1C1FF' : '#3D32B8'} />
        </div>

        <div>
          <AccessibleText variant="hero" weight="900" color={isDark ? '#E1E0FF' : '#110563'}>
            {isVi ? 'Lời Dặn Dò Trước Giờ Ngủ' : 'Bedtime Voice Message'}
          </AccessibleText>
          <div style={{ marginTop: 6 }}>
            <AccessibleText variant="caption" color={isDark ? '#B3B0F5' : '#453EB5'} weight="700">
              {hasParentEveningMessage
                ? isVi
                  ? 'Gửi từ Bố Mẹ'
                  : 'Sent from Mom & Dad'
                : isVi
                ? 'Đang chờ lời nhắn tối nay từ Bố Mẹ'
                : 'Waiting for tonight’s voice note from Parents'}
            </AccessibleText>
          </div>
        </div>

        {/* Audio Waveform Player (only active when a real message or demo exists) */}
        {hasParentEveningMessage && (
          <div style={{ width: '100%', maxWidth: 440 }}>
            <AudioWaveform
              isPlaying={isPlaying}
              onPlayToggle={togglePlayback}
              waveform={[0.3, 0.7, 0.85, 0.6, 0.95, 0.7, 0.4, 0.8, 0.6, 0.3, 0.75, 0.5]}
              durationSec={30}
              accentColor={colors.eveningPrimary}
            />
          </div>
        )}

        {/* Transcription text */}
        <div
          style={{
            backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)',
            padding: '16px 20px',
            borderRadius: 22,
            maxWidth: 480,
            borderLeft: `4px solid ${colors.eveningPrimary}`,
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <MIcon name={hasParentEveningMessage ? 'format_quote' : 'schedule'} size={18} color={colors.eveningPrimary} />
            <AccessibleText variant="label" weight="800" color={isDark ? '#E1E0FF' : '#2A2096'}>
              {hasParentEveningMessage
                ? isVi
                  ? 'Nội dung dặn dò của Bố Mẹ:'
                  : 'Message Transcript:'
                : isVi
                ? 'Trạng thái hộp thư tối:'
                : 'Bedtime Mailbox Status:'}
            </AccessibleText>
          </div>

          <AccessibleText variant="bodyLarge" weight="600" color={isDark ? '#F1F0FF' : '#1E1510'}>
            {hasParentEveningMessage ? `“${messageText}”` : messageText}
          </AccessibleText>
        </div>
      </div>

      {/* Extra 1-touch or Voice reply back to parents */}
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
        <div style={{ textAlign: 'center' }}>
          <AccessibleText variant="h2" weight="900" color={colors.textDark}>
            {isVi ? 'Gửi lại lời chúc ngủ ngon cho Bố Mẹ' : 'Send Good Night Wish Back'}
          </AccessibleText>
          <div style={{ marginTop: 4 }}>
            <AccessibleText variant="caption" color={colors.textSecondary}>
              {isVi
                ? 'Chạm 1 lần hoặc thu âm giọng nói để gửi lời chúc ngủ ngon về điện thoại của bố mẹ.'
                : 'One-tap or record a quick voice note to send "Good night!" back to your parents.'}
            </AccessibleText>
          </div>
        </div>

        {/* Optional Voice Reply Recorder */}
        {(isRecordingReply || isTranscribingReply || replyVoice) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AudioWaveform
              isRecording={isRecordingReply}
              remainingSec={replyDuration}
              durationSec={replyVoice?.duration}
              waveform={isRecordingReply ? replyWaveform : replyVoice?.waveform}
              isPlaying={isPlayingReply}
              onPlayToggle={replyVoice ? handleTogglePlayReply : undefined}
              accentColor={colors.eveningPrimary}
            />
            {isTranscribingReply && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <GoogleLoadingIndicator size={16} strokeWidth={2.5} multiColor={true} />
                <span style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary }}>
                  {isVi ? 'AI đang nhận diện giọng nói...' : 'AI transcribing voice...'}
                </span>
              </div>
            )}
            {replyVoice?.transcript && (
              <div
                style={{
                  padding: '8px 14px',
                  borderRadius: 12,
                  backgroundColor: colors.surfaceContainer,
                  fontSize: 13,
                  fontStyle: 'italic',
                  color: colors.textDark,
                }}
              >
                “{replyVoice.transcript}”
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {!isRecordingReply ? (
            <BigButton
              variant="tonal"
              iconName="mic"
              onClick={handleStartRecordingReply}
              loading={isTranscribingReply}
            >
              {replyVoice
                ? isVi
                  ? 'Thu Âm Lại (10s)'
                  : 'Re-record Voice (10s)'
                : isVi
                ? 'Thu Âm Chúc Ngủ Ngon (10s)'
                : 'Record Voice Wish (10s)'}
            </BigButton>
          ) : (
            <BigButton
              variant="danger"
              iconName="stop"
              onClick={handleStopRecordingReply}
            >
              {isVi ? 'Dừng Thu Âm' : 'Stop Recording'}
            </BigButton>
          )}

          {replyVoice && !isRecordingReply && (
            <BigButton
              variant="evening"
              iconName="send"
              onClick={handleSendVoiceReply}
              loading={sendingExtra || isTranscribingReply}
            >
              {isVi ? 'Gửi Giọng Nói Chúc Ngủ Ngon' : 'Send Voice Reply'}
            </BigButton>
          )}
        </div>

        {extraSentSuccess ? (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 18,
              backgroundColor: isDark ? 'rgba(34, 197, 94, 0.22)' : '#DCFCE7',
              color: isDark ? '#86EFAC' : '#15803D',
              fontSize: 14,
              fontWeight: 800,
              textAlign: 'center',
            }}
          >
            {isVi
              ? 'Đã gửi lời chúc ngủ ngon về cho bố mẹ!'
              : 'Good night wish sent to parents!'}
          </div>
        ) : null}

        <BigButton
          variant="evening"
          iconName="favorite"
          onClick={handleExtraReply}
          loading={sendingExtra}
          minHeight={66}
        >
          {isVi
            ? '💖 “CON CHÚC BỐ MẸ NGỦ NGON!” (1 CHẠM)'
            : '💖 "GOOD NIGHT PARENTS!" (1 TAP)'}
        </BigButton>
      </div>
    </div>
  );
};
