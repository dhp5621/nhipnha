/**
 * Nhịp Nhà Accessibility & Design System Theme
 * Specifically tuned for rural children (6-12) & elderly grandparents (65-70) on budget/older Android phones.
 * Minimum touch target: >= 56px (WCAG AAA compliant: 64px - 72px for core rhythm buttons)
 * Typography: Extra large, high contrast ratio >= 7:1 against backgrounds.
 */

export const THEME = {
  colors: {
    // Warm, welcoming, recognizable countryside tones
    background: '#FAF7EE', // Warm rice paper cream
    surface: '#FFFFFF',
    surfaceSubtle: '#F4EFE6',
    border: '#CBD5E1',
    borderBold: '#64748B',

    textDark: '#0F172A',      // Near black for maximum contrast
    textSecondary: '#334155', // Accessible dark slate
    textMuted: '#64748B',

    // Rhythms
    morningYellow: '#EAB308',
    morningBg: '#FEF9C3',
    morningBorder: '#CA8A04',

    afternoonOrange: '#EA580C',
    afternoonBg: '#FFEDD5',
    afternoonBorder: '#C2410C',

    eveningPurple: '#4F46E5',
    eveningBg: '#EEF2FF',
    eveningBorder: '#3730A3',

    // Status
    success: '#16A34A',
    successBg: '#DCFCE7',
    error: '#DC2626',
    errorBg: '#FEE2E2',
    accent: '#0D9488',
  },

  typography: {
    hero: 34,
    h1: 28,
    h2: 24,
    bodyLarge: 20,
    bodyRegular: 18,
    label: 16,
    lineHeightHero: 42,
    lineHeightHeading: 34,
    lineHeightBody: 28,
  },

  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
    touchTargetMin: 56, // Accessible standard
    rhythmTouchTarget: 68, // Extra large for children & elders
  },

  borderRadius: {
    button: 18,
    card: 22,
    avatar: 9999,
  },
};
