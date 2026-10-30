import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { MIcon } from './MIcon';
import { GoogleLoadingIndicator } from './GoogleLoadingIndicator';

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
  const { colors, isDark } = useTheme();

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
          text: isDark ? '#3A0E00' : colors.onPrimary,
          border: isDark ? '1px solid rgba(255, 181, 156, 0.4)' : 'none',
          shadow: isDark ? '0 4px 16px rgba(0, 0, 0, 0.45)' : '0 4px 14px rgba(184, 67, 24, 0.28)',
        };
      case 'secondary':
        return {
          bg: colors.secondary,
          text: isDark ? '#032B14' : colors.onSecondary,
          border: isDark ? '1px solid rgba(156, 212, 175, 0.4)' : 'none',
          shadow: isDark ? '0 4px 16px rgba(0, 0, 0, 0.45)' : '0 4px 14px rgba(38, 108, 68, 0.28)',
        };
      case 'morning':
        return {
          bg: isDark ? '#E59400' : '#F59E0B',
          text: '#241000',
          border: isDark ? '1px solid rgba(255, 213, 128, 0.5)' : 'none',
          shadow: isDark ? '0 4px 16px rgba(0, 0, 0, 0.45)' : '0 4px 16px rgba(140, 79, 0, 0.24)',
        };
      case 'afternoon':
        return {
          bg: isDark ? '#DF5018' : colors.afternoonPrimary,
          text: '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 181, 155, 0.4)' : 'none',
          shadow: isDark ? '0 4px 16px rgba(0, 0, 0, 0.45)' : '0 4px 16px rgba(158, 51, 6, 0.28)',
        };
      case 'evening':
        return {
          bg: isDark ? '#544BE0' : colors.eveningPrimary,
          text: '#FFFFFF',
          border: isDark ? '1px solid rgba(193, 193, 255, 0.4)' : 'none',
          shadow: isDark ? '0 4px 16px rgba(0, 0, 0, 0.45)' : '0 4px 16px rgba(61, 50, 184, 0.28)',
        };
      case 'tonal':
        return {
          bg: isDark ? colors.surfaceContainerHighest : colors.surfaceContainerHigh,
          text: colors.textDark,
          border: `1px solid ${colors.outlineVariant}`,
          shadow: 'none',
        };
      case 'danger':
        return {
          bg: isDark ? '#DC2626' : colors.error,
          text: '#FFFFFF',
          border: isDark ? '1px solid rgba(239, 68, 68, 0.5)' : 'none',
          shadow: isDark ? '0 4px 16px rgba(0, 0, 0, 0.45)' : '0 4px 14px rgba(186, 26, 26, 0.28)',
        };
      case 'outline':
      default:
        return {
          bg: 'transparent',
          text: colors.textDark,
          border: `2px solid ${isDark ? colors.outline : colors.borderBold}`,
          shadow: 'none',
        };
    }
  };

  const { bg, text, border, shadow } = getVariantStyles();
  const effectiveText = disabled ? (isDark ? '#7E6D63' : colors.textMuted) : text;
  const effectiveBg = disabled ? (isDark ? '#221A15' : colors.surfaceContainerLow) : bg;
  const effectiveBorder = disabled ? (isDark ? '1px solid #33261F' : 'none') : border;

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
        backgroundColor: effectiveBg,
        color: effectiveText,
        border: effectiveBorder,
        boxShadow: disabled ? 'none' : shadow,
        fontFamily: "'Google Sans', 'Google Sans Text', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: 16,
        fontWeight: 700,
        fontSynthesis: 'none',
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
        <GoogleLoadingIndicator
          size={20}
          strokeWidth={3.5}
          multiColor={false}
          color={effectiveText}
        />
      ) : iconName ? (
        <MIcon name={iconName} size={22} color={effectiveText} />
      ) : null}
      <span style={{ fontFamily: 'inherit', fontWeight: 'inherit', fontSynthesis: 'none', color: effectiveText }}>{children}</span>
    </button>
  );
};
