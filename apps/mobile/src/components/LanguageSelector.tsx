import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { THEME } from '../constants/theme';
import type { LanguagePreference } from '../i18n/translations';

export const LanguageSelector: React.FC = () => {
  const { preference, activeLanguage, setLanguagePreference, t } = useLanguage();
  const { colors } = useTheme();

  const options: { id: LanguagePreference; label: string; sublabel: string; code: string }[] = [
    {
      id: 'vi',
      label: 'Tiếng Việt',
      sublabel: 'Mặc định',
      code: 'VI',
    },
    {
      id: 'en',
      label: 'English',
      sublabel: 'International',
      code: 'EN',
    },
    {
      id: 'system',
      label: activeLanguage === 'vi' ? 'Tự động' : 'System',
      sublabel: activeLanguage === 'vi' ? 'Theo máy' : 'Device',
      code: 'AUTO',
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
          {t('languageSettingTitle')}
        </Text>
        <View
          style={[
            styles.activeBadge,
            { backgroundColor: colors.secondaryContainer },
          ]}
        >
          <Text style={[styles.activeBadgeText, { color: colors.onSecondaryContainer }]}>
            {activeLanguage === 'vi' ? 'Tiếng Việt' : 'English'}
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
          const isSelected = preference === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.85}
              onPress={() => setLanguagePreference(opt.id)}
              style={[
                styles.segmentBtn,
                isSelected
                  ? {
                      backgroundColor: colors.primary,
                      borderRadius: 999, // M3 Expressive Morphing Pill
                    }
                  : {
                      backgroundColor: 'transparent',
                      borderRadius: 16,
                    },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${opt.label}, ${opt.sublabel}`}
            >
              <Text
                style={[
                  styles.codeTag,
                  { color: isSelected ? colors.onPrimary : colors.primary },
                ]}
              >
                {opt.code}
              </Text>
              <Text
                style={[
                  styles.label,
                  { color: isSelected ? colors.onPrimary : colors.textDark },
                ]}
                numberOfLines={1}
              >
                {opt.label}
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
    flex: 1,
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
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
  },
  codeTag: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 2,
  },
});
