// ------------------------------------------------------------------ //
//                         Haptics Manager
//                  Enhanced for Android with custom patterns
// ------------------------------------------------------------------ //

import * as Haptics from 'expo-haptics'
import { Platform, Vibration } from 'react-native'
import { useSettingsStore } from '../theme/themeStore'

// Haptic feedback types
export type HapticType =
  | 'light'        // Fire bullet
  | 'medium'       // Destroy asteroid
  | 'heavy'        // Destroy enemy
  | 'success'      // Power-up collected
  | 'warning'      // Take damage
  | 'error'        // Game over
  | 'selection'    // UI button press
  // Android-specific enhanced patterns
  | 'boss_spawn'   // Boss appears
  | 'boss_hit'     // Hit the boss
  | 'boss_defeat'  // Boss defeated
  | 'combo_3'      // 3x combo
  | 'combo_5'      // 5x combo
  | 'combo_10'     // 10x combo
  | 'shield_hit'   // Shield absorbs damage
  | 'special_ability' // Special ability activated
  | 'wave_complete'   // Wave completed

// Android vibration patterns (in milliseconds)
// Pattern format: [wait, vibrate, wait, vibrate, ...]
const ANDROID_PATTERNS: Record<string, number[]> = {
  boss_spawn: [0, 100, 50, 100, 50, 200, 100, 300],  // Dramatic build-up
  boss_hit: [0, 30, 20, 30],                          // Quick double tap
  boss_defeat: [0, 100, 50, 100, 50, 100, 100, 400], // Victory pattern
  combo_3: [0, 50, 30, 50, 30, 50],                  // Triple pulse
  combo_5: [0, 40, 20, 40, 20, 40, 20, 40, 20, 40],  // Five pulses
  combo_10: [0, 30, 15, 30, 15, 30, 15, 30, 15, 30, 15, 30, 15, 30, 15, 30, 15, 30, 15, 200], // Rapid + finale
  shield_hit: [0, 20, 40, 60],                        // Absorption feel
  special_ability: [0, 80, 40, 80, 40, 150],         // Power activation
  wave_complete: [0, 50, 100, 50, 100, 100],         // Achievement feel
}

// Haptic intensity multipliers
export type HapticIntensity = 'off' | 'light' | 'medium' | 'strong'

const INTENSITY_MULTIPLIERS: Record<HapticIntensity, number> = {
  off: 0,
  light: 0.5,
  medium: 1.0,
  strong: 1.5,
}

class HapticsManager {
  private lastTriggerTime: number = 0
  private minInterval: number = 16 // Minimum 16ms between haptics to prevent overlap

  private getIntensity(): HapticIntensity {
    const store = useSettingsStore.getState()
    return (store as any).hapticIntensity || 'medium'
  }

  private shouldThrottle(): boolean {
    const now = Date.now()
    if (now - this.lastTriggerTime < this.minInterval) {
      return true
    }
    this.lastTriggerTime = now
    return false
  }

  private scalePattern(pattern: number[], intensity: HapticIntensity): number[] {
    const multiplier = INTENSITY_MULTIPLIERS[intensity]
    if (multiplier === 0) return []

    return pattern.map((value, index) => {
      // Only scale vibration durations (odd indices after 0)
      if (index > 0 && index % 2 === 1) {
        return Math.round(value * multiplier)
      }
      return value
    })
  }

  async trigger(type: HapticType) {
    // Check if haptics are enabled
    const hapticsEnabled = useSettingsStore.getState().hapticsEnabled
    if (!hapticsEnabled) return

    // Haptics only work on iOS and Android
    if (Platform.OS === 'web') return

    // Throttle rapid haptic calls
    if (this.shouldThrottle()) return

    const intensity = this.getIntensity()
    if (intensity === 'off') return

    try {
      // Check for Android-specific patterns first
      if (Platform.OS === 'android' && type in ANDROID_PATTERNS) {
        const pattern = this.scalePattern(ANDROID_PATTERNS[type], intensity)
        if (pattern.length > 0) {
          Vibration.vibrate(pattern)
        }
        return
      }

      // Standard haptics for iOS and fallback for Android
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
        // Fallback for enhanced types on iOS
        case 'boss_spawn':
        case 'boss_defeat':
        case 'wave_complete':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          break
        case 'boss_hit':
        case 'shield_hit':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          break
        case 'combo_3':
        case 'combo_5':
        case 'combo_10':
        case 'special_ability':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
          break
      }
    } catch (error) {
      // Silently fail - haptics are non-critical
    }
  }

  // Cancel any ongoing vibration (Android only)
  cancel() {
    if (Platform.OS === 'android') {
      Vibration.cancel()
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

  // Android-enhanced methods
  bossSpawn = () => this.trigger('boss_spawn')
  bossHit = () => this.trigger('boss_hit')
  bossDefeat = () => this.trigger('boss_defeat')
  combo3 = () => this.trigger('combo_3')
  combo5 = () => this.trigger('combo_5')
  combo10 = () => this.trigger('combo_10')
  shieldHit = () => this.trigger('shield_hit')
  specialAbility = () => this.trigger('special_ability')
  waveComplete = () => this.trigger('wave_complete')
}

// Singleton instance
export const hapticsManager = new HapticsManager()

// Convenience functions
export const triggerHaptic = (type: HapticType) => hapticsManager.trigger(type)
export const cancelHaptic = () => hapticsManager.cancel()

// Standard haptics
export const hapticLight = () => hapticsManager.light()
export const hapticMedium = () => hapticsManager.medium()
export const hapticHeavy = () => hapticsManager.heavy()
export const hapticSuccess = () => hapticsManager.success()
export const hapticWarning = () => hapticsManager.warning()
export const hapticError = () => hapticsManager.error()
export const hapticSelection = () => hapticsManager.selection()

// Android-enhanced haptics
export const hapticBossSpawn = () => hapticsManager.bossSpawn()
export const hapticBossHit = () => hapticsManager.bossHit()
export const hapticBossDefeat = () => hapticsManager.bossDefeat()
export const hapticCombo = (count: number) => {
  if (count >= 10) hapticsManager.combo10()
  else if (count >= 5) hapticsManager.combo5()
  else if (count >= 3) hapticsManager.combo3()
}
export const hapticShieldHit = () => hapticsManager.shieldHit()
export const hapticSpecialAbility = () => hapticsManager.specialAbility()
export const hapticWaveComplete = () => hapticsManager.waveComplete()
