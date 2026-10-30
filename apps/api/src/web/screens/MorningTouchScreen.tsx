import React, { useState } from 'react';
import { useRhythm } from '../context/RhythmContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { webAudioService } from '../services/webAudio';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { MIcon } from '../components/MIcon';

interface MorningTouchScreenProps {
  onBack: () => void;
}

export const MorningTouchScreen: React.FC<MorningTouchScreenProps> = ({ onBack }) => {
  const { state, markMorningBellListened, submitMorningTouch } = useRhythm();
  const { activeLanguage } = useLanguage();
  const { colors, isDark } = useTheme();

  const [submitting, setSubmitting] = useState(false);
  const [justTouched, setJustTouched] = useState(false);
  const [isPlayingBell, setIsPlayingBell] = useState(false);

  const isVi = activeLanguage === 'vi';
  const isDone = state.morningCompleted || justTouched;

  const handlePlayMorningBell = () => {
    if (!isPlayingBell) {
      setIsPlayingBell(true);
      markMorningBellListened();
      webAudioService.playMorningBellChime(() => {
        setIsPlayingBell(false);
      });
    } else {
      webAudioService.stopAudioPlayback();
      setIsPlayingBell(false);
    }
  };

  const handleTouch = async () => {
    setSubmitting(true);
    try {
      await submitMorningTouch();
      setJustTouched(true);
    } finally {
      setSubmitting(false);
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
            {isVi ? 'Nhịp Sáng (06:30 – 07:15)' : 'Morning Touch'}
          </AccessibleText>
          <div>
            <AccessibleText variant="caption" color={colors.textSecondary}>
              {isVi ? 'Chào ngày mới & nghe lời dặn của bố mẹ' : 'Morning greeting & school wake-up'}
            </AccessibleText>
          </div>
        </div>
      </div>

      {/* Main Morning Sun Hero Card */}
      <div
        style={{
          background: isDark
            ? 'linear-gradient(145deg, #382405 0%, #1F1500 100%)'
            : 'linear-gradient(145deg, #FFF4D9 0%, #FFE5A3 100%)',
          borderRadius: 36,
          padding: '28px 22px',
          border: `2px solid ${colors.morningBorder}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 16,
          boxShadow: '0 12px 36px rgba(229, 148, 0, 0.14)',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: '#FFDEA8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(140, 79, 0, 0.2)',
          }}
        >
          <MIcon name="wb_sunny" size={48} color="#8C4F00" />
        </div>

        <div>
          <AccessibleText variant="hero" weight="900" color={isDark ? '#FFDF9E' : '#2C1600'}>
            {isVi ? 'Tiếng Chuông Buổi Sáng' : 'Morning Chime Bell'}
          </AccessibleText>
          <div style={{ marginTop: 6, maxWidth: 440, margin: '6px auto 0' }}>
            <AccessibleText variant="bodyLarge" color={isDark ? '#E5C070' : '#5C3800'} weight="600">
              {isVi
                ? '“Con yêu ơi dậy đi học nhé! Bố mẹ vào ca sáng rồi, chúc con ở lớp thật vui nha!”'
                : '“Wake up sweet child! Parents are starting our shift, have a joyful day at school!”'}
            </AccessibleText>
          </div>
        </div>

        {/* Play Chime Button */}
        <button
          onClick={handlePlayMorningBell}
          type="button"
          style={{
            border: 'none',
            backgroundColor: isPlayingBell ? colors.error : colors.morningPrimary,
            color: '#FFFFFF',
            padding: '12px 24px',
            borderRadius: 999,
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
            transition: 'all 0.16s ease',
          }}
        >
          <MIcon name={isPlayingBell ? 'stop' : 'volume_up'} size={22} color="#FFFFFF" />
          <span>{isPlayingBell ? (isVi ? 'Dừng phát' : 'Stop') : isVi ? 'Nghe Tiếng Chuông Bố Mẹ' : 'Listen to Morning Chime'}</span>
        </button>
      </div>

      {/* One-Touch Greeting Check-In Action */}
      <div
        style={{
          backgroundColor: colors.surfaceContainerLow,
          borderRadius: 32,
          padding: 24,
          border: `1px solid ${colors.outlineVariant}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <AccessibleText variant="h2" weight="900" color={colors.textDark}>
            {isDone
              ? isVi
                ? '✅ Con Đã Gửi Lời Chào Buổi Sáng Rồi!'
                : '✅ Morning Greeting Sent!'
              : isVi
              ? 'Chạm Một Chạm Để Báo Thức Cho Bố Mẹ'
              : 'One-Tap to Send Morning Wake-Up to Parents'}
          </AccessibleText>
          <div style={{ marginTop: 4 }}>
            <AccessibleText variant="caption" color={colors.textSecondary}>
              {isDone
                ? isVi
                  ? `Đã lưu trên máy chủ lúc ${state.morningTime || 'hôm nay'}. Bố mẹ ở công ty đã nhận được thông báo.`
                  : 'Saved on server database. Parents received your morning status.'
                : isVi
                ? 'Bố mẹ nhận được thông báo ngay cả khi đang trong ca sản xuất.'
                : 'Parents will be notified even while on factory shift.'}
            </AccessibleText>
          </div>
        </div>

        <BigButton
          variant={isDone ? 'tonal' : 'morning'}
          iconName={isDone ? 'check_circle' : 'touch_app'}
          onClick={handleTouch}
          loading={submitting}
          minHeight={68}
        >
          {isDone
            ? isVi
              ? 'BẤM GỬI LẠI LỜI CHÀO SÁNG NAY'
              : 'RE-SEND MORNING GREETING'
            : isVi
            ? '☀️ GỬI LỜI CHÀO ĐI HỌC (1 CHẠM)'
            : '☀️ SEND MORNING TOUCH (1 TAP)'}
        </BigButton>
      </div>
    </div>
  );
};
