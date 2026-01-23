/**
 * Audio Manager Unit Tests
 * Tests audio system functionality including SFX and music
 */

import { audioManager, playSfx, SoundEffect } from '../utils/audioManager'
import { Audio } from 'expo-av'
import { useSettingsStore } from '../theme/themeStore'

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Sound: {
      createAsync: jest.fn(),
    },
  },
}))

// Mock sound instance
const createMockSound = () => ({
  setVolumeAsync: jest.fn().mockResolvedValue(undefined),
  setPositionAsync: jest.fn().mockResolvedValue(undefined),
  playAsync: jest.fn().mockResolvedValue(undefined),
  pauseAsync: jest.fn().mockResolvedValue(undefined),
  stopAsync: jest.fn().mockResolvedValue(undefined),
  unloadAsync: jest.fn().mockResolvedValue(undefined),
  getStatusAsync: jest.fn().mockResolvedValue({
    isLoaded: true,
    isPlaying: false,
  }),
})

// Reset before each test
beforeEach(async () => {
  // Reset all mocks
  jest.clearAllMocks()

  // Reset settings store
  useSettingsStore.setState({
    sfxVolume: 1.0,
    musicVolume: 0.8,
  })

  // Cleanup audio manager
  await audioManager.cleanup()

  // Setup default mock for createAsync
  const mockSound = createMockSound()
  ;(Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
    sound: mockSound,
  })
})

describe('audioManager', () => {
  // ------------------------------------------------------------------ //
  //                         Initialization
  // ------------------------------------------------------------------ //
  describe('initialization', () => {
    test('initializes audio mode on first init', async () => {
      await audioManager.init()

      expect(Audio.setAudioModeAsync).toHaveBeenCalledWith({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      })
    })

    test('does not reinitialize if already initialized', async () => {
      await audioManager.init()
      await audioManager.init()

      // Should only be called once
      expect(Audio.setAudioModeAsync).toHaveBeenCalledTimes(1)
    })

    test('handles initialization errors gracefully', async () => {
      ;(Audio.setAudioModeAsync as jest.Mock).mockRejectedValueOnce(new Error('Init failed'))

      // Should not throw
      await expect(audioManager.init()).resolves.not.toThrow()
    })
  })

  // ------------------------------------------------------------------ //
  //                         Sound Effects
  // ------------------------------------------------------------------ //
  describe('sound effects', () => {
    test('plays sound effect with correct volume', async () => {
      useSettingsStore.setState({ sfxVolume: 0.7 })
      const mockSound = createMockSound()
      ;(Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
        sound: mockSound,
      })

      await audioManager.playSfx('shoot_player')

      expect(mockSound.setVolumeAsync).toHaveBeenCalledWith(0.7)
    })

    test('does not play sound when sfxVolume is 0', async () => {
      useSettingsStore.setState({ sfxVolume: 0 })
      const mockSound = createMockSound()
      ;(Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
        sound: mockSound,
      })

      await audioManager.playSfx('explosion_large')

      expect(mockSound.playAsync).not.toHaveBeenCalled()
    })

    test('resets sound position before playing', async () => {
      const mockSound = createMockSound()
      ;(Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
        sound: mockSound,
      })

      await audioManager.playSfx('powerup_pickup')

      expect(mockSound.setPositionAsync).toHaveBeenCalledWith(0)
    })

    test('handles missing sound asset gracefully', async () => {
      // Sound not loaded (asset is null)
      await expect(audioManager.playSfx('hit_damage')).resolves.not.toThrow()
    })

    test('handles playback errors gracefully', async () => {
      const mockSound = createMockSound()
      mockSound.playAsync.mockRejectedValueOnce(new Error('Playback failed'))
      ;(Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
        sound: mockSound,
      })

      await expect(audioManager.playSfx('combo')).resolves.not.toThrow()
    })

    test('convenience function playSfx calls audioManager', async () => {
      const spy = jest.spyOn(audioManager, 'playSfx')

      playSfx('boss_warning')

      expect(spy).toHaveBeenCalledWith('boss_warning')
    })
  })

  // ------------------------------------------------------------------ //
  //                         Music Playback
  // ------------------------------------------------------------------ //
  describe('music playback', () => {
    test('loads and plays music with correct volume', async () => {
      useSettingsStore.setState({ musicVolume: 0.6 })
      const mockSound = createMockSound()
      ;(Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
        sound: mockSound,
      })

      const mockMusicAsset = { uri: 'music.mp3' }
      await audioManager.loadMusic(mockMusicAsset)

      expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
        mockMusicAsset,
        expect.objectContaining({
          isLooping: true,
          volume: 0.6,
        })
      )
      expect(mockSound.playAsync).toHaveBeenCalled()
    })

    test('unloads previous music before loading new', async () => {
      const mockSound1 = createMockSound()
      const mockSound2 = createMockSound()

      ;(Audio.Sound.createAsync as jest.Mock)
        .mockResolvedValueOnce({ sound: mockSound1 })
        .mockResolvedValueOnce({ sound: mockSound2 })

      const asset1 = { uri: 'music1.mp3' }
      const asset2 = { uri: 'music2.mp3' }

      await audioManager.loadMusic(asset1)
      await audioManager.loadMusic(asset2)

      expect(mockSound1.stopAsync).toHaveBeenCalled()
      expect(mockSound1.unloadAsync).toHaveBeenCalled()
    })

    test('handles music loading errors gracefully', async () => {
      ;(Audio.Sound.createAsync as jest.Mock).mockRejectedValueOnce(new Error('Load failed'))

      const mockMusicAsset = { uri: 'music.mp3' }
      await expect(audioManager.loadMusic(mockMusicAsset)).resolves.not.toThrow()
    })
  })

  // ------------------------------------------------------------------ //
  //                         Music Control
  // ------------------------------------------------------------------ //
  describe('music control', () => {
    test('playMusic resumes paused music', async () => {
      const mockSound = createMockSound()
      mockSound.getStatusAsync.mockResolvedValue({
        isLoaded: true,
        isPlaying: false,
      })
      ;(Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
        sound: mockSound,
      })

      await audioManager.loadMusic({ uri: 'music.mp3' })
      jest.clearAllMocks() // Clear the playAsync from loadMusic

      await audioManager.playMusic()

      expect(mockSound.playAsync).toHaveBeenCalled()
    })

    test('playMusic does nothing if already playing', async () => {
      const mockSound = createMockSound()
      mockSound.getStatusAsync.mockResolvedValue({
        isLoaded: true,
        isPlaying: true,
      })
      ;(Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
        sound: mockSound,
      })

      await audioManager.loadMusic({ uri: 'music.mp3' })
      jest.clearAllMocks()

      await audioManager.playMusic()

      expect(mockSound.playAsync).not.toHaveBeenCalled()
    })

    test('playMusic does nothing if music not loaded', async () => {
      await expect(audioManager.playMusic()).resolves.not.toThrow()
    })

    test('pauseMusic pauses playing music', async () => {
      const mockSound = createMockSound()
      mockSound.getStatusAsync.mockResolvedValue({
        isLoaded: true,
        isPlaying: true,
      })
      ;(Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
        sound: mockSound,
      })

      await audioManager.loadMusic({ uri: 'music.mp3' })
      await audioManager.pauseMusic()

      expect(mockSound.pauseAsync).toHaveBeenCalled()
    })

    test('pauseMusic does nothing if not playing', async () => {
      const mockSound = createMockSound()
      mockSound.getStatusAsync.mockResolvedValue({
        isLoaded: true,
        isPlaying: false,
      })
      ;(Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
        sound: mockSound,
      })

      await audioManager.loadMusic({ uri: 'music.mp3' })
      await audioManager.pauseMusic()

      expect(mockSound.pauseAsync).not.toHaveBeenCalled()
    })

    test('pauseMusic does nothing if music not loaded', async () => {
      await expect(audioManager.pauseMusic()).resolves.not.toThrow()
    })

    test('stopMusic stops and unloads music', async () => {
      const mockSound = createMockSound()
      ;(Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
        sound: mockSound,
      })

      await audioManager.loadMusic({ uri: 'music.mp3' })
      await audioManager.stopMusic()

      expect(mockSound.stopAsync).toHaveBeenCalled()
      expect(mockSound.unloadAsync).toHaveBeenCalled()
    })

    test('stopMusic handles errors gracefully', async () => {
      const mockSound = createMockSound()
      mockSound.stopAsync.mockRejectedValueOnce(new Error('Stop failed'))
      ;(Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
        sound: mockSound,
      })

      await audioManager.loadMusic({ uri: 'music.mp3' })
      await expect(audioManager.stopMusic()).resolves.not.toThrow()
    })
  })

  // ------------------------------------------------------------------ //
  //                         Volume Control
  // ------------------------------------------------------------------ //
  describe('volume control', () => {
    test('setMusicVolume updates music volume', async () => {
      const mockSound = createMockSound()
      ;(Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
        sound: mockSound,
      })

      await audioManager.loadMusic({ uri: 'music.mp3' })
      await audioManager.setMusicVolume(0.5)

      expect(mockSound.setVolumeAsync).toHaveBeenCalledWith(0.5)
    })

    test('setMusicVolume does nothing if music not loaded', async () => {
      await expect(audioManager.setMusicVolume(0.5)).resolves.not.toThrow()
    })

    test('setMusicVolume handles errors gracefully', async () => {
      const mockSound = createMockSound()
      mockSound.setVolumeAsync.mockRejectedValueOnce(new Error('Volume failed'))
      ;(Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
        sound: mockSound,
      })

      await audioManager.loadMusic({ uri: 'music.mp3' })
      await expect(audioManager.setMusicVolume(0.5)).resolves.not.toThrow()
    })
  })

  // ------------------------------------------------------------------ //
  //                         Cleanup
  // ------------------------------------------------------------------ //
  describe('cleanup', () => {
    test('cleanup stops music and unloads sounds', async () => {
      const mockSound = createMockSound()
      ;(Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
        sound: mockSound,
      })

      await audioManager.loadMusic({ uri: 'music.mp3' })
      await audioManager.cleanup()

      expect(mockSound.stopAsync).toHaveBeenCalled()
      expect(mockSound.unloadAsync).toHaveBeenCalled()
    })

    test('cleanup handles errors gracefully', async () => {
      const mockSound = createMockSound()
      mockSound.unloadAsync.mockRejectedValueOnce(new Error('Unload failed'))
      ;(Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
        sound: mockSound,
      })

      await audioManager.loadMusic({ uri: 'music.mp3' })
      await expect(audioManager.cleanup()).resolves.not.toThrow()
    })

    test('cleanup can be called multiple times safely', async () => {
      await audioManager.cleanup()
      await expect(audioManager.cleanup()).resolves.not.toThrow()
    })
  })
})
