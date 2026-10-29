import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';

interface EmpathyPromptCardProps {
  prompt: string;
  index: number;
  onSelectPrompt: (prompt: string) => void;
  isSelected?: boolean;
}

export const EmpathyPromptCard: React.FC<EmpathyPromptCardProps> = ({
  prompt,
  index,
  onSelectPrompt,
  isSelected = false,
}) => {
  const { activeLanguage } = useLanguage();
  const isVi = activeLanguage === 'vi';

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => onSelectPrompt(prompt)}
      style={[
        styles.card,
        {
          borderColor: isSelected ? '#15803D' : '#CBEAD6',
          backgroundColor: isSelected ? '#ECFDF3' : '#FFFFFF',
          borderWidth: isSelected ? 3 : 2,
          borderBottomWidth: isSelected ? 5 : 2,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${isVi ? 'Gợi ý' : 'Prompt'} ${index + 1}: ${prompt}`}
    >
      <View style={styles.headerRow}>
        <View
          style={[
            styles.badge,
            { backgroundColor: isSelected ? '#15803D' : '#DCFCE7' },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: isSelected ? '#FFFFFF' : '#166534' },
            ]}
          >
            {isSelected ? '✓ ' : '💬 '}
            {isVi ? `Câu hỏi mở ${index + 1}` : `Open Prompt ${index + 1}`}
          </Text>
        </View>
        <View style={styles.tipPill}>
          <Text style={styles.tip}>
            {isVi ? 'Không hỏi điểm số' : 'No score pressure'}
          </Text>
        </View>
      </View>
      <Text style={styles.promptText}>“{prompt}”</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 16,
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  tipPill: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tip: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },
  promptText: {
    fontSize: THEME.typography.bodyLarge,
    lineHeight: 27,
    color: THEME.colors.textDark,
    fontWeight: '700',
  },
});
