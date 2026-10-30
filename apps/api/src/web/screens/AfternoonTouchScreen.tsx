import React, { useState, useEffect, useRef } from 'react';
import type { MoodType, CreativeAttachment } from '@nhipnha/shared';
import { CREATIVE_ATTACHMENTS } from '@nhipnha/shared';
import { useRhythm } from '../context/RhythmContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { webAudioService } from '../services/webAudio';
import { EmotionSelector } from '../components/EmotionSelector';
import { AudioWaveform } from '../components/AudioWaveform';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { MIcon } from '../components/MIcon';
import { GoogleLoadingIndicator } from '../components/GoogleLoadingIndicator';

interface AfternoonTouchScreenProps {
  onBack: () => void;
}

export const AfternoonTouchScreen: React.FC<AfternoonTouchScreenProps> = ({ onBack }) => {
  const { state, submitAfternoonTouch } = useRhythm();
  const { activeLanguage } = useLanguage();
  const { colors, isDark } = useTheme();

  const [selectedMood, setSelectedMood] = useState<MoodType>(state.afternoonMood || 'JOYFUL');
  const [selectedAttachment, setSelectedAttachment] = useState<CreativeAttachment>(
    state.afternoonAttachment || CREATIVE_ATTACHMENTS[0]
  );
  const [noteText, setNoteText] = useState<string>(state.afternoonNote || '');
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>('');
  const [customPhotoName, setCustomPhotoName] = useState<string>('');

  const [isRecording, setIsRecording] = useState(false);
  const [durationLeft, setDurationLeft] = useState(15);
  const [liveWaveform, setLiveWaveform] = useState<number[]>([]);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [recordedVoice, setRecordedVoice] = useState<{
    url: string;
    duration: number;
    waveform: number[];
  } | null>(
    state.afternoonVoiceUrl
      ? {
          url: state.afternoonVoiceUrl,
          duration: state.afternoonVoiceDuration || 15,
          waveform: [0.3, 0.6, 0.8, 0.5, 0.9, 0.4, 0.7, 0.4],
        }
      : null
  );

  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const isVi = activeLanguage === 'vi';

  // 15-second countdown timer
  useEffect(() => {
    if (isRecording && durationLeft > 0) {
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
  }, [isRecording, durationLeft]);

  const handleStartRecording = async () => {
    const started = await webAudioService.startAudioRecording((waveform) => {
      setLiveWaveform(waveform);
    });
    if (!started) {
      alert(
        isVi
          ? 'Không thể truy cập microphone. Vui lòng cấp quyền trong cài đặt trình duyệt.'
          : 'Microphone permission denied.'
      );
      return;
    }
    setDurationLeft(15);
    setIsRecording(true);
    setRecordedVoice(null);
  };

  const handleStopRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    const result = await webAudioService.stopAudioRecording(15 - durationLeft || 14);
    setRecordedVoice(result);
  };

  const handleTogglePlayRecorded = () => {
    if (!recordedVoice?.url) return;
    if (isPlayingRecorded) {
      webAudioService.stopAudioPlayback();
      setIsPlayingRecorded(false);
    } else {
      setIsPlayingRecorded(true);
      webAudioService.playAudioUrl(recordedVoice.url, 'Giọng nói nhật ký chiều của con', () => {
        setIsPlayingRecorded(false);
      });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await webAudioService.processImageFile(file);
      setCustomPhotoUrl(res.dataUrl);
      setCustomPhotoName(res.name);
    } catch {
      alert(isVi ? 'Không thể đọc ảnh này' : 'Could not read image file');
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const finalAttachment: CreativeAttachment = customPhotoUrl
        ? {
            id: `photo_${Date.now()}`,
            type: 'PHOTO',
            titleVi: customPhotoName || 'Ảnh chụp buổi chiều',
            titleEn: customPhotoName || 'Afternoon photo',
            emoji: 'photo_camera',
            dominantColor: '#DF5018',
            imageUrl: customPhotoUrl,
            cvSignalVi: 'Ảnh chụp sinh hoạt buổi chiều của trẻ ở quê.',
            cvSignalEn: "Child's afternoon photo from home.",
          }
        : selectedAttachment;

      await submitAfternoonTouch(
        selectedMood,
        recordedVoice || undefined,
        finalAttachment,
        noteText.trim() || undefined
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 780,
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
            {isVi ? 'Nhịp Chiều (17:00 – 18:30)' : 'Afternoon Touch'}
          </AccessibleText>
          <div>
            <AccessibleText variant="caption" color={colors.textSecondary}>
              {isVi ? 'Nhật ký tương tác 15s • Cảm xúc, giọng nói & nét vẽ' : '15s Flash Diary • Emotions & Voice'}
            </AccessibleText>
          </div>
        </div>
      </div>

      {/* Step 1: 4 Emotions Selector */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              backgroundColor: isDark ? 'rgba(255, 181, 155, 0.2)' : '#FFDBCE',
              color: isDark ? '#FFB59B' : '#370E00',
              fontWeight: 900,
              fontSize: 12,
              padding: '3px 10px',
              borderRadius: 999,
            }}
          >
            {isVi ? 'BƯỚC 1' : 'STEP 1'}
          </span>
          <AccessibleText variant="h2" weight="900" color={colors.textDark}>
            {isVi ? 'Hôm nay con cảm thấy thế nào?' : 'How do you feel today?'}
          </AccessibleText>
        </div>

        <EmotionSelector selectedMood={selectedMood} onSelectMood={setSelectedMood} />
      </div>

      {/* Step 2: 15-Second Voice Recorder */}
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
            <span
              style={{
                backgroundColor: isDark ? 'rgba(255, 181, 155, 0.2)' : '#FFDBCE',
                color: isDark ? '#FFB59B' : '#370E00',
                fontWeight: 900,
                fontSize: 12,
                padding: '3px 10px',
                borderRadius: 999,
              }}
            >
              {isVi ? 'BƯỚC 2' : 'STEP 2'}
            </span>
            <AccessibleText variant="h2" weight="900" color={colors.textDark}>
              {isVi ? 'Ghi âm 15 giây kể cho bố mẹ' : '15s Voice Note'}
            </AccessibleText>
          </div>

          <span
            style={{
              backgroundColor: isRecording ? colors.errorBg : colors.surfaceContainerHighest,
              color: isRecording ? colors.error : colors.textSecondary,
              fontSize: 12,
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: 999,
            }}
          >
            {isRecording ? `00:${durationLeft.toString().padStart(2, '0')}` : 'Tối đa 15s'}
          </span>
        </div>

        {/* Live Audio Waveform */}
        <AudioWaveform
          isRecording={isRecording}
          remainingSec={durationLeft}
          durationSec={recordedVoice?.duration}
          waveform={isRecording ? liveWaveform : recordedVoice?.waveform}
          isPlaying={isPlayingRecorded}
          onPlayToggle={recordedVoice ? handleTogglePlayRecorded : undefined}
          accentColor={colors.afternoonPrimary}
        />

        {/* Live Vietnamese Speech-to-Text Recognition Indicator */}
        {isRecording && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 16,
              backgroundColor: '#FEF2F2',
              border: '1.5px solid #FCA5A5',
              marginTop: 4,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: '#DC2626',
                display: 'inline-block',
                boxShadow: '0 0 0 3px rgba(220, 38, 38, 0.25)',
              }}
            />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#991B1B', display: 'block' }}>
                {liveTranscript
                  ? (isVi ? `Đang nhận diện giọng bé: "${liveTranscript}"` : `Recognized: "${liveTranscript}"`)
                  : (isVi ? '🎙️ Đang nghe giọng bé nói... (Bé cứ kể tự nhiên nhé)' : '🎙️ Listening to voice...')}
              </span>
            </div>
          </div>
        )}

        {/* Recording Controls */}
        <div style={{ display: 'flex', gap: 10 }}>
          {!isRecording ? (
            <BigButton
              variant="afternoon"
              iconName={recordedVoice ? 'replay' : 'mic'}
              onClick={handleStartRecording}
            >
              {recordedVoice
                ? isVi
                  ? 'Thu Âm Lại (15 Giây)'
                  : 'Re-Record (15s)'
                : isVi
                ? 'Bắt Đầu Thu Âm 15s'
                : 'Start 15s Recording'}
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
      </div>

      {/* Step 3: Creative Attachment (Doodle or Photo) */}
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
            <span
              style={{
                backgroundColor: isDark ? 'rgba(255, 181, 155, 0.2)' : '#FFDBCE',
                color: isDark ? '#FFB59B' : '#370E00',
                fontWeight: 900,
                fontSize: 12,
                padding: '3px 10px',
                borderRadius: 999,
              }}
            >
              {isVi ? 'BƯỚC 3' : 'STEP 3'}
            </span>
            <AccessibleText variant="h2" weight="900" color={colors.textDark}>
              {isVi ? 'Đính kèm nét vẽ hoặc ảnh chụp' : 'Creative Attachment'}
            </AccessibleText>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            type="button"
            style={{
              border: 'none',
              backgroundColor: colors.surfaceContainerHighest,
              color: colors.primary,
              fontWeight: 800,
              fontSize: 12,
              padding: '6px 12px',
              borderRadius: 999,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <MIcon name="add_a_photo" size={16} color={colors.primary} />
            <span>{isVi ? 'Tải ảnh từ máy' : 'Upload photo'}</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handlePhotoUpload}
        />

        {/* 4 Folk Doodle Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          {CREATIVE_ATTACHMENTS.map((att) => {
            const isSelected = !customPhotoUrl && selectedAttachment.id === att.id;
            return (
              <button
                key={att.id}
                type="button"
                onClick={() => {
                  setCustomPhotoUrl('');
                  setSelectedAttachment(att);
                }}
                style={{
                  padding: 12,
                  borderRadius: 20,
                  backgroundColor: isSelected
                    ? isDark
                      ? '#4E2D00'
                      : '#FFDBCE'
                    : colors.surfaceContainer,
                  border: isSelected
                    ? `2px solid ${colors.afternoonPrimary}`
                    : `1px solid ${colors.outlineVariant}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: colors.surfaceContainerHighest,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MIcon name={att.emoji} size={22} color={att.dominantColor} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: colors.textDark }}>
                  {isVi ? att.titleVi.replace('Nét vẽ: ', '').replace('Ảnh chụp: ', '') : att.titleEn}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Uploaded Photo Preview */}
        {customPhotoUrl && (
          <div
            style={{
              padding: 12,
              borderRadius: 20,
              backgroundColor: colors.surfaceContainer,
              border: `2px solid ${colors.primary}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src={customPhotoUrl}
                alt="Uploaded"
                style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }}
              />
              <div>
                <span style={{ fontSize: 13, fontWeight: 800, color: colors.textDark, display: 'block' }}>
                  {customPhotoName || 'Ảnh chụp từ máy'}
                </span>
                <span style={{ fontSize: 11, color: colors.secondary, fontWeight: 700 }}>
                  {isVi ? 'Đã đính kèm ảnh thực tế' : 'Attached real photo'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setCustomPhotoUrl('')}
              type="button"
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                color: colors.error,
              }}
            >
              <MIcon name="delete" size={20} color={colors.error} />
            </button>
          </div>
        )}

        {/* Optional text note */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, display: 'block', marginBottom: 6 }}>
            {isVi ? 'Lời nhắn gửi thêm cho bố mẹ (tùy chọn):' : 'Additional note for parents (optional):'}
          </label>
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={isVi ? 'Ví dụ: Chiều nay bà nấu canh chua bông điên điển ngon lắm...' : 'e.g. Had delicious dinner with Grandma today...'}
            style={{
              width: '100%',
              padding: '12px 16px',
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
      </div>

      {/* Save & Submit Button */}
      {saveSuccess ? (
        <div
          style={{
            padding: '14px 20px',
            borderRadius: 20,
            backgroundColor: isDark ? 'rgba(34, 197, 94, 0.22)' : '#DCFCE7',
            color: isDark ? '#86EFAC' : '#15803D',
            fontSize: 15,
            fontWeight: 800,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <MIcon name="check_circle" size={20} color={isDark ? '#86EFAC' : '#15803D'} />
          <span>{isVi ? 'Đã lưu nhật ký chiều lên máy chủ thành công!' : 'Afternoon diary saved successfully!'}</span>
        </div>
      ) : null}

      <BigButton
        variant="afternoon"
        iconName="send"
        onClick={handleSubmit}
        loading={saving}
        minHeight={66}
      >
        {isVi ? 'GỬI NHẬT KÝ CHIỀU VỀ CHO BỐ MẸ' : 'SEND AFTERNOON DIARY TO PARENTS'}
      </BigButton>
    </div>
  );
};
