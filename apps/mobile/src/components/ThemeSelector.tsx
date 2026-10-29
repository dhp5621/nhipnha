import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { THEME, type ThemeMode } from '../constants/theme';

export const ThemeSelector: React.FC = () => {
  const { themeMode, isDark, colors, setThemeMode } = useTheme();
  const { activeLanguage } = useLanguage();
  const isVi = activeLanguage === 'vi';

  const options: {
    id: ThemeMode;
    label: string;
    sub: string;
    icon: keyof typeof MaterialIcons.glyphMap;
  }[] = [
    {
      id: 'light',
      label: isVi ? 'Sáng' : 'Light',
      sub: isVi ? 'Nắng ấm' : 'Warm Sun',
      icon: 'wb-sunny',
    },
    {
      id: 'dark',
      label: isVi ? 'Tối' : 'Dark',
      sub: isVi ? 'Dịu mắt' : 'Night Calm',
      icon: 'dark-mode',
    },
    {
      id: 'system',
      label: isVi ? 'Tự động' : 'System',
      sub: isVi ? 'Theo máy' : 'Auto',
      icon: 'brightness-auto',
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceContainerLow,
          borderColor: colors.outlineVariant,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.textDark }]}>
          {isVi ? 'Giao diện hiển thị' : 'Appearance'}
        </Text>
        <View
          style={[
            styles.activeBadge,
            {
              backgroundColor: colors.primaryContainer,
            },
          ]}
        >
          <Text style={[styles.activeBadgeText, { color: colors.onPrimaryContainer }]}>
            {isDark ? (isVi ? 'Chế độ Tối' : 'Dark') : isVi ? 'Chế độ Sáng' : 'Light'}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.segmentedRow,
          { backgroundColor: colors.surfaceContainerHigh },
        ]}
      >
        {options.map((opt) => {
          const isSelected = themeMode === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.85}
              onPress={() => setThemeMode(opt.id)}
              style={[
                styles.segmentBtn,
                isSelected
                  ? {
                      backgroundColor: colors.primary,
                      borderRadius: 999,
                    }
                  : {
                      backgroundColor: 'transparent',
                      borderRadius: 16,
                    },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
            >
              <MaterialIcons
                name={opt.icon}
                size={20}
                color={isSelected ? colors.onPrimary : colors.primary}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.label,
                  { color: isSelected ? colors.onPrimary : colors.textDark },
                ]}
                numberOfLines={1}
              >
                {opt.label}
              </Text>
              <Text
                style={[
                  styles.sub,
                  {
                    color: isSelected ? colors.onPrimary : colors.textMuted,
                    opacity: isSelected ? 0.9 : 1,
                  },
                ]}
                numberOfLines={1}
              >
                {opt.sub}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: THEME.borderRadius.card,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: THEME.typography.bodyLarge,
    fontWeight: '800',
  },
  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  segmentedRow: {
    flexDirection: 'row',
    padding: 5,
    borderRadius: 999,
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 62,
  },
  icon: {
    marginBottom: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  sub: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
