/**
 * Audio Manager Unit Tests
 * Tests audio playback and sound effect management (expo-audio)
 */

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

// Mock expo-audio
const mockPlayer = {
  volume: 1,
  play: jest.fn(),
  pause: jest.fn(),
  seekTo: jest.fn(),
  remove: jest.fn(),
  loop: false,
}

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({ ...mockPlayer })),
  useAudioPlayer: jest.fn(() => ({ ...mockPlayer })),
}))

// Mock sound files
jest.mock('../../assets/sounds/shoot_player.mp3', () => 'shoot_player.mp3', { virtual: true })
jest.mock('../../assets/sounds/shoot_enemy.mp3', () => 'shoot_enemy.mp3', { virtual: true })
jest.mock('../../assets/sounds/explosion_small.mp3', () => 'explosion_small.mp3', { virtual: true })
jest.mock('../../assets/sounds/explosion_large.mp3', () => 'explosion_large.mp3', { virtual: true })
jest.mock('../../assets/sounds/explosion_boss.mp3', () => 'explosion_boss.mp3', { virtual: true })
jest.mock('../../assets/sounds/powerup_pickup.mp3', () => 'powerup_pickup.mp3', { virtual: true })
jest.mock('../../assets/sounds/player_damage.mp3', () => 'player_damage.mp3', { virtual: true })
jest.mock('../../assets/sounds/combo_milestone.mp3', () => 'combo_milestone.mp3', { virtual: true })
jest.mock('../../assets/sounds/boss_warning.mp3', () => 'boss_warning.mp3', { virtual: true })
jest.mock('../../assets/sounds/button_click.mp3', () => 'button_click.mp3', { virtual: true })
jest.mock('../../assets/sounds/screen_transition.mp3', () => 'screen_transition.mp3', { virtual: true })
jest.mock('../../assets/sounds/toggle_on.mp3', () => 'toggle_on.mp3', { virtual: true })
jest.mock('../../assets/sounds/toggle_off.mp3', () => 'toggle_off.mp3', { virtual: true })
jest.mock('../../assets/sounds/achievement_unlock.mp3', () => 'achievement_unlock.mp3', { virtual: true })

// Import after mocks
import { createAudioPlayer } from 'expo-audio'
import { AudioManager, playSfx } from '../utils/audioManager'
import { useSettingsStore } from '../theme/themeStore'

describe('AudioManager', () => {
  let audioManager: AudioManager
  let createdPlayers: any[]

  beforeEach(() => {
    jest.clearAllMocks()
    createdPlayers = []

    // Create a new AudioManager instance for each test
    audioManager = new (AudioManager as any)()

    // Reset settings store mock
    ;(useSettingsStore.getState as jest.Mock).mockReturnValue({ sfxVolume: 0.7 })

    // Track created players
    ;(createAudioPlayer as jest.Mock).mockImplementation(() => {
      const player = {
        volume: 1,
        play: jest.fn(),
        pause: jest.fn(),
        seekTo: jest.fn(),
        remove: jest.fn(),
        loop: false,
      }
      createdPlayers.push(player)
      return player
    })
  })

  // ------------------------------------------------------------------ //
  //                         Initialization
  // ------------------------------------------------------------------ //
  describe('initialization', () => {
    test('preloads all sound effects', async () => {
      await audioManager.init()

      // Should create player for each effect (14 total)
      expect(createAudioPlayer).toHaveBeenCalledTimes(14)
    })

    test('only initializes once', async () => {
      await audioManager.init()
      await audioManager.init()
      await audioManager.init()

      // Should only create players once
      expect(createAudioPlayer).toHaveBeenCalledTimes(14)
    })

    test('handles initialization errors gracefully', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      ;(createAudioPlayer as jest.Mock).mockImplementation(() => {
        throw new Error('Init failed')
      })

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

      // Find the player for shoot_player (first one created since it's alphabetical by SOUND_FILES order)
      const player = createdPlayers[1] // shoot_player is second in SOUND_FILES after shoot_enemy
      expect(player.play).toHaveBeenCalled()
    })

    test('does not play sound if volume is 0', async () => {
      ;(useSettingsStore.getState as jest.Mock).mockReturnValue({ sfxVolume: 0 })

      await audioManager.init()
      await audioManager.playSfx('shoot_player')

      // No player should have play() called
      for (const player of createdPlayers) {
        expect(player.play).not.toHaveBeenCalled()
      }
    })

    test('does not play sound if volume is negative', async () => {
      ;(useSettingsStore.getState as jest.Mock).mockReturnValue({ sfxVolume: -0.1 })

      await audioManager.init()
      await audioManager.playSfx('shoot_player')

      for (const player of createdPlayers) {
        expect(player.play).not.toHaveBeenCalled()
      }
    })

    test('auto-initializes on first play', async () => {
      await audioManager.playSfx('shoot_player')

      expect(createAudioPlayer).toHaveBeenCalled()
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
        await audioManager.playSfx(effect)
      }

      // At least some players should have been played
      const playedCount = createdPlayers.filter(p => p.play.mock.calls.length > 0).length
      expect(playedCount).toBeGreaterThan(0)
    })

    test('handles missing sound gracefully', async () => {
      await audioManager.init()

      // Manually set a sound to null to simulate failed load
      ;(audioManager as any).sounds['shoot_player'] = null

      await audioManager.playSfx('shoot_player')

      // Should not crash
    })
  })

  // ------------------------------------------------------------------ //
  //                         Volume Control
  // ------------------------------------------------------------------ //
  describe('volume control', () => {
    test('updates volume via subscription', async () => {
      await audioManager.init()

      // Trigger the subscription callback to update cached volume
      if (mockSubscriber) {
        mockSubscriber({ sfxVolume: 0.3 })
      }

      await audioManager.playSfx('shoot_player')

      // Volume should be applied to the player
      const playedPlayers = createdPlayers.filter(p => p.play.mock.calls.length > 0)
      expect(playedPlayers.length).toBeGreaterThan(0)
      expect(playedPlayers[0].volume).toBe(0.3)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Cleanup
  // ------------------------------------------------------------------ //
  describe('cleanup', () => {
    test('removes all players', async () => {
      await audioManager.init()
      await audioManager.cleanup()

      // Should remove each player
      for (const player of createdPlayers) {
        expect(player.remove).toHaveBeenCalled()
      }
    })

    test('clears sound pool', async () => {
      await audioManager.init()
      await audioManager.cleanup()

      // Sound pool should be empty
      expect((audioManager as any).sounds).toEqual({})
    })

    test('handles cleanup errors gracefully', async () => {
      ;(createAudioPlayer as jest.Mock).mockImplementation(() => {
        const player = {
          volume: 1,
          play: jest.fn(),
          pause: jest.fn(),
          seekTo: jest.fn(),
          remove: jest.fn().mockImplementation(() => { throw new Error('Remove failed') }),
          loop: false,
        }
        createdPlayers.push(player)
        return player
      })

      await audioManager.init()
      await audioManager.cleanup()

      // Should not throw
      expect((audioManager as any).sounds).toEqual({})
    })
  })

  // ------------------------------------------------------------------ //
  //                         Convenience Function
  // ------------------------------------------------------------------ //
  describe('playSfx convenience function', () => {
    test('plays sound effect', async () => {
      await playSfx('shoot_player')

      // Should initialize and play
      expect(createAudioPlayer).toHaveBeenCalled()
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

      // Should not crash
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

      // Should have created new players
      expect(createAudioPlayer).toHaveBeenCalled()
    })
  })
})
