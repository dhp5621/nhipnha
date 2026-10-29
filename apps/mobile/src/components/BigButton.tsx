import React, { useRef } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  Animated,
} from 'react-native';
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
  showArrow?: boolean;
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
  showArrow = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 35,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 25,
      bounciness: 8,
    }).start();
  };

  const getColors = () => {
    switch (variant) {
      case 'morning':
        return {
          bg: '#F59E0B',        // Rich Sunlit Amber
          border: '#D97706',
          iconBg: '#FEF3C7',
          text: '#3B1800',      // High contrast espresso brown on amber
          subtext: '#5C2804',
          arrowBg: 'rgba(59, 24, 0, 0.1)',
          arrowText: '#3B1800',
        };
      case 'afternoon':
        return {
          bg: '#EA580C',        // Warm Terracotta Orange
          border: '#C2410C',
          iconBg: '#FFEDD5',
          text: '#FFFFFF',
          subtext: '#FFEDD5',
          arrowBg: 'rgba(255, 255, 255, 0.2)',
          arrowText: '#FFFFFF',
        };
      case 'evening':
        return {
          bg: '#4338CA',        // Deep Starry Indigo
          border: '#312E81',
          iconBg: '#E0E7FF',
          text: '#FFFFFF',
          subtext: '#E0E7FF',
          arrowBg: 'rgba(255, 255, 255, 0.2)',
          arrowText: '#FFFFFF',
        };
      case 'success':
        return {
          bg: '#15803D',        // Bamboo Leaf Emerald
          border: '#166534',
          iconBg: '#DCFCE7',
          text: '#FFFFFF',
          subtext: '#DCFCE7',
          arrowBg: 'rgba(255, 255, 255, 0.2)',
          arrowText: '#FFFFFF',
        };
      case 'secondary':
        return {
          bg: '#FFFFFF',        // Clean M3 Outlined Tonal Surface
          border: '#D8C2B9',
          iconBg: '#F6EFE6',
          text: THEME.colors.textDark,
          subtext: THEME.colors.textSecondary,
          arrowBg: '#F2EAE0',
          arrowText: THEME.colors.textDark,
        };
      case 'primary':
      default:
        return {
          bg: THEME.colors.primary,
          border: '#8E3211',
          iconBg: '#FFDBCF',
          text: '#FFFFFF',
          subtext: '#FFDBCF',
          arrowBg: 'rgba(255, 255, 255, 0.2)',
          arrowText: '#FFFFFF',
        };
    }
  };

  const colors = getColors();
  const isHero = size === 'hero';
  const shouldShowArrow = showArrow || (isHero && variant !== 'secondary');

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.button,
          isHero ? THEME.shadows.expressive : THEME.shadows.button,
          {
            backgroundColor: disabled ? '#E6DFD7' : colors.bg,
            borderColor: disabled ? '#CFC5BA' : colors.border,
            minHeight: isHero ? THEME.spacing.rhythmTouchTarget : THEME.spacing.touchTargetMin,
            paddingVertical: isHero ? 16 : 12,
            borderRadius: isHero ? THEME.borderRadius.card : THEME.borderRadius.button,
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
            {icon ? (
              <View
                style={[
                  styles.iconBadge,
                  isHero && styles.heroIconBadge,
                  { backgroundColor: disabled ? '#D8D0C7' : colors.iconBg },
                ]}
              >
                <Text style={[styles.icon, isHero && styles.heroIcon]}>{icon}</Text>
              </View>
            ) : null}

            <View style={[styles.textContainer, !icon && !shouldShowArrow && { alignItems: 'center' }]}>
              <Text
                style={[
                  styles.title,
                  !icon && !shouldShowArrow && { textAlign: 'center' },
                  {
                    color: disabled ? '#8C827A' : colors.text,
                    fontSize: isHero ? THEME.typography.h2 + 1 : THEME.typography.bodyLarge,
                    lineHeight: isHero ? 29 : 25,
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
                    !icon && !shouldShowArrow && { textAlign: 'center' },
                    {
                      color: disabled ? '#8C827A' : colors.subtext,
                      fontSize: THEME.typography.label,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>

            {shouldShowArrow ? (
              <View style={[styles.arrowPill, { backgroundColor: colors.arrowBg }]}>
                <Text style={[styles.arrowIcon, { color: colors.arrowText }]}>→</Text>
              </View>
            ) : null}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginVertical: 7,
  },
  button: {
    width: '100%',
    borderWidth: 2,
    borderBottomWidth: 5, // M3 Expressive tactile 3D cushion bottom lip
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  heroIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 20,
    marginRight: 14,
  },
  icon: {
    fontSize: 24,
  },
  heroIcon: {
    fontSize: 30,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '800',
    textAlign: 'left',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'left',
    lineHeight: 20,
  },
  arrowPill: {
    width: 38,
    height: 38,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  arrowIcon: {
    fontSize: 20,
    fontWeight: '900',
  },
});
