import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { THEME } from '../constants/theme';

interface BigButtonProps {
  title: string;
  subtitle?: string;
  icon?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'morning' | 'afternoon' | 'evening' | 'success';
  size?: 'normal' | 'hero';
  disabled?: boolean;
  loading?: boolean;
}

export const BigButton: React.FC<BigButtonProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  variant = 'primary',
  size = 'normal',
  disabled = false,
  loading = false,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'morning':
        return {
          bg: THEME.colors.morningYellow,
          border: THEME.colors.morningBorder,
          text: '#78350F',
          subtext: '#92400E',
        };
      case 'afternoon':
        return {
          bg: THEME.colors.afternoonOrange,
          border: THEME.colors.afternoonBorder,
          text: '#FFFFFF',
          subtext: '#FED7AA',
        };
      case 'evening':
        return {
          bg: THEME.colors.eveningPurple,
          border: THEME.colors.eveningBorder,
          text: '#FFFFFF',
          subtext: '#C7D2FE',
        };
      case 'success':
        return {
          bg: THEME.colors.success,
          border: '#15803D',
          text: '#FFFFFF',
          subtext: '#DCFCE7',
        };
      case 'secondary':
        return {
          bg: THEME.colors.surface,
          border: THEME.colors.borderBold,
          text: THEME.colors.textDark,
          subtext: THEME.colors.textSecondary,
        };
      case 'primary':
      default:
        return {
          bg: '#D97706', // Warm amber-600
          border: '#B45309',
          text: '#FFFFFF',
          subtext: '#FEF3C7',
        };
    }
  };

  const colors = getColors();
  const isHero = size === 'hero';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? '#E2E8F0' : colors.bg,
          borderColor: disabled ? '#CBD5E1' : colors.border,
          minHeight: isHero ? THEME.spacing.rhythmTouchTarget : THEME.spacing.touchTargetMin,
          paddingVertical: isHero ? 18 : 14,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} size="large" />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <Text style={[styles.icon, isHero && styles.heroIcon]}>{icon}</Text> : null}
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.title,
                {
                  color: disabled ? '#94A3B8' : colors.text,
                  fontSize: isHero ? THEME.typography.h1 : THEME.typography.h2,
                  lineHeight: isHero ? THEME.typography.lineHeightHeading : THEME.typography.lineHeightBody,
                },
              ]}
              numberOfLines={2}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                style={[
                  styles.subtitle,
                  {
                    color: disabled ? '#94A3B8' : colors.subtext,
                    fontSize: THEME.typography.bodyRegular,
                  },
                ]}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    borderRadius: THEME.borderRadius.button,
    borderWidth: 3,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4, // Android elevation for old devices
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  icon: {
    fontSize: 34,
    marginRight: 14,
  },
  heroIcon: {
    fontSize: 44,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '800',
    textAlign: 'left',
  },
  subtitle: {
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'left',
  },
});
