import React from 'react';
import { Text, TextProps, StyleSheet, Platform } from 'react-native';
import { THEME } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface AccessibleTextProps extends TextProps {
  variant?: 'display' | 'hero' | 'h1' | 'h2' | 'bodyLarge' | 'bodyRegular' | 'label' | 'caption';
  color?: string;
  weight?: 'normal' | '500' | '600' | '700' | '800' | '900';
  center?: boolean;
}

export const AccessibleText: React.FC<AccessibleTextProps> = ({
  children,
  variant = 'bodyRegular',
  color,
  weight = 'normal',
  center = false,
  style,
  ...props
}) => {
  const { colors, getFontBoost } = useTheme();
  const resolvedColor = color || colors.textDark;

  let role: string | undefined;
  try {
    const auth = useAuth();
    role = auth.member?.role;
  } catch {
    // Fallback if used outside AuthProvider
  }

  const fontBoost = getFontBoost(role);
  const labelBoost = Math.round(fontBoost * 0.6);

  const getStyleForVariant = () => {
    switch (variant) {
      case 'display':
        return {
          fontSize: THEME.typography.display + fontBoost,
          lineHeight: Math.round((THEME.typography.display + fontBoost) * 1.35),
          fontWeight: '700' as const,
          letterSpacing: -0.8,
        };
      case 'hero':
        return {
          fontSize: THEME.typography.hero + fontBoost,
          lineHeight: Math.round((THEME.typography.hero + fontBoost) * 1.35),
          fontWeight: '700' as const,
          letterSpacing: -0.5,
        };
      case 'h1':
        return {
          fontSize: THEME.typography.h1 + fontBoost,
          lineHeight: Math.round((THEME.typography.h1 + fontBoost) * 1.35),
          fontWeight: '700' as const,
          letterSpacing: -0.3,
        };
      case 'h2':
        return {
          fontSize: THEME.typography.h2 + fontBoost,
          lineHeight: Math.round((THEME.typography.h2 + fontBoost) * 1.35),
          fontWeight: '700' as const,
          letterSpacing: -0.2,
        };
      case 'bodyLarge':
        return {
          fontSize: THEME.typography.bodyLarge + fontBoost,
          lineHeight: Math.round((THEME.typography.bodyLarge + fontBoost) * 1.38),
          fontWeight: '700' as const,
        };
      case 'label':
        return {
          fontSize: THEME.typography.label + labelBoost,
          lineHeight: Math.round((THEME.typography.label + labelBoost) * 1.38),
          fontWeight: '700' as const,
          letterSpacing: 0.2,
        };
      case 'caption':
        return {
          fontSize: THEME.typography.caption + labelBoost,
          lineHeight: Math.round((THEME.typography.caption + labelBoost) * 1.38),
          fontWeight: '700' as const,
          letterSpacing: 0.4,
        };
      case 'bodyRegular':
      default:
        return {
          fontSize: THEME.typography.bodyRegular + fontBoost,
          lineHeight: Math.round((THEME.typography.bodyRegular + fontBoost) * 1.38),
          fontWeight: 'normal' as const,
        };
    }
  };

  const variantStyle = getStyleForVariant();

  const finalWeight =
    weight !== 'normal'
      ? weight === '900' || weight === '800' || weight === '700'
        ? '700'
        : weight === '600' || weight === '500'
        ? '500'
        : 'normal'
      : variantStyle.fontWeight;

  return (
    <Text
      style={[
        styles.base,
        variantStyle,
        {
          color: resolvedColor,
          textAlign: center ? 'center' : 'left',
          fontWeight: finalWeight,
        },
        style,
      ]}
      accessibilityRole="text"
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    includeFontPadding: true,
  },
});
