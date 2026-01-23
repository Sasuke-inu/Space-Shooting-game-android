import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import secureStorage from '../utils/secureStorage';
import { LanguageCode, Translations } from './types';
import { en } from './translations/en';
import { es } from './translations/es';
import { zh } from './translations/zh';
import { ja } from './translations/ja';
import { ko } from './translations/ko';

interface I18nState {
  currentLanguage: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string) => string;
}

const translations: Record<LanguageCode, Translations> = {
  en,
  es,
  zh,
  ja,
  ko,
};

// Helper function to get nested translation value using dot notation
const getNestedTranslation = (obj: any, path: string): string => {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return path; // Return the key itself if translation not found
    }
  }

  return typeof current === 'string' ? current : path;
};

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      currentLanguage: 'en',

      setLanguage: (language: LanguageCode) => {
        set({ currentLanguage: language });
      },

      t: (key: string): string => {
        const { currentLanguage } = get();
        const translation = translations[currentLanguage];
        return getNestedTranslation(translation, key);
      },
    }),
    {
      name: 'i18n-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
