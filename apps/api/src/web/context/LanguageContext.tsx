import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  TRANSLATIONS,
  type SupportedLanguage,
  type LanguagePreference,
  type TranslationKey,
} from '../translations';

interface LanguageContextType {
  preference: LanguagePreference;
  activeLanguage: SupportedLanguage;
  setLanguagePreference: (pref: LanguagePreference) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'nhipnha_language_preference';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreference] = useState<LanguagePreference>('en');
  const [activeLanguage, setActiveLanguage] = useState<SupportedLanguage>('en');

  const detectSystemLanguage = (): SupportedLanguage => {
    if (typeof window !== 'undefined' && window.navigator) {
      try {
        const lang = window.navigator.language.toLowerCase();
        if (lang.startsWith('vi')) return 'vi';
      } catch {}
    }
    return 'en';
  };

  const resolveLanguage = (pref: LanguagePreference): SupportedLanguage => {
    if (pref === 'vi') return 'vi';
    if (pref === 'en') return 'en';
    return detectSystemLanguage();
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved === 'vi' || saved === 'en' || saved === 'system') {
          setPreference(saved);
          setActiveLanguage(resolveLanguage(saved));
        } else {
          setPreference('en');
          setActiveLanguage('en');
        }
      } catch {
        setPreference('en');
        setActiveLanguage('en');
      }
    }
  }, []);

  const setLanguagePreference = (pref: LanguagePreference) => {
    setPreference(pref);
    setActiveLanguage(resolveLanguage(pref));
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, pref);
      } catch {}
    }
  };

  const t = (key: TranslationKey): string => {
    const dict = TRANSLATIONS[activeLanguage] || TRANSLATIONS.vi;
    return (
      (dict as Record<string, string>)[key] ||
      (TRANSLATIONS.vi as Record<string, string>)[key] ||
      key
    );
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
