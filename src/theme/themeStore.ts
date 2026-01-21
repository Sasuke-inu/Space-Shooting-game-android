// ------------------------------------------------------------------ //
//                         Theme Store
// ------------------------------------------------------------------ //

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ThemeId, GameTheme, ThemeColors } from './types'
import { themes, defaultThemeId, getTheme } from './themes'

export type JoystickSize = 'small' | 'medium' | 'large'
export type JoystickPosition = 'left' | 'center' | 'right'

interface SettingsState {
  // Theme
  themeId: ThemeId

  // Audio
  musicVolume: number
  sfxVolume: number

  // Controls
  joystickSensitivity: number
  joystickSize: JoystickSize
  joystickPosition: JoystickPosition
  invertY: boolean
  autoFire: boolean
  hapticsEnabled: boolean
}

interface SettingsActions {
  // Theme
  setTheme: (themeId: ThemeId) => void
  getTheme: () => GameTheme
  getColors: () => ThemeColors

  // Audio
  setMusicVolume: (volume: number) => void
  setSfxVolume: (volume: number) => void

  // Controls
  setJoystickSensitivity: (sensitivity: number) => void
  setJoystickSize: (size: JoystickSize) => void
  setJoystickPosition: (position: JoystickPosition) => void
  setInvertY: (enabled: boolean) => void
  setAutoFire: (enabled: boolean) => void
  setHapticsEnabled: (enabled: boolean) => void

  // Reset
  resetSettings: () => void
}

type SettingsStore = SettingsState & SettingsActions

const defaultSettings: SettingsState = {
  themeId: defaultThemeId,
  musicVolume: 0.5,
  sfxVolume: 0.7,
  joystickSensitivity: 1.0,
  joystickSize: 'medium',
  joystickPosition: 'center',
  invertY: false,
  autoFire: false,
  hapticsEnabled: true,
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      // Theme actions
      setTheme: (themeId: ThemeId) => set({ themeId }),

      getTheme: () => getTheme(get().themeId),

      getColors: () => getTheme(get().themeId).colors,

      // Audio actions
      setMusicVolume: (volume: number) => set({ musicVolume: Math.max(0, Math.min(1, volume)) }),

      setSfxVolume: (volume: number) => set({ sfxVolume: Math.max(0, Math.min(1, volume)) }),

      // Control actions
      setJoystickSensitivity: (sensitivity: number) =>
        set({ joystickSensitivity: Math.max(0.5, Math.min(2, sensitivity)) }),

      setJoystickSize: (size: JoystickSize) => set({ joystickSize: size }),

      setJoystickPosition: (position: JoystickPosition) => set({ joystickPosition: position }),

      setInvertY: (enabled: boolean) => set({ invertY: enabled }),

      setAutoFire: (enabled: boolean) => set({ autoFire: enabled }),

      setHapticsEnabled: (enabled: boolean) => set({ hapticsEnabled: enabled }),

      // Reset
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

// Convenience hooks for accessing theme
export const useTheme = () => useSettingsStore((s) => getTheme(s.themeId))
export const useThemeColors = () => useSettingsStore((s) => getTheme(s.themeId).colors)
export const useThemeId = () => useSettingsStore((s) => s.themeId)
