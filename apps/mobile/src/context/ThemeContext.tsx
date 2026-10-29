import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LIGHT_COLORS,
  DARK_COLORS,
  type ThemeMode,
  type ResolvedTheme,
  type M3ColorScheme,
} from '../constants/theme';

export type TextScalePreference = 'role_default' | 'normal' | 'large' | 'extra_large';

interface ThemeContextType {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  colors: M3ColorScheme;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  textScale: TextScalePreference;
  setTextScale: (scale: TextScalePreference) => Promise<void>;
  getFontBoost: (role?: string) => number;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'nhipnha_theme_mode';
const TEXT_SCALE_STORAGE_KEY = 'nhipnha_text_scale';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [textScale, setTextScaleState] = useState<TextScalePreference>('role_default');

  useEffect(() => {
    async function loadSavedSettings() {
      try {
        const [savedTheme, savedScale] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(TEXT_SCALE_STORAGE_KEY),
        ]);
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
      } catch {
        // Default values
      }
    }
    loadSavedSettings();
  }, []);

  const resolvedTheme: ResolvedTheme =
    themeMode === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : themeMode;

  const isDark = resolvedTheme === 'dark';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Ignore storage error
    }
  };

  const toggleTheme = async () => {
    const next: ThemeMode = isDark ? 'light' : 'dark';
    await setThemeMode(next);
  };

  const setTextScale = async (scale: TextScalePreference) => {
    setTextScaleState(scale);
    try {
      await AsyncStorage.setItem(TEXT_SCALE_STORAGE_KEY, scale);
    } catch {
      // Ignore storage error
    }
  };

  // Default big only for grandparent (+4pt), normal (0pt) for Child & Parent, or user override in settings
  const getFontBoost = (role?: string): number => {
    if (textScale === 'normal') return 0;
    if (textScale === 'large') return 3;
    if (textScale === 'extra_large') return 6;
    // role_default
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
      themeMode: 'light' as ThemeMode,
      resolvedTheme: 'light' as ResolvedTheme,
      isDark: false,
      colors: LIGHT_COLORS,
      setThemeMode: async () => {},
      toggleTheme: async () => {},
      textScale: 'role_default' as TextScalePreference,
      setTextScale: async () => {},
      getFontBoost: (role?: string) => (role === 'GRANDPARENT' ? 4 : 0),
    };
  }
  return context;
};
