import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRANSLATIONS, type SupportedLanguage, type LanguagePreference, type TranslationKey } from '../i18n/translations';

interface LanguageContextType {
  preference: LanguagePreference;
  activeLanguage: SupportedLanguage;
  setLanguagePreference: (pref: LanguagePreference) => Promise<void>;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'nhipnha_language_preference';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreference] = useState<LanguagePreference>('system');
  const [activeLanguage, setActiveLanguage] = useState<SupportedLanguage>('en');

  // Detect system language
  const detectSystemLanguage = (): SupportedLanguage => {
    try {
      const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
      if (systemLocale.startsWith('vi')) {
        return 'vi';
      }
    } catch {
      // Fallback
    }
    // Default to English if system does not match Vietnamese
    return 'en';
  };

  const resolveLanguage = (pref: LanguagePreference): SupportedLanguage => {
    if (pref === 'vi') return 'vi';
    if (pref === 'en') return 'en';
    return detectSystemLanguage();
  };

  useEffect(() => {
    async function loadPreference() {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved === 'vi' || saved === 'en' || saved === 'system') {
          setPreference(saved);
          setActiveLanguage(resolveLanguage(saved));
        } else {
          setPreference('system');
          setActiveLanguage(detectSystemLanguage());
        }
      } catch {
        setPreference('system');
        setActiveLanguage(detectSystemLanguage());
      }
    }
    loadPreference();
  }, []);

  const setLanguagePreference = async (pref: LanguagePreference) => {
    setPreference(pref);
    setActiveLanguage(resolveLanguage(pref));
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, pref);
    } catch {
      // Storage error ignored
    }
  };

  const t = (key: TranslationKey): string => {
    const dict = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;
    return (dict as Record<string, string>)[key] || (TRANSLATIONS.vi as Record<string, string>)[key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        preference,
        activeLanguage,
        setLanguagePreference,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
