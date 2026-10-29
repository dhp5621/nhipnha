import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';

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
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onSelectPrompt(prompt)}
      style={[
        styles.card,
        {
          borderColor: isSelected ? '#15803D' : '#E2E8F0',
          backgroundColor: isSelected ? '#F0FDF4' : '#FFFFFF',
          borderWidth: isSelected ? 3 : 1.5,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Gợi ý ${index + 1}: ${prompt}`}
    >
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Gợi ý {index + 1}</Text>
        </View>
        <Text style={styles.tip}>30s phản hồi</Text>
      </View>
      <Text style={styles.promptText}>{prompt}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: THEME.borderRadius.button,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '700',
  },
  tip: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  promptText: {
    fontSize: THEME.typography.bodyLarge,
    lineHeight: 28,
    color: THEME.colors.textDark,
    fontWeight: '600',
  },
});
