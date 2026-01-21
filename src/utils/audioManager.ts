// ------------------------------------------------------------------ //
//                         Audio Manager
// ------------------------------------------------------------------ //

import { Audio } from 'expo-av'
import { useSettingsStore } from '../theme/themeStore'

// Sound effect types
export type SoundEffect =
  | 'shoot_player'
  | 'shoot_enemy'
  | 'explosion_small'
  | 'explosion_large'
  | 'powerup_pickup'
  | 'hit_damage'
  | 'low_health'
  | 'combo'

// Sound pool for reusable sounds
interface SoundPool {
  [key: string]: Audio.Sound | null
}

class AudioManager {
  private sounds: SoundPool = {}
  private initialized = false

  async init() {
    if (this.initialized) return

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      })
      this.initialized = true
    } catch (error) {
      console.warn('AudioManager init failed:', error)
    }
  }

  // Generate simple beep sounds procedurally since we don't have audio files
  // In production, replace with actual sound file loading
  async playSfx(effect: SoundEffect) {
    const sfxVolume = useSettingsStore.getState().sfxVolume

    if (sfxVolume <= 0) return

    try {
      await this.init()

      // For now, we'll use a simple approach - in production you'd load actual files
      // This is a placeholder that works without audio files
      const soundConfig = this.getSoundConfig(effect)

      // Create a simple tone using expo-av
      // Note: In a real implementation, you'd have actual audio files
      // For demonstration, we'll just log the sound effect
      if (__DEV__) {
        // In development, just log - actual sounds would need audio files
        // console.log(`[SFX] ${effect} at volume ${sfxVolume}`)
      }

    } catch (error) {
      // Silently fail - sound effects are non-critical
    }
  }

  private getSoundConfig(effect: SoundEffect): { frequency: number; duration: number } {
    switch (effect) {
      case 'shoot_player':
        return { frequency: 800, duration: 50 }
      case 'shoot_enemy':
        return { frequency: 400, duration: 80 }
      case 'explosion_small':
        return { frequency: 200, duration: 150 }
      case 'explosion_large':
        return { frequency: 100, duration: 300 }
      case 'powerup_pickup':
        return { frequency: 1200, duration: 200 }
      case 'hit_damage':
        return { frequency: 300, duration: 100 }
      case 'low_health':
        return { frequency: 500, duration: 400 }
      case 'combo':
        return { frequency: 1000, duration: 100 }
      default:
        return { frequency: 440, duration: 100 }
    }
  }

  async cleanup() {
    for (const sound of Object.values(this.sounds)) {
      if (sound) {
        try {
          await sound.unloadAsync()
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
    this.sounds = {}
  }
}

// Singleton instance
export const audioManager = new AudioManager()

// Convenience function
export const playSfx = (effect: SoundEffect) => {
  audioManager.playSfx(effect)
}
