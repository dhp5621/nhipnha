import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export type TextVariant =
  | 'display'
  | 'hero'
  | 'h1'
  | 'h2'
  | 'bodyLarge'
  | 'bodyRegular'
  | 'label'
  | 'caption';

interface AccessibleTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TextVariant;
  color?: string;
  weight?: '400' | '500' | '600' | '700' | '800' | '900' | string | number;
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

export const AccessibleText: React.FC<AccessibleTextProps> = ({
  variant = 'bodyRegular',
  color,
  weight,
  align = 'left',
  children,
  style,
  className = '',
  ...props
}) => {
  const { colors, getFontBoost } = useTheme();
  const { member } = useAuth();

  const boost = getFontBoost(member?.role);

  const getVariantStyles = (): { fontSize: number; lineHeight: number; defaultWeight: string } => {
    switch (variant) {
      case 'display':
        return { fontSize: 38 + boost, lineHeight: 46 + boost, defaultWeight: '900' };
      case 'hero':
        return { fontSize: 28 + boost, lineHeight: 36 + boost, defaultWeight: '900' };
      case 'h1':
        return { fontSize: 24 + boost, lineHeight: 30 + boost, defaultWeight: '800' };
      case 'h2':
        return { fontSize: 19 + boost, lineHeight: 26 + boost, defaultWeight: '800' };
      case 'bodyLarge':
        return { fontSize: 17 + boost, lineHeight: 25 + boost, defaultWeight: '600' };
      case 'label':
        return { fontSize: 14 + boost, lineHeight: 20 + boost, defaultWeight: '700' };
      case 'caption':
        return { fontSize: 12 + boost, lineHeight: 17 + boost, defaultWeight: '600' };
      case 'bodyRegular':
      default:
        return { fontSize: 15 + boost, lineHeight: 23 + boost, defaultWeight: '500' };
    }
  };

  const { fontSize, lineHeight, defaultWeight } = getVariantStyles();

  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        fontSize,
        lineHeight: `${lineHeight}px`,
        fontWeight: weight || defaultWeight,
        color: color || colors.textDark,
        textAlign: align,
        letterSpacing: variant === 'display' || variant === 'hero' ? '-0.02em' : 'normal',
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
};
