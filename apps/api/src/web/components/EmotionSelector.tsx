import React from 'react';
import type { MoodType } from '@nhipnha/shared';
import { EMOTIONS } from '@nhipnha/shared';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { MIcon } from './MIcon';
import { AccessibleText } from './AccessibleText';

interface EmotionSelectorProps {
  selectedMood: MoodType;
  onSelectMood: (mood: MoodType) => void;
}

export const EmotionSelector: React.FC<EmotionSelectorProps> = ({
  selectedMood,
  onSelectMood,
}) => {
  const { activeLanguage } = useLanguage();
  const { colors, isDark } = useTheme();
  const isVi = activeLanguage === 'vi';

  const emotionLabels: Record<MoodType, { labelVi: string; labelEn: string; subVi: string; subEn: string; icon: string }> = {
    JOYFUL: {
      labelVi: 'Vui vẻ',
      labelEn: 'Joyful',
      subVi: 'Nhiều chuyện vui',
      subEn: 'Lots of fun today',
      icon: 'sentiment_very_satisfied',
    },
    CALM: {
      labelVi: 'Bình yên',
      labelEn: 'Calm',
      subVi: 'Một ngày êm đềm',
      subEn: 'A peaceful day',
      icon: 'wb_cloudy',
    },
    TIRED: {
      labelVi: 'Hơi mệt',
      labelEn: 'Tired',
      subVi: 'Cần nghỉ ngơi xíu',
      subEn: 'Need a little rest',
      icon: 'bedtime',
    },
    NEED_HUG: {
      labelVi: 'Cần ôm',
      labelEn: 'Need a Hug',
      subVi: 'Nhớ bố mẹ nhiều',
      subEn: 'Miss parents a lot',
      icon: 'favorite',
    },
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 12,
        width: '100%',
      }}
    >
      {EMOTIONS.map((emotion) => {
        const isSelected = selectedMood === emotion.id;
        const info = emotionLabels[emotion.id];

        const bg = isDark
          ? isSelected
            ? '#4E2D00'
            : colors.surfaceContainer
          : isSelected
          ? emotion.colorBg
          : colors.surfaceContainerLow;

        const border = isSelected
          ? `3px solid ${emotion.colorBorder}`
          : `1px solid ${colors.outlineVariant}`;

        const textColor = isDark
          ? isSelected
            ? '#FFDEA8'
            : colors.textDark
          : isSelected
          ? emotion.colorText
          : colors.textDark;

        return (
          <button
            key={emotion.id}
            type="button"
            onClick={() => onSelectMood(emotion.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 12px',
              borderRadius: 24,
              backgroundColor: bg,
              border,
              boxShadow: isSelected ? '0 6px 18px rgba(0,0,0,0.12)' : 'none',
              transform: isSelected ? 'scale(1.03)' : 'scale(1)',
              transition: 'all 0.16s ease',
              cursor: 'pointer',
              outline: 'none',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: isSelected ? emotion.colorBorder : colors.surfaceContainerHighest,
                color: isSelected ? '#FFFFFF' : emotion.colorBorder,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                transition: 'all 0.16s ease',
              }}
            >
              <MIcon
                name={info.icon}
                size={28}
                color={isSelected ? '#FFFFFF' : emotion.colorBorder}
              />
            </div>

            <AccessibleText variant="h2" weight="900" color={textColor}>
              {isVi ? info.labelVi : info.labelEn}
            </AccessibleText>

            <AccessibleText
              variant="caption"
              weight="700"
              color={isSelected ? textColor : colors.textSecondary}
              style={{ marginTop: 2 }}
            >
              {isVi ? info.subVi : info.subEn}
            </AccessibleText>
          </button>
        );
      })}
    </div>
  );
};
