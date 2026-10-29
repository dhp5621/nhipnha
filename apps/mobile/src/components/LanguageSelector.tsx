import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { THEME } from '../constants/theme';
import type { LanguagePreference } from '../i18n/translations';

export const LanguageSelector: React.FC = () => {
  const { preference, activeLanguage, setLanguagePreference, t } = useLanguage();

  const options: { id: LanguagePreference; label: string; sublabel: string; flag: string }[] = [
    {
      id: 'system',
      label: t('systemDefault'),
      sublabel: `Active: ${activeLanguage === 'vi' ? 'Tiếng Việt' : 'English'}`,
      flag: '⚙️',
    },
    {
      id: 'en',
      label: 'English',
      sublabel: 'RMIT Competition Standard',
      flag: '🇬🇧',
    },
    {
      id: 'vi',
      label: 'Tiếng Việt',
      sublabel: 'Gia đình nông thôn',
      flag: '🇻🇳',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('languageSettingTitle')}</Text>
      <View style={styles.optionsRow}>
        {options.map((opt) => {
          const isSelected = preference === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.8}
              onPress={() => setLanguagePreference(opt.id)}
              style={[
                styles.optionBtn,
                {
                  backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                  borderColor: isSelected ? '#2563EB' : '#CBD5E1',
                  borderWidth: isSelected ? 3 : 1.5,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${opt.label}, ${opt.sublabel}`}
            >
              <Text style={styles.flag}>{opt.flag}</Text>
              <Text style={[styles.label, isSelected && styles.selectedLabel]} numberOfLines={1}>
                {opt.label}
              </Text>
              <Text style={styles.sublabel} numberOfLines={1}>
                {opt.sublabel}
              </Text>
              {isSelected && <Text style={styles.checkBadge}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.card,
    padding: 16,
    marginVertical: 10,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    width: '100%',
  },
  title: {
    fontSize: THEME.typography.h2,
    fontWeight: '800',
    color: THEME.colors.textDark,
    marginBottom: 10,
  },
  optionsRow: {
    flexDirection: 'column',
    gap: 8,
  },
  optionBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56, // Accessible touch target
  },
  flag: {
    fontSize: 26,
    marginRight: 12,
  },
  label: {
    fontSize: THEME.typography.bodyLarge,
    fontWeight: '700',
    color: THEME.colors.textDark,
    flex: 1,
  },
  selectedLabel: {
    color: '#1D4ED8',
  },
  sublabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginRight: 8,
  },
  checkBadge: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2563EB',
  },
});
