import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  LIGHT_COLORS,
  DARK_COLORS,
  type ThemeMode,
  type ResolvedTheme,
  type M3ColorScheme,
} from '../theme';

export type TextScalePreference = 'role_default' | 'normal' | 'large' | 'extra_large';

interface ThemeContextType {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  colors: M3ColorScheme;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  textScale: TextScalePreference;
  setTextScale: (scale: TextScalePreference) => void;
  getFontBoost: (role?: string) => number;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'nhipnha_theme_mode';
const TEXT_SCALE_STORAGE_KEY = 'nhipnha_text_scale';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to 'system' so web automatically follows device light/dark mode
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [textScale, setTextScaleState] = useState<TextScalePreference>('role_default');
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load any user override from localStorage
    try {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      const savedScale = window.localStorage.getItem(TEXT_SCALE_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
        setThemeModeState(savedTheme);
      }
      if (
        savedScale === 'role_default' ||
        savedScale === 'normal' ||
        savedScale === 'large' ||
        savedScale === 'extra_large'
      ) {
        setTextScaleState(savedScale);
      }
    } catch {}

    // Listen to OS / Browser light & dark theme changes in real-time
    if (window.matchMedia) {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemIsDark(mql.matches);
      const listener = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
      mql.addEventListener('change', listener);
      return () => mql.removeEventListener('change', listener);
    }
  }, []);

  const resolvedTheme: ResolvedTheme =
    themeMode === 'system' ? (systemIsDark ? 'dark' : 'light') : themeMode;

  const isDark = resolvedTheme === 'dark';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  // Sync with HTML root attributes and body styles for seamless transitions
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', resolvedTheme);
      document.documentElement.style.colorScheme = resolvedTheme;
      document.body.style.backgroundColor = colors.background;
      document.body.style.color = colors.textDark;
    }
  }, [resolvedTheme, colors]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, mode);
      } catch {}
    }
  };

  const toggleTheme = () => {
    // If user is currently on system, toggle to the opposite of resolved, or cycle:
    // system -> opposite -> light/dark
    const next: ThemeMode = isDark ? 'light' : 'dark';
    setThemeMode(next);
  };

  const setTextScale = (scale: TextScalePreference) => {
    setTextScaleState(scale);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(TEXT_SCALE_STORAGE_KEY, scale);
      } catch {}
    }
  };

  const getFontBoost = (role?: string): number => {
    if (textScale === 'normal') return 0;
    if (textScale === 'large') return 3;
    if (textScale === 'extra_large') return 6;
    return role === 'GRANDPARENT' ? 4 : 0;
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        resolvedTheme,
        isDark,
        colors,
        setThemeMode,
        toggleTheme,
        textScale,
        setTextScale,
        getFontBoost,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      themeMode: 'system' as ThemeMode,
      resolvedTheme: 'light' as ResolvedTheme,
      isDark: false,
      colors: LIGHT_COLORS,
      setThemeMode: () => {},
      toggleTheme: () => {},
      textScale: 'role_default' as TextScalePreference,
      setTextScale: () => {},
      getFontBoost: (role?: string) => (role === 'GRANDPARENT' ? 4 : 0),
    };
  }
  return context;
};
