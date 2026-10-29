import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { EMOTIONS, type MoodType, type EmotionOption } from '@nhipnha/shared';
import { useLanguage } from '../context/LanguageContext';
import { THEME } from '../constants/theme';

interface EmotionSelectorProps {
  selectedMood?: MoodType;
  onSelectMood: (mood: MoodType) => void;
}

export const EmotionSelector: React.FC<EmotionSelectorProps> = ({
  selectedMood,
  onSelectMood,
}) => {
  const { t, activeLanguage } = useLanguage();

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
        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            onPress={() => onSelectMood(item.id)}
            style={[
              styles.card,
              THEME.shadows.card,
              {
                backgroundColor: isSelected ? item.colorBg : '#FFFFFF',
                borderColor: isSelected ? item.colorBorder : '#E6DFD7',
                borderWidth: isSelected ? 3 : 2,
                borderBottomWidth: isSelected ? 6 : 3,
                transform: [{ scale: isSelected ? 1.02 : 1 }],
              },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${localized.label}, ${localized.sublabel}`}
          >
            {/* Top Selection Indicator */}
            <View style={styles.cardTopRow}>
              <View
                style={[
                  styles.emojiCircle,
                  { backgroundColor: isSelected ? '#FFFFFF' : item.colorBg },
                ]}
              >
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
              <View
                style={[
                  styles.radioCircle,
                  isSelected
                    ? { backgroundColor: item.colorBorder, borderColor: item.colorBorder }
                    : { backgroundColor: '#F8F2EA', borderColor: '#CFC5BA' },
                ]}
              >
                {isSelected && <Text style={styles.radioCheck}>✓</Text>}
              </View>
            </View>

            <Text style={[styles.label, { color: item.colorText }]} numberOfLines={1}>
              {localized.label}
            </Text>
            <Text style={[styles.sublabel, { color: item.colorText }]} numberOfLines={2}>
              {localized.sublabel}
            </Text>

            {isSelected && (
              <View style={[styles.selectedPill, { backgroundColor: item.colorBorder }]}>
                <Text style={styles.selectedPillText}>
                  {activeLanguage === 'vi' ? 'Đang chọn' : 'Selected'}
                </Text>
              </View>
            )}
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
    borderRadius: THEME.borderRadius.card,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 14,
    minHeight: 150,
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
    width: 58,
    height: 58,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 34,
  },
  radioCircle: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCheck: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
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
    opacity: 0.9,
    lineHeight: 20,
  },
  selectedPill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  selectedPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
