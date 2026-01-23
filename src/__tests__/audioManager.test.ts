/**
 * Audio Manager Unit Tests
 * Tests audio playback and sound effect management
 */

import { Audio } from 'expo-av'

// Mock themeStore before importing
let mockSubscriber: ((state: any) => void) | null = null

jest.mock('../theme/themeStore', () => ({
  useSettingsStore: {
    getState: jest.fn(() => ({ sfxVolume: 0.7 })),
    setState: jest.fn(),
    subscribe: jest.fn((callback: (state: any) => void) => {
      mockSubscriber = callback
      return jest.fn() // Return unsubscribe function
    }),
  },
}))

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Sound: {
      createAsync: jest.fn(),
    },
  },
}))

// Mock sound files
jest.mock('../../assets/sounds/shoot_player.mp3', () => 'shoot_player.mp3', { virtual: true })
jest.mock('../../assets/sounds/explosion_small.mp3', () => 'explosion_small.mp3', { virtual: true })
jest.mock('../../assets/sounds/explosion_large.mp3', () => 'explosion_large.mp3', { virtual: true })
jest.mock('../../assets/sounds/explosion_boss.mp3', () => 'explosion_boss.mp3', { virtual: true })
jest.mock('../../assets/sounds/powerup_pickup.mp3', () => 'powerup_pickup.mp3', { virtual: true })
jest.mock('../../assets/sounds/player_damage.mp3', () => 'player_damage.mp3', { virtual: true })
jest.mock('../../assets/sounds/combo_milestone.mp3', () => 'combo_milestone.mp3', { virtual: true })
jest.mock('../../assets/sounds/boss_warning.mp3', () => 'boss_warning.mp3', { virtual: true })

// Import after mocks
import { AudioManager, playSfx } from '../utils/audioManager'
import { useSettingsStore } from '../theme/themeStore'

describe('AudioManager', () => {
  let mockSound: any
  let audioManager: AudioManager

  beforeEach(() => {
    jest.clearAllMocks()

    // Create a new AudioManager instance for each test
    audioManager = new (AudioManager as any)()

    // Reset settings store mock
    ;(useSettingsStore.getState as jest.Mock).mockReturnValue({ sfxVolume: 0.7 })

    // Create mock sound object
    mockSound = {
      setVolumeAsync: jest.fn().mockResolvedValue(undefined),
      replayAsync: jest.fn().mockResolvedValue(undefined),
      unloadAsync: jest.fn().mockResolvedValue(undefined),
    }

    // Mock Audio.Sound.createAsync to return our mock sound
    ;(Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
      sound: mockSound,
    })
  })

  // ------------------------------------------------------------------ //
  //                         Initialization
  // ------------------------------------------------------------------ //
  describe('initialization', () => {
    test('initializes audio mode on first init', async () => {
      await audioManager.init()

      expect(Audio.setAudioModeAsync).toHaveBeenCalledWith({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      })
    })

    test('preloads all sound effects', async () => {
      await audioManager.init()

      // Should create sound for each effect
      expect(Audio.Sound.createAsync).toHaveBeenCalledTimes(8)
      expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
        expect.any(String),
        { shouldPlay: false }
      )
    })

    test('only initializes once', async () => {
      await audioManager.init()
      await audioManager.init()
      await audioManager.init()

      // Should only call setAudioModeAsync once
      expect(Audio.setAudioModeAsync).toHaveBeenCalledTimes(1)
    })

    test('handles initialization errors gracefully', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      ;(Audio.setAudioModeAsync as jest.Mock).mockRejectedValueOnce(new Error('Init failed'))

      await audioManager.init()

      expect(consoleWarnSpy).toHaveBeenCalledWith('AudioManager init failed:', expect.any(Error))
      consoleWarnSpy.mockRestore()
    })

    test('handles sound loading errors gracefully', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      ;(Audio.Sound.createAsync as jest.Mock)
        .mockResolvedValueOnce({ sound: mockSound })
        .mockRejectedValueOnce(new Error('Load failed'))
        .mockResolvedValue({ sound: mockSound })

      await audioManager.init()

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load sound:'),
        expect.any(Error)
      )
      consoleWarnSpy.mockRestore()
    })
  })

  // ------------------------------------------------------------------ //
  //                         Sound Playback
  // ------------------------------------------------------------------ //
  describe('sound playback', () => {
    test('plays sound effect with correct volume', async () => {
      ;(useSettingsStore.getState as jest.Mock).mockReturnValue({ sfxVolume: 0.5 })

      await audioManager.init()
      await audioManager.playSfx('shoot_player')

      expect(mockSound.setVolumeAsync).toHaveBeenCalledWith(0.5)
      expect(mockSound.replayAsync).toHaveBeenCalled()
    })

    test('does not play sound if volume is 0', async () => {
      ;(useSettingsStore.getState as jest.Mock).mockReturnValue({ sfxVolume: 0 })

      await audioManager.init()
      await audioManager.playSfx('shoot_player')

      expect(mockSound.setVolumeAsync).not.toHaveBeenCalled()
      expect(mockSound.replayAsync).not.toHaveBeenCalled()
    })

    test('does not play sound if volume is negative', async () => {
      ;(useSettingsStore.getState as jest.Mock).mockReturnValue({ sfxVolume: -0.1 })

      await audioManager.init()
      await audioManager.playSfx('shoot_player')

      expect(mockSound.setVolumeAsync).not.toHaveBeenCalled()
      expect(mockSound.replayAsync).not.toHaveBeenCalled()
    })

    test('auto-initializes on first play', async () => {
      await audioManager.playSfx('shoot_player')

      expect(Audio.setAudioModeAsync).toHaveBeenCalled()
      expect(mockSound.replayAsync).toHaveBeenCalled()
    })

    test('plays all sound effect types', async () => {
      const effects = [
        'shoot_player',
        'explosion_small',
        'explosion_large',
        'explosion_boss',
        'powerup_pickup',
        'player_damage',
        'combo_milestone',
        'boss_warning',
      ] as const

      await audioManager.init()

      for (const effect of effects) {
        jest.clearAllMocks()
        await audioManager.playSfx(effect)
        expect(mockSound.replayAsync).toHaveBeenCalled()
      }
    })

    test('handles playback errors silently', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      mockSound.replayAsync.mockRejectedValueOnce(new Error('Playback failed'))

      await audioManager.init()
      await audioManager.playSfx('shoot_player')

      // Should not throw or log (silently fails)
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      consoleWarnSpy.mockRestore()
    })

    test('handles volume errors silently', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      mockSound.setVolumeAsync.mockRejectedValueOnce(new Error('Volume failed'))

      await audioManager.init()
      await audioManager.playSfx('shoot_player')

      // Should not throw or log (silently fails)
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      consoleWarnSpy.mockRestore()
    })

    test('handles missing sound gracefully', async () => {
      // Simulate a sound that failed to load
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      ;(Audio.Sound.createAsync as jest.Mock).mockResolvedValueOnce({
        sound: null,
      })

      await audioManager.init()

      // Manually set a sound to null to simulate failed load
      ;(audioManager as any).sounds['shoot_player'] = null

      await audioManager.playSfx('shoot_player')

      // Should not crash
      expect(mockSound.replayAsync).not.toHaveBeenCalled()
      consoleWarnSpy.mockRestore()
    })

    test('plays sounds without blocking', async () => {
      // Make replay take a long time
      let resolveReplay: () => void
      const replayPromise = new Promise<void>(resolve => {
        resolveReplay = resolve
      })
      mockSound.replayAsync.mockReturnValueOnce(replayPromise)

      await audioManager.init()

      // Start playing sound
      const playPromise = audioManager.playSfx('shoot_player')

      // Should not wait for replay to complete
      await playPromise

      // Clean up
      resolveReplay!()
      await replayPromise
    })
  })

  // ------------------------------------------------------------------ //
  //                         Volume Control
  // ------------------------------------------------------------------ //
  describe('volume control', () => {
    test('respects different volume levels', async () => {
      const volumes = [0.1, 0.3, 0.5, 0.7, 1.0]

      await audioManager.init()

      for (const volume of volumes) {
        jest.clearAllMocks()
        ;(useSettingsStore.getState as jest.Mock).mockReturnValue({ sfxVolume: volume })

        // Trigger the subscription callback to update cached volume
        if (mockSubscriber) {
          mockSubscriber({ sfxVolume: volume })
        }

        await audioManager.playSfx('shoot_player')

        expect(mockSound.setVolumeAsync).toHaveBeenCalledWith(volume)
      }
    })

    test('reads volume from settings store via subscription', async () => {
      await audioManager.init()

      ;(useSettingsStore.getState as jest.Mock).mockReturnValue({ sfxVolume: 0.3 })
      // Trigger subscription to update cached volume
      if (mockSubscriber) {
        mockSubscriber({ sfxVolume: 0.3 })
      }
      await audioManager.playSfx('shoot_player')
      expect(mockSound.setVolumeAsync).toHaveBeenCalledWith(0.3)

      jest.clearAllMocks()
      ;(useSettingsStore.getState as jest.Mock).mockReturnValue({ sfxVolume: 0.8 })
      // Trigger subscription to update cached volume
      if (mockSubscriber) {
        mockSubscriber({ sfxVolume: 0.8 })
      }
      await audioManager.playSfx('shoot_player')
      expect(mockSound.setVolumeAsync).toHaveBeenCalledWith(0.8)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Cleanup
  // ------------------------------------------------------------------ //
  describe('cleanup', () => {
    test('unloads all sounds', async () => {
      await audioManager.init()
      await audioManager.cleanup()

      // Should unload each sound (8 total)
      expect(mockSound.unloadAsync).toHaveBeenCalledTimes(8)
    })

    test('clears sound pool', async () => {
      await audioManager.init()
      await audioManager.cleanup()

      // Sound pool should be empty
      expect((audioManager as any).sounds).toEqual({})
    })

    test('handles cleanup errors gracefully', async () => {
      mockSound.unloadAsync.mockRejectedValueOnce(new Error('Unload failed'))

      await audioManager.init()
      await audioManager.cleanup()

      // Should not throw
      expect((audioManager as any).sounds).toEqual({})
    })

    test('handles cleanup of null sounds', async () => {
      await audioManager.init()

      // Set one sound to null
      ;(audioManager as any).sounds['shoot_player'] = null

      await audioManager.cleanup()

      // Should not crash
      expect((audioManager as any).sounds).toEqual({})
    })
  })

  // ------------------------------------------------------------------ //
  //                         Convenience Function
  // ------------------------------------------------------------------ //
  describe('playSfx convenience function', () => {
    test('plays sound effect', async () => {
      // Use the singleton instance exported from audioManager
      await playSfx('shoot_player')

      // Should initialize and play
      expect(Audio.setAudioModeAsync).toHaveBeenCalled()
    })

    test('does not block execution', async () => {
      const promise = playSfx('shoot_player')

      // Should return immediately (undefined return for fire-and-forget)
      expect(promise).toBeUndefined()
    })
  })

  // ------------------------------------------------------------------ //
  //                         Edge Cases
  // ------------------------------------------------------------------ //
  describe('edge cases', () => {
    test('handles rapid successive plays', async () => {
      await audioManager.init()

      // Play same sound multiple times rapidly
      await audioManager.playSfx('shoot_player')
      await audioManager.playSfx('shoot_player')
      await audioManager.playSfx('shoot_player')

      // Should call replay 3 times
      expect(mockSound.replayAsync).toHaveBeenCalledTimes(3)
    })

    test('handles playing different sounds simultaneously', async () => {
      await audioManager.init()

      // Play different sounds without waiting
      audioManager.playSfx('shoot_player')
      audioManager.playSfx('explosion_small')
      audioManager.playSfx('powerup_pickup')

      // Should not crash or block
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    test('can reinitialize after cleanup', async () => {
      await audioManager.init()
      await audioManager.cleanup()

      // Reset initialized flag for this test
      ;(audioManager as any).initialized = false

      await audioManager.init()
      await audioManager.playSfx('shoot_player')

      expect(mockSound.replayAsync).toHaveBeenCalled()
    })
  })
})
