// ------------------------------------------------------------------ //
//                         Audio Manager
// ------------------------------------------------------------------ //

import { Audio } from 'expo-av'
import { useSettingsStore } from '../theme/themeStore'

// Sound effect types
export type SoundEffect =
  | 'shoot_player'
  | 'explosion_small'
  | 'explosion_large'
  | 'explosion_boss'
  | 'powerup_pickup'
  | 'player_damage'
  | 'combo_milestone'
  | 'boss_warning'

// Sound pool for reusable sounds
interface SoundPool {
  [key: string]: Audio.Sound | null
}

// Map sound effect types to asset files
const SOUND_FILES: Record<SoundEffect, any> = {
  shoot_player: require('../../assets/sounds/shoot_player.mp3'),
  explosion_small: require('../../assets/sounds/explosion_small.mp3'),
  explosion_large: require('../../assets/sounds/explosion_large.mp3'),
  explosion_boss: require('../../assets/sounds/explosion_boss.mp3'),
  powerup_pickup: require('../../assets/sounds/powerup_pickup.mp3'),
  player_damage: require('../../assets/sounds/player_damage.mp3'),
  combo_milestone: require('../../assets/sounds/combo_milestone.mp3'),
  boss_warning: require('../../assets/sounds/boss_warning.mp3'),
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
      await this.preloadSounds()
      this.initialized = true
    } catch (error) {
      console.warn('AudioManager init failed:', error)
    }
  }

  private async preloadSounds() {
    // Load all sound files into the pool
    for (const [effect, assetPath] of Object.entries(SOUND_FILES)) {
      try {
        const { sound } = await Audio.Sound.createAsync(assetPath, {
          shouldPlay: false,
        })
        this.sounds[effect] = sound
      } catch (error) {
        console.warn(`Failed to load sound: ${effect}`, error)
        this.sounds[effect] = null
      }
    }
  }

  async playSfx(effect: SoundEffect) {
    const sfxVolume = useSettingsStore.getState().sfxVolume

    if (sfxVolume <= 0) return

    try {
      await this.init()

      const sound = this.sounds[effect]
      if (!sound) {
        // Sound failed to load during preload
        return
      }

      // Set volume and replay the sound (fire-and-forget for performance)
      // Don't await to allow simultaneous sounds without blocking
      sound.setVolumeAsync(sfxVolume).catch(() => {
        // Silently ignore volume errors
      })
      sound.replayAsync().catch(() => {
        // Silently ignore playback errors
      })
    } catch (error) {
      // Silently fail - sound effects are non-critical
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
