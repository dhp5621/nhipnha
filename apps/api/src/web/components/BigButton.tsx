import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { MIcon } from './MIcon';

export type BigButtonVariant =
  | 'primary'
  | 'secondary'
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'outline'
  | 'tonal'
  | 'danger';

interface BigButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BigButtonVariant;
  iconName?: string;
  loading?: boolean;
  minHeight?: number;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const BigButton: React.FC<BigButtonProps> = ({
  variant = 'primary',
  iconName,
  loading = false,
  minHeight = 56,
  fullWidth = true,
  disabled,
  children,
  style,
  className = '',
  ...props
}) => {
  const { colors } = useTheme();

  const getVariantStyles = (): {
    bg: string;
    text: string;
    border: string;
    shadow: string;
  } => {
    switch (variant) {
      case 'primary':
        return {
          bg: colors.primary,
          text: colors.onPrimary,
          border: 'none',
          shadow: '0 4px 14px rgba(184, 67, 24, 0.28)',
        };
      case 'secondary':
        return {
          bg: colors.secondary,
          text: colors.onSecondary,
          border: 'none',
          shadow: '0 4px 14px rgba(38, 108, 68, 0.28)',
        };
      case 'morning':
        return {
          bg: colors.morningPrimary,
          text: '#FFFFFF',
          border: 'none',
          shadow: '0 4px 16px rgba(140, 79, 0, 0.24)',
        };
      case 'afternoon':
        return {
          bg: colors.afternoonPrimary,
          text: '#FFFFFF',
          border: 'none',
          shadow: '0 4px 16px rgba(158, 51, 6, 0.28)',
        };
      case 'evening':
        return {
          bg: colors.eveningPrimary,
          text: '#FFFFFF',
          border: 'none',
          shadow: '0 4px 16px rgba(61, 50, 184, 0.28)',
        };
      case 'tonal':
        return {
          bg: colors.surfaceContainerHigh,
          text: colors.textDark,
          border: `1px solid ${colors.outlineVariant}`,
          shadow: 'none',
        };
      case 'danger':
        return {
          bg: colors.error,
          text: '#FFFFFF',
          border: 'none',
          shadow: '0 4px 14px rgba(186, 26, 26, 0.28)',
        };
      case 'outline':
      default:
        return {
          bg: 'transparent',
          text: colors.textDark,
          border: `2px solid ${colors.outline}`,
          shadow: 'none',
        };
    }
  };

  const { bg, text, border, shadow } = getVariantStyles();

  return (
    <button
      disabled={disabled || loading}
      className={`big-button ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        width: fullWidth ? '100%' : 'auto',
        minHeight,
        padding: '14px 22px',
        borderRadius: 24,
        backgroundColor: disabled ? colors.surfaceContainerLow : bg,
        color: disabled ? colors.textMuted : text,
        border,
        boxShadow: disabled ? 'none' : shadow,
        fontSize: 16,
        fontWeight: 800,
        letterSpacing: 0.2,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.65 : 1,
        transition: 'all 0.18s cubic-bezier(0.2, 0, 0, 1)',
        userSelect: 'none',
        outline: 'none',
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <MIcon name="refresh" size={22} className="spin-icon" color={disabled ? colors.textMuted : text} />
      ) : iconName ? (
        <MIcon name={iconName} size={22} color={disabled ? colors.textMuted : text} />
      ) : null}
      <span>{children}</span>
    </button>
  );
};
