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
  | 'boss_warning'

// Sound pool entry with multiple instances for overlapping playback
interface SoundPoolEntry {
  instances: Audio.Sound[]
  currentIndex: number
}

// Sound pool for reusable sounds
interface SoundPool {
  [key: string]: SoundPoolEntry
}

// Map sound effects to their asset files
const SOUND_ASSETS: Record<SoundEffect, any> = {
  shoot_player: null, // Will be: require('../../assets/sounds/shoot_player.mp3')
  shoot_enemy: null, // Will be: require('../../assets/sounds/shoot_enemy.mp3')
  explosion_small: null, // Will be: require('../../assets/sounds/explosion_small.mp3')
  explosion_large: null, // Will be: require('../../assets/sounds/explosion_large.mp3')
  powerup_pickup: null, // Will be: require('../../assets/sounds/powerup_pickup.mp3')
  hit_damage: null, // Placeholder - not in current asset list
  low_health: null, // Placeholder - not in current asset list
  combo: null, // Will be: require('../../assets/sounds/combo.mp3')
  boss_warning: null, // Will be: require('../../assets/sounds/boss_warning.mp3')
}

class AudioManager {
  private sounds: SoundPool = {}
  private initialized = false
  private poolSize = 3 // Number of instances per sound effect
  private musicSound: Audio.Sound | null = null
  private musicLoaded = false

  async init() {
    if (this.initialized) return

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      })
      this.initialized = true
      await this.loadSounds()
    } catch (error) {
      console.warn('AudioManager init failed:', error)
    }
  }

  // Load all sound effects into the pool
  private async loadSounds() {
    const effects = Object.keys(SOUND_ASSETS) as SoundEffect[]

    for (const effect of effects) {
      const asset = SOUND_ASSETS[effect]

      // Skip if no asset file defined yet
      if (!asset) continue

      try {
        const instances: Audio.Sound[] = []

        // Create multiple instances for sound pooling
        for (let i = 0; i < this.poolSize; i++) {
          const { sound } = await Audio.Sound.createAsync(asset, {
            isLooping: false,
            volume: 1.0,
          })
          instances.push(sound)
        }

        this.sounds[effect] = {
          instances,
          currentIndex: 0,
        }
      } catch (error) {
        // Silently fail for missing sound files - they're optional
        if (__DEV__) {
          console.warn(`Failed to load sound: ${effect}`, error)
        }
      }
    }
  }

  // Play a sound effect with volume control
  async playSfx(effect: SoundEffect) {
    const sfxVolume = useSettingsStore.getState().sfxVolume

    if (sfxVolume <= 0) return

    try {
      await this.init()

      const poolEntry = this.sounds[effect]

      // If sound not loaded, skip silently (asset files may not exist yet)
      if (!poolEntry || poolEntry.instances.length === 0) {
        return
      }

      // Get next available sound instance from pool
      const sound = poolEntry.instances[poolEntry.currentIndex]
      poolEntry.currentIndex = (poolEntry.currentIndex + 1) % poolEntry.instances.length

      // Set volume and play
      await sound.setVolumeAsync(sfxVolume)
      await sound.setPositionAsync(0) // Reset to start
      await sound.playAsync()

    } catch (error) {
      // Silently fail - sound effects are non-critical
      if (__DEV__) {
        console.warn(`Failed to play sound: ${effect}`, error)
      }
    }
  }

  // Load and start playing background music
  async loadMusic(musicAsset: any) {
    try {
      await this.init()

      // Unload existing music if any
      if (this.musicSound) {
        await this.stopMusic()
      }

      const musicVolume = useSettingsStore.getState().musicVolume

      const { sound } = await Audio.Sound.createAsync(musicAsset, {
        isLooping: true,
        volume: musicVolume,
      })

      this.musicSound = sound
      this.musicLoaded = true

      await sound.playAsync()
    } catch (error) {
      console.warn('Failed to load music:', error)
    }
  }

  // Play or resume music
  async playMusic() {
    if (!this.musicSound || !this.musicLoaded) return

    try {
      const status = await this.musicSound.getStatusAsync()
      if (status.isLoaded && !status.isPlaying) {
        await this.musicSound.playAsync()
      }
    } catch (error) {
      console.warn('Failed to play music:', error)
    }
  }

  // Pause music
  async pauseMusic() {
    if (!this.musicSound || !this.musicLoaded) return

    try {
      const status = await this.musicSound.getStatusAsync()
      if (status.isLoaded && status.isPlaying) {
        await this.musicSound.pauseAsync()
      }
    } catch (error) {
      console.warn('Failed to pause music:', error)
    }
  }

  // Stop and unload music
  async stopMusic() {
    if (!this.musicSound) return

    try {
      await this.musicSound.stopAsync()
      await this.musicSound.unloadAsync()
    } catch (error) {
      // Ignore cleanup errors
    } finally {
      this.musicSound = null
      this.musicLoaded = false
    }
  }

  // Update music volume
  async setMusicVolume(volume: number) {
    if (!this.musicSound || !this.musicLoaded) return

    try {
      await this.musicSound.setVolumeAsync(volume)
    } catch (error) {
      console.warn('Failed to set music volume:', error)
    }
  }

  async cleanup() {
    // Cleanup music
    await this.stopMusic()

    // Cleanup sound effects
    for (const poolEntry of Object.values(this.sounds)) {
      for (const sound of poolEntry.instances) {
        try {
          await sound.unloadAsync()
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
    this.sounds = {}
    this.initialized = false
  }
}

// Singleton instance
export const audioManager = new AudioManager()

// Convenience function
export const playSfx = (effect: SoundEffect) => {
  audioManager.playSfx(effect)
}
