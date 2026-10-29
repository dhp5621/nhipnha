import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';

interface AccessibleTextProps extends TextProps {
  variant?: 'hero' | 'h1' | 'h2' | 'bodyLarge' | 'bodyRegular' | 'label';
  color?: string;
  weight?: 'normal' | '600' | '700' | '800';
  center?: boolean;
}

export const AccessibleText: React.FC<AccessibleTextProps> = ({
  children,
  variant = 'bodyRegular',
  color = THEME.colors.textDark,
  weight = 'normal',
  center = false,
  style,
  ...props
}) => {
  const getStyleForVariant = () => {
    switch (variant) {
      case 'hero':
        return {
          fontSize: THEME.typography.hero,
          lineHeight: THEME.typography.lineHeightHero,
          fontWeight: '800' as const,
        };
      case 'h1':
        return {
          fontSize: THEME.typography.h1,
          lineHeight: THEME.typography.lineHeightHeading,
          fontWeight: '800' as const,
        };
      case 'h2':
        return {
          fontSize: THEME.typography.h2,
          lineHeight: THEME.typography.lineHeightBody,
          fontWeight: '700' as const,
        };
      case 'bodyLarge':
        return {
          fontSize: THEME.typography.bodyLarge,
          lineHeight: THEME.typography.lineHeightBody,
          fontWeight: '600' as const,
        };
      case 'label':
        return {
          fontSize: THEME.typography.label,
          lineHeight: 22,
          fontWeight: '600' as const,
        };
      case 'bodyRegular':
      default:
        return {
          fontSize: THEME.typography.bodyRegular,
          lineHeight: 26,
          fontWeight: '500' as const,
        };
    }
  };

  return (
    <Text
      style={[
        styles.base,
        getStyleForVariant(),
        {
          color,
          textAlign: center ? 'center' : 'left',
          fontWeight: weight !== 'normal' ? weight : getStyleForVariant().fontWeight,
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
    includeFontPadding: false,
  },
});
