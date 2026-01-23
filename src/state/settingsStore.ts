import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageCode } from '../i18n/types';
import { QualityLevel } from '../types/performance';

export type JoystickSize = 'small' | 'medium' | 'large';

interface AppSettingsState {
  // General settings
  language: LanguageCode;
  joystickSize: JoystickSize;
  invertY: boolean;
  showPerformanceStats: boolean;
  qualityLevel: QualityLevel;

  // Actions
  setLanguage: (language: LanguageCode) => void;
  setJoystickSize: (size: JoystickSize) => void;
  setInvertY: (enabled: boolean) => void;
  setShowPerformanceStats: (enabled: boolean) => void;
  setQualityLevel: (level: QualityLevel) => void;
  resetAppSettings: () => void;
}

const DEFAULT_APP_SETTINGS = {
  language: 'en' as LanguageCode,
  joystickSize: 'medium' as JoystickSize,
  invertY: false,
  showPerformanceStats: false,
  qualityLevel: 'high' as QualityLevel,
};

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_APP_SETTINGS,

      setLanguage: (language) => set({ language }),
      setJoystickSize: (size) => set({ joystickSize: size }),
      setInvertY: (enabled) => set({ invertY: enabled }),
      setShowPerformanceStats: (enabled) => set({ showPerformanceStats: enabled }),
      setQualityLevel: (level) => set({ qualityLevel: level }),

      resetAppSettings: () => set(DEFAULT_APP_SETTINGS),
    }),
    {
      name: 'app-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
