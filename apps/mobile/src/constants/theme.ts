/**
 * Nhịp Nhà – Material 3 Expressive (M3E) Accessibility & Design System Theme
 *
 * Specifically crafted across 3 generations:
 * 1. Rural Children (6–12 y/o): Playful, expressive squircle shapes, tactile springy buttons, joyful badges.
 * 2. Migrant Worker Parents (25–45 y/o): Calm, modern M3 tonal hierarchy, clear daily progress rings & AI empathy cards.
 * 3. Elderly Grandparents (65–70 y/o): WCAG AAA high contrast (>= 7:1), extra-large typography, zero-confusion navigation, >=64-76px touch targets.
 *
 * Color Seed: Warm Vietnamese Countryside Terracotta, Sunlit Rice Field Gold, Bamboo Leaf Green & Starry Indigo Night.
 */

export const THEME = {
  colors: {
    // M3 Surface & Background Tonal Hierarchy (Warm Rice Paper / Lotte Cream)
    background: '#FDF8F2',          // M3 Surface Warm Ivory
    surface: '#FFFFFF',             // M3 Surface Bright
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F8F2EA', // M3 Surface Container Low
    surfaceContainer: '#F2EAE0',    // M3 Surface Container
    surfaceContainerHigh: '#ECE2D5',// M3 Surface Container High
    surfaceSubtle: '#F6EFE6',

    // Outlines & Dividers
    outline: '#85736B',
    outlineVariant: '#D8C2B9',
    border: '#DFD5C8',
    borderBold: '#78685E',

    // Typography Colors (WCAG AAA High Contrast)
    textDark: '#1E1510',            // M3 On-Surface (Deep Warm Espresso)
    textSecondary: '#4E4039',       // M3 On-Surface-Variant
    textMuted: '#79675E',

    // M3 Primary: Warm Terracotta / Hearth (Tình cảm gia đình)
    primary: '#B9461E',
    onPrimary: '#FFFFFF',
    primaryContainer: '#FFDBCF',
    onPrimaryContainer: '#3B0900',

    // M3 Secondary: Bamboo Leaf / Rice Paddy Green (Bình yên & Thấu cảm SDG 3/4)
    secondary: '#266C44',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#ACCTC0',
    secondarySurface: '#E7F6EC',
    onSecondaryContainer: '#082E18',

    // M3 Rhythm 1: Chạm Sáng (Sunlit Golden Amber)
    morningYellow: '#F59E0B',
    morningPrimary: '#B45309',
    morningContainer: '#FEF3C7',
    morningSurface: '#FFFBEB',
    morningBorder: '#D97706',
    onMorningContainer: '#451A03',

    // M3 Rhythm 2: Chạm Chiều (Warm Sunset Terracotta)
    afternoonOrange: '#EA580C',
    afternoonPrimary: '#C2410C',
    afternoonContainer: '#FFEDD5',
    afternoonSurface: '#FFF7ED',
    afternoonBorder: '#EA580C',
    onAfternoonContainer: '#431407',

    // M3 Rhythm 3: Chạm Tối (Starry Lullaby Indigo)
    eveningPurple: '#4F46E5',
    eveningPrimary: '#4338CA',
    eveningContainer: '#E0E7FF',
    eveningSurface: '#EEF2FF',
    eveningBorder: '#4F46E5',
    onEveningContainer: '#1E1B4B',

    // Semantic Status
    success: '#15803D',
    successBg: '#DCFCE7',
    successBorder: '#22C55E',
    onSuccessContainer: '#052E16',

    error: '#DC2626',
    errorBg: '#FEE2E2',
    errorBorder: '#EF4444',

    accent: '#0D9488',
    accentBg: '#CCFBF1',
  },

  typography: {
    // M3 Expressive Scale - Tuned for multi-age readability
    display: 38,
    hero: 32,
    h1: 26,
    h2: 22,
    bodyLarge: 19,
    bodyRegular: 17,
    label: 15,
    caption: 13,

    lineHeightDisplay: 46,
    lineHeightHero: 40,
    lineHeightHeading: 34,
    lineHeightH2: 30,
    lineHeightBody: 27,
  },

  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 44,
    touchTargetMin: 60,     // Exceeds 56px WCAG AAA requirement
    rhythmTouchTarget: 74,  // M3 Expressive Hero Pill height for children & grandparents
  },

  borderRadius: {
    // Material 3 Expressive Shapes (Extra Large Squircles & Full Pills)
    xs: 10,
    sm: 14,
    button: 24,
    card: 28,
    cardExpressive: 32,
    pill: 9999,
    avatar: 9999,
  },

  shadows: {
    card: {
      shadowColor: '#3E2723',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.07,
      shadowRadius: 14,
      elevation: 3,
    },
    expressive: {
      shadowColor: '#3E2723',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 6,
    },
    button: {
      shadowColor: '#1E1510',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.14,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};
