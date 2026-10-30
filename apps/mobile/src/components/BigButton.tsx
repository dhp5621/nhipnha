import React, { useRef, useState } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface BigButtonProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof MaterialIcons.glyphMap | string;
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
  const { colors, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 45,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 10,
    }).start();
  };

  const getColors = () => {
    switch (variant) {
      case 'morning':
        return {
          bg: isDark ? '#E59400' : '#F59E0B',
          iconBg: isDark ? '#3B2200' : '#FFF3C4',
          iconColor: isDark ? '#FFD580' : '#8A4F00',
          text: '#241000',
          subtext: '#4A2500',
          arrowBg: 'rgba(36, 16, 0, 0.12)',
          arrowText: '#241000',
          borderColor: 'transparent',
        };
      case 'afternoon':
        return {
          bg: isDark ? '#C8430E' : '#DF5018',
          iconBg: isDark ? '#421200' : 'rgba(255,255,255,0.22)',
          iconColor: '#FFFFFF',
          text: '#FFFFFF',
          subtext: '#FFDBCE',
          arrowBg: 'rgba(255, 255, 255, 0.2)',
          arrowText: '#FFFFFF',
          borderColor: 'transparent',
        };
      case 'evening':
        return {
          bg: isDark ? '#544BE0' : '#4C43D6',
          iconBg: isDark ? '#1E166B' : 'rgba(255,255,255,0.2)',
          iconColor: '#FFFFFF',
          text: '#FFFFFF',
          subtext: '#E1E0FF',
          arrowBg: 'rgba(255, 255, 255, 0.2)',
          arrowText: '#FFFFFF',
          borderColor: 'transparent',
        };
      case 'success':
        return {
          bg: isDark ? '#1B6E38' : '#177A3E',
          iconBg: 'rgba(255,255,255,0.2)',
          iconColor: '#FFFFFF',
          text: '#FFFFFF',
          subtext: '#C8F7D6',
          arrowBg: 'rgba(255, 255, 255, 0.2)',
          arrowText: '#FFFFFF',
          borderColor: 'transparent',
        };
      case 'secondary':
        return {
          bg: colors.surfaceContainerHigh,
          iconBg: colors.surfaceContainerHighest,
          iconColor: colors.primary,
          text: colors.textDark,
          subtext: colors.textSecondary,
          arrowBg: colors.surfaceContainerHighest,
          arrowText: colors.textDark,
          borderColor: colors.outlineVariant,
        };
      case 'primary':
      default:
        return {
          bg: isDark ? '#DF5018' : colors.primary,
          iconBg: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
          iconColor: '#FFFFFF',
          text: '#FFFFFF',
          subtext: '#FFFFFF',
          arrowBg: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
          arrowText: '#FFFFFF',
          borderColor: isDark ? 'rgba(255, 181, 156, 0.35)' : 'transparent',
        };
    }
  };

  const c = getColors();
  const isHero = size === 'hero';
  const shouldShowArrow = showArrow || (isHero && variant !== 'secondary');

  // M3 Expressive Shape Morphing: Soft squircle at rest -> morphs to tighter squircle on press
  const restRadius = isHero ? 32 : 999;
  const pressedRadius = isHero ? 20 : 18;

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
            backgroundColor: disabled ? colors.surfaceContainer : c.bg,
            borderColor: c.borderColor,
            borderWidth: variant === 'secondary' ? 1 : 0,
            minHeight: isHero ? THEME.spacing.rhythmTouchTarget : THEME.spacing.touchTargetMin,
            paddingVertical: isHero ? 16 : 12,
            borderRadius: pressed ? pressedRadius : restRadius,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={subtitle}
      >
        {loading ? (
          <ActivityIndicator color={c.text} size="large" />
        ) : (
          <View style={styles.contentRow}>
            {icon ? (
              <View
                style={[
                  styles.iconBadge,
                  isHero && styles.heroIconBadge,
                  { backgroundColor: c.iconBg },
                ]}
              >
                <MaterialIcons
                  name={icon as any}
                  size={isHero ? 26 : 22}
                  color={disabled ? colors.textMuted : c.iconColor}
                />
              </View>
            ) : null}

            <View style={[styles.textContainer, !icon && !shouldShowArrow && { alignItems: 'center' }]}>
              <Text
                style={[
                  styles.title,
                  !icon && !shouldShowArrow && { textAlign: 'center' },
                  {
                    color: disabled ? colors.textMuted : c.text,
                    fontSize: isHero ? THEME.typography.h2 : THEME.typography.bodyLarge,
                    lineHeight: isHero ? 27 : 24,
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
                      color: disabled ? colors.textMuted : c.subtext,
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
              <View style={[styles.arrowPill, { backgroundColor: c.arrowBg }]}>
                <MaterialIcons name="arrow-forward" size={20} color={c.arrowText} />
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
    marginVertical: 6,
  },
  button: {
    width: '100%',
    paddingHorizontal: 18,
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
    width: 44,
    height: 44,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  heroIconBadge: {
    width: 54,
    height: 54,
    borderRadius: 20,
    marginRight: 14,
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
    lineHeight: 19,
    opacity: 0.92,
  },
  arrowPill: {
    width: 38,
    height: 38,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});
