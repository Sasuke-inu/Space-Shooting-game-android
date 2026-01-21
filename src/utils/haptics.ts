// ------------------------------------------------------------------ //
//                         Haptics Manager
// ------------------------------------------------------------------ //

import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'
import { useSettingsStore } from '../theme/themeStore'

// Haptic feedback types
export type HapticType =
  | 'light'      // Fire bullet
  | 'medium'     // Destroy asteroid
  | 'heavy'      // Destroy enemy
  | 'success'    // Power-up collected
  | 'warning'    // Take damage
  | 'error'      // Game over
  | 'selection'  // UI button press

class HapticsManager {
  async trigger(type: HapticType) {
    // Check if haptics are enabled
    const hapticsEnabled = useSettingsStore.getState().hapticsEnabled

    if (!hapticsEnabled) return

    // Haptics only work on iOS and Android
    if (Platform.OS === 'web') return

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          break
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          break
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
          break
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          break
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          break
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
          break
        case 'selection':
          await Haptics.selectionAsync()
          break
      }
    } catch (error) {
      // Silently fail - haptics are non-critical
    }
  }

  // Quick access methods
  light = () => this.trigger('light')
  medium = () => this.trigger('medium')
  heavy = () => this.trigger('heavy')
  success = () => this.trigger('success')
  warning = () => this.trigger('warning')
  error = () => this.trigger('error')
  selection = () => this.trigger('selection')
}

// Singleton instance
export const hapticsManager = new HapticsManager()

// Convenience functions
export const triggerHaptic = (type: HapticType) => hapticsManager.trigger(type)
export const hapticLight = () => hapticsManager.light()
export const hapticMedium = () => hapticsManager.medium()
export const hapticHeavy = () => hapticsManager.heavy()
export const hapticSuccess = () => hapticsManager.success()
export const hapticWarning = () => hapticsManager.warning()
export const hapticError = () => hapticsManager.error()
export const hapticSelection = () => hapticsManager.selection()
