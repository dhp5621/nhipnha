import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useTheme, type TextScalePreference } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { THEME } from '../constants/theme';

export const TextSizeSelector: React.FC = () => {
  const { textScale, setTextScale, colors } = useTheme();
  const { activeLanguage } = useLanguage();
  const isVi = activeLanguage === 'vi';

  const options: {
    id: TextScalePreference;
    label: string;
    sub: string;
    sampleSize: number;
  }[] = [
    {
      id: 'role_default',
      label: isVi ? 'Tự động' : 'Auto',
      sub: isVi ? 'Lớn cho Ông Bà' : 'By Role',
      sampleSize: 15,
    },
    {
      id: 'normal',
      label: isVi ? 'Chuẩn' : 'Normal',
      sub: '100%',
      sampleSize: 14,
    },
    {
      id: 'large',
      label: isVi ? 'Lớn' : 'Large',
      sub: '+15%',
      sampleSize: 17,
    },
    {
      id: 'extra_large',
      label: isVi ? 'Rất lớn' : 'Max',
      sub: '+30%',
      sampleSize: 20,
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
          {isVi ? 'Cỡ chữ hiển thị' : 'Text Size'}
        </Text>
        <View
          style={[
            styles.activeBadge,
            { backgroundColor: colors.surfaceContainerHighest },
          ]}
        >
          <Text style={[styles.activeBadgeText, { color: colors.textSecondary }]}>
            {textScale === 'role_default'
              ? isVi
                ? 'Theo vai trò'
                : 'Role Auto'
              : textScale === 'normal'
              ? '100%'
              : textScale === 'large'
              ? '115%'
              : '130%'}
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
          const isSelected = textScale === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.85}
              onPress={() => setTextScale(opt.id)}
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
              <Text
                style={{
                  fontSize: opt.sampleSize,
                  fontWeight: '900',
                  color: isSelected ? colors.onPrimary : colors.primary,
                  lineHeight: 22,
                }}
              >
                Aa
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
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 62,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 2,
  },
  sub: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});
