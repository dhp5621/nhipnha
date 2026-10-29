import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { THEME } from '../constants/theme';
import type { LanguagePreference } from '../i18n/translations';

export const LanguageSelector: React.FC = () => {
  const { preference, activeLanguage, setLanguagePreference, t } = useLanguage();

  const options: { id: LanguagePreference; label: string; sublabel: string; flag: string }[] = [
    {
      id: 'vi',
      label: 'Tiếng Việt',
      sublabel: 'Gia đình Việt Nam',
      flag: '🇻🇳',
    },
    {
      id: 'en',
      label: 'English',
      sublabel: 'RBPC Global',
      flag: '🇬🇧',
    },
    {
      id: 'system',
      label: activeLanguage === 'vi' ? 'Tự động' : 'Auto',
      sublabel: activeLanguage === 'vi' ? 'Theo máy' : 'System',
      flag: '🌐',
    },
  ];

  return (
    <View style={[styles.container, THEME.shadows.card]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>🌐 {t('languageSettingTitle')}</Text>
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>
            {activeLanguage === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
          </Text>
        </View>
      </View>

      <View style={styles.segmentedRow}>
        {options.map((opt) => {
          const isSelected = preference === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.82}
              onPress={() => setLanguagePreference(opt.id)}
              style={[
                styles.segmentBtn,
                isSelected ? styles.segmentSelected : styles.segmentUnselected,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${opt.label}, ${opt.sublabel}`}
            >
              <Text style={styles.flag}>{opt.flag}</Text>
              <Text
                style={[styles.label, isSelected && styles.selectedLabel]}
                numberOfLines={1}
              >
                {opt.label}
              </Text>
              <Text
                style={[styles.sublabel, isSelected && styles.selectedSublabel]}
                numberOfLines={1}
              >
                {opt.sublabel}
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
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.card,
    padding: 16,
    marginVertical: 10,
    borderWidth: 2,
    borderColor: '#E6DFD7',
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
    color: THEME.colors.textDark,
    flex: 1,
  },
  activeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  segmentedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F6EFE6',
    padding: 5,
    borderRadius: 20,
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 68,
  },
  segmentSelected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D97706',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentUnselected: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  flag: {
    fontSize: 22,
    marginBottom: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textDark,
    textAlign: 'center',
  },
  selectedLabel: {
    color: '#B45309',
  },
  sublabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 1,
  },
  selectedSublabel: {
    color: '#92400E',
  },
});
