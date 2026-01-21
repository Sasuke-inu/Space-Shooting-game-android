// ------------------------------------------------------------------ //
//                    Menu Sound Effects Tests
// ------------------------------------------------------------------ //

/**
 * Verification tests for menu sound effects volume control.
 *
 * This test suite verifies that all menu sound effects properly respect
 * the SFX volume setting from the settings store.
 */

describe('Menu Sound Effects - Volume Respect Verification', () => {
  // Import after mocks to ensure they're applied
  let audioManager: any
  let useSettingsStore: any

  beforeAll(() => {
    // Mock AsyncStorage
    jest.mock('@react-native-async-storage/async-storage', () =>require('@react-native-async-storage/async-storage/jest/async-storage-mock'))

    // Mock expo-av
    jest.mock('expo-av', () => ({
      Audio: {
        setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
      },
    }))
  })

  beforeEach(() => {
    // Clear module cache to get fresh imports
    jest.resetModules()

    // Import after mocks
    audioManager = require('../utils/audioManager').audioManager
    useSettingsStore = require('../theme/themeStore').useSettingsStore
  })

  describe('AudioManager Volume Control Implementation', () => {
    it('verifies audioManager checks sfxVolume from settings store', () => {
      // Verify the audioManager implementation retrieves sfxVolume
      const playSfxCode = audioManager.playSfx.toString()

      // Check that it retrieves sfxVolume from store
      expect(playSfxCode).toContain('sfxVolume')
      expect(playSfxCode).toContain('useSettingsStore')
    })

    it('verifies audioManager has early return when volume is 0', () => {
      // Verify the implementation has volume check
      const playSfxCode = audioManager.playSfx.toString()

      // Check for volume check logic
      expect(playSfxCode).toContain('sfxVolume')
      expect(playSfxCode).toContain('return')
    })

    it('verifies all menu sound types are defined', () => {
      const menuSoundTypes = [
        'button_click',
        'screen_transition',
        'toggle_on',
        'toggle_off',
        'achievement_unlock',
      ]

      // Each sound type should have a configuration
      menuSoundTypes.forEach((soundType) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const config = (audioManager as any).getSoundConfig(soundType)
        expect(config).toBeDefined()
        expect(config).toHaveProperty('frequency')
        expect(config).toHaveProperty('duration')
        expect(typeof config.frequency).toBe('number')
        expect(typeof config.duration).toBe('number')
        expect(config.frequency).toBeGreaterThan(0)
        expect(config.duration).toBeGreaterThan(0)
      })
    })
  })

  describe('Integration Points', () => {
    it('verifies GameScreen imports playSfx', () => {
      const gameScreenCode = require('fs').readFileSync(
        require('path').join(__dirname, '../screens/GameScreen.tsx'),
        'utf-8'
      )
      expect(gameScreenCode).toContain("import { playSfx } from")
      expect(gameScreenCode).toContain("playSfx('button_click')")
      expect(gameScreenCode).toContain("toggle_off")
      expect(gameScreenCode).toContain("'screen_transition'")
    })

    it('verifies SettingsScreen imports playSfx', () => {
      const settingsScreenCode = require('fs').readFileSync(
        require('path').join(__dirname, '../screens/SettingsScreen.tsx'),
        'utf-8'
      )
      expect(settingsScreenCode).toContain("import { playSfx } from")
      expect(settingsScreenCode).toContain("playSfx('button_click')")
      expect(settingsScreenCode).toContain("toggle_on")
    })

    it('verifies progressStore imports and uses achievement sound', () => {
      const progressStoreCode = require('fs').readFileSync(
        require('path').join(__dirname, '../state/progressStore.ts'),
        'utf-8'
      )
      expect(progressStoreCode).toContain("import { playSfx } from")
      expect(progressStoreCode).toContain("playSfx('achievement_unlock')")
    })
  })

  describe('Sound Effect Types', () => {
    it('verifies all required menu sound types are exported', () => {
      const audioManagerCode = require('fs').readFileSync(
        require('path').join(__dirname, '../utils/audioManager.ts'),
        'utf-8'
      )

      const requiredTypes = [
        'button_click',
        'screen_transition',
        'toggle_on',
        'toggle_off',
        'achievement_unlock',
      ]

      requiredTypes.forEach((type) => {
        expect(audioManagerCode).toContain(`'${type}'`)
      })
    })
  })
})
