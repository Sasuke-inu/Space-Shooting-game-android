import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageCode } from '../i18n/types';

export type JoystickSize = 'small' | 'medium' | 'large';

interface AppSettingsState {
  // General settings
  language: LanguageCode;
  joystickSize: JoystickSize;
  invertY: boolean;

  // Actions
  setLanguage: (language: LanguageCode) => void;
  setJoystickSize: (size: JoystickSize) => void;
  setInvertY: (enabled: boolean) => void;
  resetAppSettings: () => void;
}

const DEFAULT_APP_SETTINGS = {
  language: 'en' as LanguageCode,
  joystickSize: 'medium' as JoystickSize,
  invertY: false,
};

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_APP_SETTINGS,

      setLanguage: (language) => set({ language }),
      setJoystickSize: (size) => set({ joystickSize: size }),
      setInvertY: (enabled) => set({ invertY: enabled }),

      resetAppSettings: () => set(DEFAULT_APP_SETTINGS),
    }),
    {
      name: 'app-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
