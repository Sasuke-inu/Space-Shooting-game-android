/**
 * Storage Health Unit Tests
 * Tests store validation and health checking
 */

// Mock AsyncStorage before imports
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
  },
}))

import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  validateStoreData,
  checkStoreHealth,
  checkStorageHealth,
  hasCorruptedStores,
  getCorruptedStores,
} from '../utils/storageHealth'
import { STORAGE_KEYS } from '../utils/backupManager'

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>

describe('storageHealth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAsyncStorage.getItem.mockImplementation(() => Promise.resolve(null))
    mockAsyncStorage.setItem.mockImplementation(() => Promise.resolve())
    mockAsyncStorage.removeItem.mockImplementation(() => Promise.resolve())
    mockAsyncStorage.getAllKeys.mockImplementation(() => Promise.resolve([]))
    mockAsyncStorage.multiGet.mockImplementation(() => Promise.resolve([]))
    mockAsyncStorage.multiSet.mockImplementation(() => Promise.resolve())
  })

  // ------------------------------------------------------------------ //
  //                         Achievement Validation Tests
  // ------------------------------------------------------------------ //
  describe('Achievement Validation', () => {
    test('validates valid achievement data', () => {
      const data = {
        achievements: {
          first_blood: {
            id: 'first_blood',
            name: 'First Blood',
            description: 'Destroy your first enemy',
            icon: '🎯',
            unlocked: false,
            progress: 0,
            target: 1,
          },
        },
        recentUnlock: null,
      }

      const result = validateStoreData('achievements', data)

      expect(result.valid).toBe(true)
      expect(result.issues).toEqual([])
    })

    test('rejects non-object root', () => {
      const result = validateStoreData('achievements', 'invalid')

      expect(result.valid).toBe(false)
      expect(result.issues).toContain('Root must be an object')
    })

    test('rejects missing achievements field', () => {
      const result = validateStoreData('achievements', { recentUnlock: null })

      expect(result.valid).toBe(false)
      expect(result.issues).toContain('Missing "achievements" field')
    })

    test('rejects achievement with missing fields', () => {
      const data = {
        achievements: {
          test: {
            id: 'test',
            // Missing other required fields
          },
        },
      }

      const result = validateStoreData('achievements', data)

      expect(result.valid).toBe(false)
      expect(result.issues.length).toBeGreaterThan(0)
    })

    test('rejects achievement with invalid unlocked field', () => {
      const data = {
        achievements: {
          test: {
            id: 'test',
            name: 'Test',
            description: 'Test',
            icon: '🎯',
            unlocked: 'not a boolean',
          },
        },
      }

      const result = validateStoreData('achievements', data)

      expect(result.valid).toBe(false)
      expect(result.issues).toContain('Achievement "test" missing valid "unlocked" field')
    })

    test('rejects invalid recentUnlock', () => {
      const data = {
        achievements: {},
        recentUnlock: 123, // Should be string or null
      }

      const result = validateStoreData('achievements', data)

      expect(result.valid).toBe(false)
      expect(result.issues).toContain('"recentUnlock" must be a string or null')
    })
  })

  // ------------------------------------------------------------------ //
  //                         Statistics Validation Tests
  // ------------------------------------------------------------------ //
  describe('Statistics Validation', () => {
    test('validates valid statistics data', () => {
      const data = {
        stats: {
          totalGames: 10,
          totalScore: 5000,
          totalKills: 100,
          totalDeaths: 5,
          totalTimePlayed: 3600,
          totalShotsFired: 500,
          totalShotsHit: 250,
          totalPowerUpsCollected: 20,
          totalBossesDefeated: 2,
          highestScore: 1000,
          highestWave: 15,
          highestCombo: 10,
          longestSurvival: 1800,
          bestAccuracy: 50,
          lastPlayed: Date.now(),
          killsByEnemyType: {
            scout: 40,
            tank: 20,
            sniper: 20,
            bomber: 20,
          },
          killsByBossType: {
            destroyer: 1,
            carrier: 1,
            dreadnought: 0,
          },
          favoriteShip: 'fighter',
          favoriteTheme: 'neon-void',
        },
      }

      const result = validateStoreData('statistics', data)

      expect(result.valid).toBe(true)
      expect(result.issues).toEqual([])
    })

    test('rejects missing stats field', () => {
      const result = validateStoreData('statistics', {})

      expect(result.valid).toBe(false)
      expect(result.issues).toContain('Missing "stats" field')
    })

    test('rejects non-object stats', () => {
      const result = validateStoreData('statistics', { stats: 'invalid' })

      expect(result.valid).toBe(false)
      expect(result.issues).toContain('"stats" must be an object')
    })

    test('rejects missing required numeric fields', () => {
      const data = {
        stats: {
          totalGames: 10,
          // Missing other required fields
          killsByEnemyType: { scout: 0, tank: 0, sniper: 0, bomber: 0 },
          killsByBossType: { destroyer: 0, carrier: 0, dreadnought: 0 },
          favoriteShip: 'fighter',
          favoriteTheme: 'neon-void',
        },
      }

      const result = validateStoreData('statistics', data)

      expect(result.valid).toBe(false)
      expect(result.issues.length).toBeGreaterThan(0)
    })

    test('rejects negative numbers', () => {
      const data = {
        stats: {
          totalGames: -1,
          totalScore: 0,
          totalKills: 0,
          totalDeaths: 0,
          totalTimePlayed: 0,
          totalShotsFired: 0,
          totalShotsHit: 0,
          totalPowerUpsCollected: 0,
          totalBossesDefeated: 0,
          highestScore: 0,
          highestWave: 0,
          highestCombo: 0,
          longestSurvival: 0,
          bestAccuracy: 0,
          lastPlayed: 0,
          killsByEnemyType: { scout: 0, tank: 0, sniper: 0, bomber: 0 },
          killsByBossType: { destroyer: 0, carrier: 0, dreadnought: 0 },
          favoriteShip: 'fighter',
          favoriteTheme: 'neon-void',
        },
      }

      const result = validateStoreData('statistics', data)

      expect(result.valid).toBe(false)
      expect(result.issues).toContain('Stats "totalGames" must be a non-negative number')
    })

    test('rejects invalid favoriteShip', () => {
      const data = {
        stats: {
          totalGames: 0,
          totalScore: 0,
          totalKills: 0,
          totalDeaths: 0,
          totalTimePlayed: 0,
          totalShotsFired: 0,
          totalShotsHit: 0,
          totalPowerUpsCollected: 0,
          totalBossesDefeated: 0,
          highestScore: 0,
          highestWave: 0,
          highestCombo: 0,
          longestSurvival: 0,
          bestAccuracy: 0,
          lastPlayed: 0,
          killsByEnemyType: { scout: 0, tank: 0, sniper: 0, bomber: 0 },
          killsByBossType: { destroyer: 0, carrier: 0, dreadnought: 0 },
          favoriteShip: 'invalid-ship',
          favoriteTheme: 'neon-void',
        },
      }

      const result = validateStoreData('statistics', data)

      expect(result.valid).toBe(false)
      expect(result.issues).toContain('Stats "favoriteShip" has invalid value')
    })

    test('rejects incomplete killsByEnemyType', () => {
      const data = {
        stats: {
          totalGames: 0,
          totalScore: 0,
          totalKills: 0,
          totalDeaths: 0,
          totalTimePlayed: 0,
          totalShotsFired: 0,
          totalShotsHit: 0,
          totalPowerUpsCollected: 0,
          totalBossesDefeated: 0,
          highestScore: 0,
          highestWave: 0,
          highestCombo: 0,
          longestSurvival: 0,
          bestAccuracy: 0,
          lastPlayed: 0,
          killsByEnemyType: { scout: 0 }, // Missing other enemy types
          killsByBossType: { destroyer: 0, carrier: 0, dreadnought: 0 },
          favoriteShip: 'fighter',
          favoriteTheme: 'neon-void',
        },
      }

      const result = validateStoreData('statistics', data)

      expect(result.valid).toBe(false)
      expect(result.issues.some((issue) => issue.includes('killsByEnemyType'))).toBe(true)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Upgrades Validation Tests
  // ------------------------------------------------------------------ //
  describe('Upgrades Validation', () => {
    test('validates valid upgrades data', () => {
      const data = {
        upgrades: {
          damage: 2,
          fireRate: 3,
          bulletSize: 1,
          multiShot: 1,
          piercing: false,
        },
        credits: 1000,
        unlockedShips: ['fighter', 'scout'],
      }

      const result = validateStoreData('upgrades', data)

      expect(result.valid).toBe(true)
      expect(result.issues).toEqual([])
    })

    test('rejects upgrades with out-of-range values', () => {
      const data = {
        upgrades: {
          damage: 10, // Max is 5
          fireRate: 3,
          bulletSize: 1,
          multiShot: 1,
          piercing: false,
        },
        credits: 1000,
        unlockedShips: ['fighter'],
      }

      const result = validateStoreData('upgrades', data)

      expect(result.valid).toBe(false)
      expect(result.issues).toContain('Upgrades "damage" must be between 0 and 5')
    })

    test('rejects negative credits', () => {
      const data = {
        upgrades: {
          damage: 0,
          fireRate: 0,
          bulletSize: 0,
          multiShot: 0,
          piercing: false,
        },
        credits: -100,
        unlockedShips: ['fighter'],
      }

      const result = validateStoreData('upgrades', data)

      expect(result.valid).toBe(false)
      expect(result.issues).toContain('"credits" must be a non-negative number')
    })

    test('rejects invalid ship in unlockedShips', () => {
      const data = {
        upgrades: {
          damage: 0,
          fireRate: 0,
          bulletSize: 0,
          multiShot: 0,
          piercing: false,
        },
        credits: 1000,
        unlockedShips: ['fighter', 'invalid-ship'],
      }

      const result = validateStoreData('upgrades', data)

      expect(result.valid).toBe(false)
      expect(result.issues).toContain('Invalid ship in "unlockedShips": invalid-ship')
    })

    test('rejects unlockedShips without fighter', () => {
      const data = {
        upgrades: {
          damage: 0,
          fireRate: 0,
          bulletSize: 0,
          multiShot: 0,
          piercing: false,
        },
        credits: 1000,
        unlockedShips: ['scout'],
      }

      const result = validateStoreData('upgrades', data)

      expect(result.valid).toBe(false)
      expect(result.issues).toContain('"unlockedShips" must include "fighter"')
    })
  })

  // ------------------------------------------------------------------ //
  //                         Settings Validation Tests
  // ------------------------------------------------------------------ //
  describe('Settings Validation', () => {
    test('validates valid settings data', () => {
      const data = {
        language: 'en',
        joystickSize: 'medium',
        invertY: false,
      }

      const result = validateStoreData('settings', data)

      expect(result.valid).toBe(true)
      expect(result.issues).toEqual([])
    })

    test('rejects invalid language', () => {
      const data = {
        language: 'invalid',
        joystickSize: 'medium',
        invertY: false,
      }

      const result = validateStoreData('settings', data)

      expect(result.valid).toBe(false)
      expect(result.issues).toContain('"language" has invalid value')
    })

    test('rejects invalid joystickSize', () => {
      const data = {
        language: 'en',
        joystickSize: 'huge',
        invertY: false,
      }

      const result = validateStoreData('settings', data)

      expect(result.valid).toBe(false)
      expect(result.issues).toContain('"joystickSize" has invalid value')
    })

    test('rejects non-boolean invertY', () => {
      const data = {
        language: 'en',
        joystickSize: 'medium',
        invertY: 'yes',
      }

      const result = validateStoreData('settings', data)

      expect(result.valid).toBe(false)
      expect(result.issues).toContain('"invertY" must be a boolean')
    })

    test('rejects missing required fields', () => {
      const data = {
        language: 'en',
      }

      const result = validateStoreData('settings', data)

      expect(result.valid).toBe(false)
      expect(result.issues).toContain('Missing "joystickSize" field')
      expect(result.issues).toContain('Missing "invertY" field')
    })
  })

  // ------------------------------------------------------------------ //
  //                         High Scores Validation Tests
  // ------------------------------------------------------------------ //
  describe('High Scores Validation', () => {
    test('validates valid high scores data', () => {
      const data = {
        scores: [
          { name: 'Player 1', score: 1000, wave: 10, date: Date.now() },
          { name: 'Player 2', score: 500, wave: 5, date: Date.now() },
        ],
      }

      const result = validateStoreData('highScores', data)

      expect(result.valid).toBe(true)
      expect(result.issues).toEqual([])
    })

    test('rejects non-array scores', () => {
      const data = {
        scores: 'invalid',
      }

      const result = validateStoreData('highScores', data)

      expect(result.valid).toBe(false)
      expect(result.issues).toContain('"scores" must be an array')
    })

    test('rejects scores array with more than 5 entries', () => {
      const data = {
        scores: [
          { name: 'P1', score: 1000, wave: 10, date: Date.now() },
          { name: 'P2', score: 900, wave: 9, date: Date.now() },
          { name: 'P3', score: 800, wave: 8, date: Date.now() },
          { name: 'P4', score: 700, wave: 7, date: Date.now() },
          { name: 'P5', score: 600, wave: 6, date: Date.now() },
          { name: 'P6', score: 500, wave: 5, date: Date.now() },
        ],
      }

      const result = validateStoreData('highScores', data)

      expect(result.valid).toBe(false)
      expect(result.issues).toContain('"scores" array should not exceed 5 entries')
    })

    test('rejects score with missing fields', () => {
      const data = {
        scores: [{ name: 'Player 1' }],
      }

      const result = validateStoreData('highScores', data)

      expect(result.valid).toBe(false)
      expect(result.issues).toContain('Score at index 0 missing valid "score" field')
    })

    test('rejects unsorted scores', () => {
      const data = {
        scores: [
          { name: 'P1', score: 500, wave: 5, date: Date.now() },
          { name: 'P2', score: 1000, wave: 10, date: Date.now() }, // Higher score after lower
        ],
      }

      const result = validateStoreData('highScores', data)

      expect(result.valid).toBe(false)
      expect(result.issues).toContain('Scores array is not sorted in descending order')
    })
  })

  // ------------------------------------------------------------------ //
  //                         Health Check Tests
  // ------------------------------------------------------------------ //
  describe('Health Check Functions', () => {
    describe('checkStoreHealth', () => {
      test('returns healthy for valid store', async () => {
        const validData = {
          achievements: {},
          recentUnlock: null,
        }
        mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(validData))

        const result = await checkStoreHealth('achievements')

        expect(result.storeKey).toBe('achievements')
        expect(result.isValid).toBe(true)
        expect(result.issues).toEqual([])
        expect(result.canRecover).toBe(true)
      })

      test('returns healthy for non-existent store', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce(null)

        const result = await checkStoreHealth('achievements')

        expect(result.storeKey).toBe('achievements')
        expect(result.isValid).toBe(true)
        expect(result.issues).toEqual([])
        expect(result.canRecover).toBe(true)
      })

      test('detects JSON parse error', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce('invalid json')

        const result = await checkStoreHealth('achievements')

        expect(result.storeKey).toBe('achievements')
        expect(result.isValid).toBe(false)
        expect(result.issues).toContain('Failed to parse JSON')
        expect(result.canRecover).toBe(true)
      })

      test('detects validation errors', async () => {
        const invalidData = { invalid: 'data' }
        mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(invalidData))

        const result = await checkStoreHealth('achievements')

        expect(result.storeKey).toBe('achievements')
        expect(result.isValid).toBe(false)
        expect(result.issues.length).toBeGreaterThan(0)
        expect(result.canRecover).toBe(true)
      })

      test('detects storage access errors', async () => {
        mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'))

        const result = await checkStoreHealth('achievements')

        expect(result.storeKey).toBe('achievements')
        expect(result.isValid).toBe(false)
        expect(result.issues[0]).toContain('Storage access error')
        expect(result.canRecover).toBe(false)
      })
    })

    describe('checkStorageHealth', () => {
      test('returns healthy report when all stores are valid', async () => {
        mockAsyncStorage.getItem.mockImplementation(async (key) => {
          if (key === STORAGE_KEYS.achievements) {
            return JSON.stringify({ achievements: {}, recentUnlock: null })
          }
          if (key === STORAGE_KEYS.statistics) {
            return JSON.stringify({
              stats: {
                totalGames: 0,
                totalScore: 0,
                totalKills: 0,
                totalDeaths: 0,
                totalTimePlayed: 0,
                totalShotsFired: 0,
                totalShotsHit: 0,
                totalPowerUpsCollected: 0,
                totalBossesDefeated: 0,
                highestScore: 0,
                highestWave: 0,
                highestCombo: 0,
                longestSurvival: 0,
                bestAccuracy: 0,
                lastPlayed: 0,
                killsByEnemyType: { scout: 0, tank: 0, sniper: 0, bomber: 0 },
                killsByBossType: { destroyer: 0, carrier: 0, dreadnought: 0 },
                favoriteShip: 'fighter',
                favoriteTheme: 'neon-void',
              },
            })
          }
          if (key === STORAGE_KEYS.upgrades) {
            return JSON.stringify({
              upgrades: { damage: 0, fireRate: 0, bulletSize: 0, multiShot: 0, piercing: false },
              credits: 0,
              unlockedShips: ['fighter'],
            })
          }
          if (key === STORAGE_KEYS.settings) {
            return JSON.stringify({ language: 'en', joystickSize: 'medium', invertY: false })
          }
          if (key === STORAGE_KEYS.highScores) {
            return JSON.stringify({ scores: [] })
          }
          return null
        })

        const result = await checkStorageHealth()

        expect(result.overallHealth).toBe('healthy')
        expect(result.corruptedStores).toEqual([])
        expect(result.recoverableStores).toEqual([])
      })

      test('returns degraded when some stores are corrupted', async () => {
        mockAsyncStorage.getItem.mockImplementation(async (key) => {
          if (key === STORAGE_KEYS.achievements) {
            return 'invalid json'
          }
          if (key === STORAGE_KEYS.statistics) {
            return JSON.stringify({
              stats: {
                totalGames: 0,
                totalScore: 0,
                totalKills: 0,
                totalDeaths: 0,
                totalTimePlayed: 0,
                totalShotsFired: 0,
                totalShotsHit: 0,
                totalPowerUpsCollected: 0,
                totalBossesDefeated: 0,
                highestScore: 0,
                highestWave: 0,
                highestCombo: 0,
                longestSurvival: 0,
                bestAccuracy: 0,
                lastPlayed: 0,
                killsByEnemyType: { scout: 0, tank: 0, sniper: 0, bomber: 0 },
                killsByBossType: { destroyer: 0, carrier: 0, dreadnought: 0 },
                favoriteShip: 'fighter',
                favoriteTheme: 'neon-void',
              },
            })
          }
          if (key === STORAGE_KEYS.upgrades) {
            return JSON.stringify({
              upgrades: { damage: 0, fireRate: 0, bulletSize: 0, multiShot: 0, piercing: false },
              credits: 0,
              unlockedShips: ['fighter'],
            })
          }
          if (key === STORAGE_KEYS.settings) {
            return JSON.stringify({ language: 'en', joystickSize: 'medium', invertY: false })
          }
          if (key === STORAGE_KEYS.highScores) {
            return JSON.stringify({ scores: [] })
          }
          return null
        })

        const result = await checkStorageHealth()

        expect(result.overallHealth).toBe('degraded')
        expect(result.corruptedStores).toContain('achievements')
        expect(result.recoverableStores).toContain('achievements')
      })

      test('returns critical when all stores are corrupted', async () => {
        mockAsyncStorage.getItem.mockResolvedValue('invalid json')

        const result = await checkStorageHealth()

        expect(result.overallHealth).toBe('critical')
        expect(result.corruptedStores).toHaveLength(5)
        expect(result.recoverableStores).toHaveLength(5)
      })
    })

    describe('hasCorruptedStores', () => {
      test('returns false when all stores are valid', async () => {
        mockAsyncStorage.getItem.mockResolvedValue(null)

        const result = await hasCorruptedStores()

        expect(result).toBe(false)
      })

      test('returns true when any store is corrupted', async () => {
        mockAsyncStorage.getItem.mockImplementation(async (key) => {
          if (key === STORAGE_KEYS.achievements) {
            return 'invalid json'
          }
          return null
        })

        const result = await hasCorruptedStores()

        expect(result).toBe(true)
      })

      test('returns true on storage error', async () => {
        mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'))

        const result = await hasCorruptedStores()

        expect(result).toBe(true)
      })
    })

    describe('getCorruptedStores', () => {
      test('returns empty array when no stores are corrupted', async () => {
        mockAsyncStorage.getItem.mockResolvedValue(null)

        const result = await getCorruptedStores()

        expect(result).toEqual([])
      })

      test('returns list of corrupted stores', async () => {
        mockAsyncStorage.getItem.mockImplementation(async (key) => {
          if (key === STORAGE_KEYS.achievements || key === STORAGE_KEYS.statistics) {
            return 'invalid json'
          }
          return null
        })

        const result = await getCorruptedStores()

        expect(result).toContain('achievements')
        expect(result).toContain('statistics')
      })
    })
  })
})
