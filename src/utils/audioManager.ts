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
  [key: string]: SoundPoolEntry
}

// Map sound effects to their asset files
const SOUND_ASSETS: Record<SoundEffect, any> = {
  shoot_player: require('../../assets/sounds/shoot_player.mp3'),
  shoot_enemy: require('../../assets/sounds/shoot_enemy.mp3'),
  explosion_small: require('../../assets/sounds/explosion_small.mp3'),
  explosion_large: require('../../assets/sounds/explosion_large.mp3'),
  powerup_pickup: require('../../assets/sounds/powerup_pickup.mp3'),
  hit_damage: null, // Not used in current implementation
  low_health: null, // Not used in current implementation
  combo: require('../../assets/sounds/combo.mp3'),
  boss_warning: require('../../assets/sounds/boss_warning.mp3'),
}

// Track concurrent playback per sound
interface PlaybackTracker {
  [key: string]: number
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

// Maximum concurrent instances of same sound (prevents audio overflow)
const MAX_CONCURRENT_SOUNDS = 3

export class AudioManager {
  private sounds: SoundPool = {}
  private initialized = false
  private cachedVolume = 1.0
  private playbackCount: PlaybackTracker = {}
  private volumeUnsubscribe: (() => void) | null = null

  async init() {
    if (this.initialized) return

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      })
      await this.preloadSounds()
      this.setupVolumeCache()
      this.initialized = true
      await this.loadSounds()
    } catch (error) {
      console.warn('AudioManager init failed:', error)
    }
  }

  private setupVolumeCache() {
    // Cache initial volume
    this.cachedVolume = useSettingsStore.getState().sfxVolume

    // Subscribe to volume changes for real-time updates (if available)
    // In test environments, subscribe may not be available
    if (typeof useSettingsStore.subscribe === 'function') {
      this.volumeUnsubscribe = useSettingsStore.subscribe(
        (state) => {
          this.cachedVolume = state.sfxVolume
        }
      )
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
        this.playbackCount[effect] = 0
      } catch (error) {
        console.warn(`Failed to load sound: ${effect}`, error)
        this.sounds[effect] = null
        this.playbackCount[effect] = 0
      }
    }
  }

  async playSfx(effect: SoundEffect) {
    // Use cached volume (updated via subscription)
    if (this.cachedVolume <= 0) return

    // Limit concurrent playback to prevent audio overflow
    if (this.playbackCount[effect] >= MAX_CONCURRENT_SOUNDS) {
      return
    }

    try {
      await this.init()

      const sound = this.sounds[effect]
      if (!sound) {
        // Sound failed to load during preload
        return
      }

      // Increment playback counter
      this.playbackCount[effect] = (this.playbackCount[effect] || 0) + 1

      // Set volume and replay the sound (fire-and-forget for performance)
      // Don't await to allow simultaneous sounds without blocking
      sound.setVolumeAsync(this.cachedVolume).catch(() => {
        // Silently ignore volume errors
      })

      sound.replayAsync().then(() => {
        // Decrement counter when sound finishes
        this.playbackCount[effect] = Math.max(0, (this.playbackCount[effect] || 0) - 1)
      }).catch(() => {
        // Decrement counter on error too
        this.playbackCount[effect] = Math.max(0, (this.playbackCount[effect] || 0) - 1)
      })
    } catch (error) {
      // Silently fail - sound effects are non-critical
      // Ensure counter is decremented on error
      this.playbackCount[effect] = Math.max(0, (this.playbackCount[effect] || 0) - 1)
    }
  }

  async cleanup() {
    // Unsubscribe from volume changes
    if (this.volumeUnsubscribe) {
      this.volumeUnsubscribe()
      this.volumeUnsubscribe = null
    }

    // Unload all sounds
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
    this.playbackCount = {}
    this.initialized = false
  }
}

// Singleton instance
export const audioManager = new AudioManager()

// Convenience function
export const playSfx = (effect: SoundEffect) => {
  audioManager.playSfx(effect)
}
