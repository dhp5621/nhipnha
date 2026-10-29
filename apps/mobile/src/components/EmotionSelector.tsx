import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { EMOTIONS, type MoodType, type EmotionOption } from '@nhipnha/shared';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { THEME } from '../constants/theme';

interface EmotionSelectorProps {
  selectedMood?: MoodType;
  onSelectMood: (mood: MoodType) => void;
}

export const EmotionSelector: React.FC<EmotionSelectorProps> = ({
  selectedMood,
  onSelectMood,
}) => {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();

  const getLocalizedEmotion = (item: EmotionOption) => {
    switch (item.id) {
      case 'JOYFUL':
        return { label: t('moodJoyful'), sublabel: t('moodJoyfulSub') };
      case 'CALM':
        return { label: t('moodCalm'), sublabel: t('moodCalmSub') };
      case 'TIRED':
        return { label: t('moodTired'), sublabel: t('moodTiredSub') };
      case 'NEED_HUG':
        return { label: t('moodNeedHug'), sublabel: t('moodNeedHugSub') };
      default:
        return { label: item.label, sublabel: item.sublabel };
    }
  };

  return (
    <View style={styles.grid}>
      {EMOTIONS.map((item: EmotionOption) => {
        const isSelected = selectedMood === item.id;
        const localized = getLocalizedEmotion(item);

        const activeBg = isDark ? colors.surfaceContainerHighest : item.colorBg;
        const inactiveBg = colors.surfaceContainerLow;
        const textColor = isSelected && !isDark ? item.colorText : colors.textDark;

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            onPress={() => onSelectMood(item.id)}
            style={[
              styles.card,
              {
                backgroundColor: isSelected ? activeBg : inactiveBg,
                borderColor: isSelected ? item.colorBorder : 'transparent',
                borderWidth: isSelected ? 2.5 : 0,
                borderRadius: isSelected ? 34 : 24,
              },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${localized.label}, ${localized.sublabel}`}
          >
            <View style={styles.cardTopRow}>
              <View
                style={[
                  styles.emojiCircle,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? colors.surfaceContainerLow
                        : '#FFFFFF'
                      : colors.surfaceContainerHigh,
                    borderRadius: isSelected ? 999 : 18,
                  },
                ]}
              >
                <MaterialIcons
                  name={item.emoji as any}
                  size={30}
                  color={item.colorBorder}
                />
              </View>
              <View
                style={[
                  styles.radioCircle,
                  isSelected
                    ? { backgroundColor: item.colorBorder, borderColor: item.colorBorder }
                    : { backgroundColor: 'transparent', borderColor: colors.outlineVariant },
                ]}
              >
                {isSelected && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
              </View>
            </View>

            <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
              {localized.label}
            </Text>
            <Text
              style={[
                styles.sublabel,
                { color: isSelected && !isDark ? item.colorText : colors.textSecondary },
              ]}
              numberOfLines={2}
            >
              {localized.sublabel}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
  },
  card: {
    width: '48.2%',
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 12,
    minHeight: 142,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 10,
  },
  emojiCircle: {
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircle: {
    width: 26,
    height: 26,
    borderRadius: 999,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: THEME.typography.h2,
    fontWeight: '800',
    textAlign: 'left',
    letterSpacing: -0.3,
  },
  sublabel: {
    fontSize: THEME.typography.label,
    fontWeight: '600',
    textAlign: 'left',
    marginTop: 2,
    lineHeight: 19,
  },
});
