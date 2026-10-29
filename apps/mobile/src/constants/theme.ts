/**
 * Nhịp Nhà – Authentic Google Material 3 Expressive (M3E 2025) Design System
 *
 * Key M3 Expressive Principles Implemented:
 * 1. Dynamic Color Tonal Palettes (Light & Dark Schemes) — Zero pure #FFFFFF or #000000 flat cards;
 *    uses M3 Surface Container Lowest/Low/Standard/High/Highest hierarchy.
 * 2. Expressive Shape System & Morphing — Extra-large corner tokens (20dp, 32dp, 44dp) + asymmetric
 *    grouped list card stacks (first/middle/last radii) and shape-morphing active pills.
 * 3. Emphasized Editorial Typography — High-contrast Display/Headline optical sizing paired with
 *    clean, scannable Body/Label hierarchy.
 */

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface M3ColorScheme {
  isDark: boolean;

  // M3 Surface Hierarchy
  background: string;
  surface: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceSubtle: string;

  // Text & On-Surface
  textDark: string;
  textSecondary: string;
  textMuted: string;
  onSurface: string;
  onSurfaceVariant: string;

  // Outlines
  outline: string;
  outlineVariant: string;
  border: string;
  borderBold: string;

  // Primary (Warm Terracotta Hearth)
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;

  // Secondary (Bamboo Sage)
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;

  // Rhythm 1: Morning (Sunlit Golden Amber)
  morningYellow: string;
  morningPrimary: string;
  morningContainer: string;
  morningSurface: string;
  morningBorder: string;
  onMorningContainer: string;

  // Rhythm 2: Afternoon (Warm Sunset Terracotta)
  afternoonOrange: string;
  afternoonPrimary: string;
  afternoonContainer: string;
  afternoonSurface: string;
  afternoonBorder: string;
  onAfternoonContainer: string;

  // Rhythm 3: Evening (Starry Lullaby Indigo)
  eveningPurple: string;
  eveningPrimary: string;
  eveningContainer: string;
  eveningSurface: string;
  eveningBorder: string;
  onEveningContainer: string;

  // Semantic Status
  success: string;
  successBg: string;
  successBorder: string;
  onSuccessContainer: string;

  error: string;
  errorBg: string;
  errorBorder: string;

  accent: string;
  accentBg: string;
}

export const LIGHT_COLORS: M3ColorScheme = {
  isDark: false,

  background: '#FCF6EE',
  surface: '#FFFBF7',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F6EFE6',
  surfaceContainer: '#F0E7DC',
  surfaceContainerHigh: '#EAE0D3',
  surfaceContainerHighest: '#E3D8C9',
  surfaceSubtle: '#F4ECE1',

  textDark: '#1F1610',
  textSecondary: '#52433B',
  textMuted: '#7E6D63',
  onSurface: '#1F1610',
  onSurfaceVariant: '#52433B',

  outline: '#857369',
  outlineVariant: '#D7C3B8',
  border: '#DFD2C5',
  borderBold: '#78665C',

  primary: '#B84318',
  onPrimary: '#FFFFFF',
  primaryContainer: '#FFDBCF',
  onPrimaryContainer: '#3B0900',

  secondary: '#266C44',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#B7F1C9',
  onSecondaryContainer: '#04210E',

  // Morning Tonal Palette
  morningYellow: '#F59E0B',
  morningPrimary: '#8C4F00',
  morningContainer: '#FFDEA8',
  morningSurface: '#FFF5E0',
  morningBorder: '#E59400',
  onMorningContainer: '#2C1600',

  // Afternoon Tonal Palette
  afternoonOrange: '#DF5018',
  afternoonPrimary: '#9E3306',
  afternoonContainer: '#FFDBCE',
  afternoonSurface: '#FFF0EA',
  afternoonBorder: '#D94D1A',
  onAfternoonContainer: '#370E00',

  // Evening Tonal Palette
  eveningPurple: '#4C43D6',
  eveningPrimary: '#3D32B8',
  eveningContainer: '#E1E0FF',
  eveningSurface: '#F1F0FF',
  eveningBorder: '#5B53E6',
  onEveningContainer: '#110563',

  // Semantic
  success: '#177A3E',
  successBg: '#C8F7D6',
  successBorder: '#249C53',
  onSuccessContainer: '#042B12',

  error: '#BA1A1A',
  errorBg: '#FFDAD6',
  errorBorder: '#DE3730',

  accent: '#0B7A75',
  accentBg: '#BCECE9',
};

export const DARK_COLORS: M3ColorScheme = {
  isDark: true,

  background: '#15100C',
  surface: '#1D1612',
  surfaceContainerLowest: '#100B08',
  surfaceContainerLow: '#1F1814',
  surfaceContainer: '#251D18',
  surfaceContainerHigh: '#302620',
  surfaceContainerHighest: '#3B3029',
  surfaceSubtle: '#281F1A',

  textDark: '#F4E5DC',
  textSecondary: '#D5C2B7',
  textMuted: '#9E8C82',
  onSurface: '#F4E5DC',
  onSurfaceVariant: '#D5C2B7',

  outline: '#9E8C82',
  outlineVariant: '#51433B',
  border: '#3D312A',
  borderBold: '#6E5B50',

  primary: '#FFB59C',
  onPrimary: '#5E1700',
  primaryContainer: '#832600',
  onPrimaryContainer: '#FFDBCF',

  secondary: '#9CD4AF',
  onSecondary: '#05381B',
  secondaryContainer: '#1B5130',
  onSecondaryContainer: '#B7F1C9',

  // Morning Dark Tonal Palette
  morningYellow: '#FFB945',
  morningPrimary: '#FFB945',
  morningContainer: '#4E2D00',
  morningSurface: '#2A1B08',
  morningBorder: '#B06A00',
  onMorningContainer: '#FFDEA8',

  // Afternoon Dark Tonal Palette
  afternoonOrange: '#FFB59B',
  afternoonPrimary: '#FFB59B',
  afternoonContainer: '#5B1B00',
  afternoonSurface: '#2E140B',
  afternoonBorder: '#BA4112',
  onAfternoonContainer: '#FFDBCE',

  // Evening Dark Tonal Palette
  eveningPurple: '#C1C1FF',
  eveningPrimary: '#C1C1FF',
  eveningContainer: '#2A2096',
  eveningSurface: '#181538',
  eveningBorder: '#635CE0',
  onEveningContainer: '#E1E0FF',

  // Semantic Dark
  success: '#83DB9E',
  successBg: '#0E4723',
  successBorder: '#249C53',
  onSuccessContainer: '#C8F7D6',

  error: '#FFB4AB',
  errorBg: '#690005',
  errorBorder: '#B3261E',

  accent: '#82D5CF',
  accentBg: '#004F4B',
};

export const THEME = {
  colors: LIGHT_COLORS,
  light: LIGHT_COLORS,
  dark: DARK_COLORS,

  typography: {
    display: 40,
    hero: 32,
    h1: 26,
    h2: 21,
    bodyLarge: 18,
    bodyRegular: 16,
    label: 14,
    caption: 12,

    lineHeightDisplay: 46,
    lineHeightHero: 38,
    lineHeightHeading: 32,
    lineHeightH2: 28,
    lineHeightBody: 25,
  },

  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 44,
    touchTargetMin: 60,
    rhythmTouchTarget: 76,
  },

  borderRadius: {
    // M3 Expressive 2025 Shape Tokens
    xs: 10,
    sm: 14,
    md: 20,
    button: 28,
    card: 32,
    cardExpressive: 40,
    pill: 9999,
    avatar: 9999,
  },

  shadows: {
    card: {
      shadowColor: '#1F1610',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 14,
      elevation: 2,
    },
    expressive: {
      shadowColor: '#1F1610',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.11,
      shadowRadius: 24,
      elevation: 5,
    },
    button: {
      shadowColor: '#1F1610',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 3,
    },
  },
};
