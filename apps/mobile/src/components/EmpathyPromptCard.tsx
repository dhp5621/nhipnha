import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

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
  const { colors } = useTheme();
  const isVi = activeLanguage === 'vi';

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => onSelectPrompt(prompt)}
      style={[
        styles.card,
        {
          backgroundColor: isSelected
            ? colors.secondaryContainer
            : colors.surfaceContainerLow,
          borderRadius: isSelected ? 28 : 20,
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
            {
              backgroundColor: isSelected
                ? colors.secondary
                : colors.surfaceContainerHigh,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: isSelected
                  ? colors.onSecondary
                  : colors.textSecondary,
              },
            ]}
          >
            {isSelected ? '✓ ' : ''}
            {isVi ? `Gợi ý ${index + 1}` : `Prompt ${index + 1}`}
          </Text>
        </View>
      </View>
      <Text
        style={[
          styles.promptText,
          {
            color: isSelected
              ? colors.onSecondaryContainer
              : colors.textDark,
          },
        ]}
      >
        “{prompt}”
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginVertical: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  promptText: {
    fontSize: THEME.typography.bodyLarge,
    lineHeight: 26,
    fontWeight: '700',
  },
});
