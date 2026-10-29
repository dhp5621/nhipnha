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
            activeOpacity={0.8}
            onPress={() => onSelectMood(item.id)}
            style={[
              styles.card,
              {
                backgroundColor: item.colorBg,
                borderColor: isSelected ? item.colorBorder : '#E2E8F0',
                borderWidth: isSelected ? 4 : 2,
                transform: [{ scale: isSelected ? 1.04 : 1 }],
              },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${localized.label}, ${localized.sublabel}`}
          >
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={[styles.label, { color: item.colorText }]}>
              {localized.label}
            </Text>
            <Text style={[styles.sublabel, { color: item.colorText }]}>
              {localized.sublabel}
            </Text>
            {isSelected && (
              <View style={[styles.badge, { backgroundColor: item.colorBorder }]}>
                <Text style={styles.badgeText}>✓ {activeLanguage === 'vi' ? 'Đã chọn' : 'Selected'}</Text>
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
    marginVertical: 10,
  },
  card: {
    width: '48%',
    borderRadius: THEME.borderRadius.card,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 14,
    minHeight: 125,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 6,
  },
  label: {
    fontSize: THEME.typography.h2,
    fontWeight: '800',
    textAlign: 'center',
  },
  sublabel: {
    fontSize: THEME.typography.label,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.9,
  },
  badge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
