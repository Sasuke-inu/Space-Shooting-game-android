/**
 * Data Recovery Integration Tests
 * Tests full backup/restore cycle across all stores
 */

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

// Mock storageHealth module
jest.mock('../utils/storageHealth', () => ({
  checkStoreHealth: jest.fn(),
  checkStorageHealth: jest.fn(),
  getCorruptedStores: jest.fn(),
  validateStoreData: jest.fn(),
}))

import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  backupAllStores,
  restoreAllStores,
  autoRecoverFromCorruption,
  getBackupMetadata,
  STORAGE_KEYS,
  BACKUP_KEYS,
} from '../utils/backupManager'
import { checkStoreHealth, getCorruptedStores } from '../utils/storageHealth'
import type { StorageKey } from '../utils/backupManager'

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>
const mockCheckStoreHealth = checkStoreHealth as jest.MockedFunction<typeof checkStoreHealth>
const mockGetCorruptedStores = getCorruptedStores as jest.MockedFunction<typeof getCorruptedStores>

describe('Data Recovery Integration Tests', () => {
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
  //                    Full Backup/Restore Cycle Tests
  // ------------------------------------------------------------------ //
  describe('Full Backup/Restore Cycle', () => {
    test('successfully backs up and restores all stores', async () => {
      // Setup: Create sample data for all stores
      const sampleData = {
        achievements: JSON.stringify({
          achievements: {
            first_blood: {
              id: 'first_blood',
              name: 'First Blood',
              description: 'Destroy your first enemy',
              icon: '🎯',
              unlocked: true,
              progress: 1,
              unlockedAt: Date.now(),
            },
          },
          recentUnlock: null,
        }),
        statistics: JSON.stringify({
          stats: {
            totalGames: 5,
            totalScore: 10000,
            totalKills: 100,
            totalDeaths: 5,
            totalTimePlayed: 3600,
            totalShotsFired: 500,
            totalShotsHit: 250,
            totalPowerUpsCollected: 20,
            totalBossesDefeated: 2,
            highestScore: 3000,
            highestWave: 15,
            highestCombo: 10,
            longestSurvival: 1200,
            bestAccuracy: 75,
            killsByEnemyType: { scout: 50, tank: 20, sniper: 15, bomber: 15 },
            killsByBossType: { destroyer: 1, carrier: 1, dreadnought: 0 },
            favoriteShip: 'fighter',
            favoriteTheme: 'neon-void',
            lastPlayed: Date.now(),
          },
        }),
        upgrades: JSON.stringify({
          upgrades: {
            damage: 2,
            fireRate: 1,
            bulletSize: 0,
            multiShot: 1,
            piercing: false,
          },
          credits: 1000,
          unlockedShips: ['fighter', 'scout'],
        }),
        settings: JSON.stringify({
          language: 'en',
          joystickSize: 'medium',
          invertY: false,
        }),
        highScores: JSON.stringify({
          scores: [
            { name: 'Player1', score: 5000, wave: 20, date: Date.now() },
            { name: 'Player2', score: 3000, wave: 15, date: Date.now() - 1000 },
          ],
        }),
      }

      // Mock getItem to return sample data from STORAGE_KEYS
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === STORAGE_KEYS.achievements) return Promise.resolve(sampleData.achievements)
        if (key === STORAGE_KEYS.statistics) return Promise.resolve(sampleData.statistics)
        if (key === STORAGE_KEYS.upgrades) return Promise.resolve(sampleData.upgrades)
        if (key === STORAGE_KEYS.settings) return Promise.resolve(sampleData.settings)
        if (key === STORAGE_KEYS.highScores) return Promise.resolve(sampleData.highScores)
        return Promise.resolve(null)
      })

      mockAsyncStorage.setItem.mockResolvedValue()

      // Step 1: Backup all stores
      const backupResult = await backupAllStores()

      expect(backupResult).not.toBeNull()
      expect(backupResult?.stores).toHaveLength(5)
      expect(backupResult?.version).toBe('1.0.0')

      // Verify all stores were backed up
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        BACKUP_KEYS.achievements,
        sampleData.achievements
      )
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        BACKUP_KEYS.statistics,
        sampleData.statistics
      )
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        BACKUP_KEYS.upgrades,
        sampleData.upgrades
      )
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        BACKUP_KEYS.settings,
        sampleData.settings
      )
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        BACKUP_KEYS.highScores,
        sampleData.highScores
      )

      // Reset mocks for restore phase
      jest.clearAllMocks()

      // Mock getItem to return backup data from BACKUP_KEYS
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === BACKUP_KEYS.achievements) return Promise.resolve(sampleData.achievements)
        if (key === BACKUP_KEYS.statistics) return Promise.resolve(sampleData.statistics)
        if (key === BACKUP_KEYS.upgrades) return Promise.resolve(sampleData.upgrades)
        if (key === BACKUP_KEYS.settings) return Promise.resolve(sampleData.settings)
        if (key === BACKUP_KEYS.highScores) return Promise.resolve(sampleData.highScores)
        return Promise.resolve(null)
      })

      // Step 2: Restore all stores
      const restoreResult = await restoreAllStores()

      expect(restoreResult).toHaveLength(5)
      expect(restoreResult).toContain('achievements')
      expect(restoreResult).toContain('statistics')
      expect(restoreResult).toContain('upgrades')
      expect(restoreResult).toContain('settings')
      expect(restoreResult).toContain('highScores')

      // Verify all stores were restored
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.achievements,
        sampleData.achievements
      )
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.statistics,
        sampleData.statistics
      )
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.upgrades,
        sampleData.upgrades
      )
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.settings,
        sampleData.settings
      )
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.highScores,
        sampleData.highScores
      )
    })

    test('handles partial backup when some stores are empty', async () => {
      // Only achievements and statistics have data
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === STORAGE_KEYS.achievements) {
          return Promise.resolve(JSON.stringify({ achievements: {}, recentUnlock: null }))
        }
        if (key === STORAGE_KEYS.statistics) {
          return Promise.resolve(JSON.stringify({ stats: { totalGames: 0 } }))
        }
        return Promise.resolve(null)
      })

      mockAsyncStorage.setItem.mockResolvedValue()

      const backupResult = await backupAllStores()

      expect(backupResult).not.toBeNull()
      expect(backupResult?.stores).toHaveLength(2)
      expect(backupResult?.stores).toContain('achievements')
      expect(backupResult?.stores).toContain('statistics')
    })

    test('restores only stores that have backups', async () => {
      // Only achievements and upgrades have backups
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === BACKUP_KEYS.achievements) {
          return Promise.resolve(JSON.stringify({ achievements: {}, recentUnlock: null }))
        }
        if (key === BACKUP_KEYS.upgrades) {
          return Promise.resolve(
            JSON.stringify({ upgrades: {}, credits: 0, unlockedShips: ['fighter'] })
          )
        }
        return Promise.resolve(null)
      })

      mockAsyncStorage.setItem.mockResolvedValue()

      const restoreResult = await restoreAllStores()

      expect(restoreResult).toHaveLength(2)
      expect(restoreResult).toContain('achievements')
      expect(restoreResult).toContain('upgrades')
      expect(restoreResult).not.toContain('statistics')
      expect(restoreResult).not.toContain('settings')
      expect(restoreResult).not.toContain('highScores')
    })

    test('validates JSON before restoring', async () => {
      // Mock backup with invalid JSON
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === BACKUP_KEYS.achievements) {
          return Promise.resolve('invalid json {')
        }
        return Promise.resolve(null)
      })

      const restoreResult = await restoreAllStores()

      expect(restoreResult).toHaveLength(0)
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled()
    })
  })

  // ------------------------------------------------------------------ //
  //                    Data Integrity Tests
  // ------------------------------------------------------------------ //
  describe('Data Integrity After Restore', () => {
    test('preserves all data fields correctly', async () => {
      const originalData = {
        achievements: {
          first_blood: {
            id: 'first_blood',
            name: 'First Blood',
            description: 'Destroy your first enemy',
            icon: '🎯',
            unlocked: true,
            progress: 1,
            target: 1,
            unlockedAt: 1234567890,
          },
        },
        recentUnlock: 'first_blood',
      }

      const dataString = JSON.stringify(originalData)

      // Backup phase
      mockAsyncStorage.getItem.mockResolvedValueOnce(dataString)
      mockAsyncStorage.setItem.mockResolvedValue()

      const backupResult = await backupAllStores()
      expect(backupResult).not.toBeNull()

      // Get the data that was backed up
      const backupCall = mockAsyncStorage.setItem.mock.calls.find(
        (call) => call[0] === BACKUP_KEYS.achievements
      )
      expect(backupCall).toBeDefined()
      const backedUpData = backupCall![1]

      // Restore phase
      jest.clearAllMocks()
      mockAsyncStorage.getItem.mockResolvedValueOnce(backedUpData)
      mockAsyncStorage.setItem.mockResolvedValue()

      await restoreAllStores()

      // Verify restored data matches original
      const restoreCall = mockAsyncStorage.setItem.mock.calls.find(
        (call) => call[0] === STORAGE_KEYS.achievements
      )
      expect(restoreCall).toBeDefined()
      const restoredData = JSON.parse(restoreCall![1])

      expect(restoredData).toEqual(originalData)
      expect(restoredData.achievements.first_blood.unlocked).toBe(true)
      expect(restoredData.achievements.first_blood.unlockedAt).toBe(1234567890)
      expect(restoredData.recentUnlock).toBe('first_blood')
    })

    test('preserves numeric precision in statistics', async () => {
      const statsData = {
        stats: {
          totalGames: 42,
          totalScore: 123456,
          totalKills: 9999,
          totalDeaths: 10,
          totalTimePlayed: 7200,
          totalShotsFired: 50000,
          totalShotsHit: 25000,
          totalPowerUpsCollected: 150,
          totalBossesDefeated: 5,
          highestScore: 50000,
          highestWave: 25,
          highestCombo: 15,
          longestSurvival: 3600,
          bestAccuracy: 87.5,
          killsByEnemyType: { scout: 5000, tank: 2000, sniper: 1500, bomber: 1499 },
          killsByBossType: { destroyer: 2, carrier: 2, dreadnought: 1 },
          favoriteShip: 'scout',
          favoriteTheme: 'sakura',
          lastPlayed: 1234567890123,
        },
      }

      const dataString = JSON.stringify(statsData)

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === STORAGE_KEYS.statistics) return Promise.resolve(dataString)
        return Promise.resolve(null)
      })
      mockAsyncStorage.setItem.mockResolvedValue()
      await backupAllStores()

      const backupCall = mockAsyncStorage.setItem.mock.calls.find(
        (call) => call[0] === BACKUP_KEYS.statistics
      )
      const backedUpData = backupCall![1]

      jest.clearAllMocks()
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === BACKUP_KEYS.statistics) return Promise.resolve(backedUpData)
        return Promise.resolve(null)
      })
      mockAsyncStorage.setItem.mockResolvedValue()
      await restoreAllStores()

      const restoreCall = mockAsyncStorage.setItem.mock.calls.find(
        (call) => call[0] === STORAGE_KEYS.statistics
      )
      const restoredData = JSON.parse(restoreCall![1])

      expect(restoredData.stats.bestAccuracy).toBe(87.5)
      expect(restoredData.stats.totalGames).toBe(42)
      expect(restoredData.stats.lastPlayed).toBe(1234567890123)
      expect(restoredData.stats.killsByEnemyType.bomber).toBe(1499)
    })

    test('preserves array order in upgrades', async () => {
      const upgradesData = {
        upgrades: { damage: 3, fireRate: 2, bulletSize: 1, multiShot: 2, piercing: true },
        credits: 5000,
        unlockedShips: ['fighter', 'scout', 'tank', 'interceptor'],
      }

      const dataString = JSON.stringify(upgradesData)

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === STORAGE_KEYS.upgrades) return Promise.resolve(dataString)
        return Promise.resolve(null)
      })
      mockAsyncStorage.setItem.mockResolvedValue()
      await backupAllStores()

      const backupCall = mockAsyncStorage.setItem.mock.calls.find(
        (call) => call[0] === BACKUP_KEYS.upgrades
      )
      const backedUpData = backupCall![1]

      jest.clearAllMocks()
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === BACKUP_KEYS.upgrades) return Promise.resolve(backedUpData)
        return Promise.resolve(null)
      })
      mockAsyncStorage.setItem.mockResolvedValue()
      await restoreAllStores()

      const restoreCall = mockAsyncStorage.setItem.mock.calls.find(
        (call) => call[0] === STORAGE_KEYS.upgrades
      )
      const restoredData = JSON.parse(restoreCall![1])

      expect(restoredData.unlockedShips).toEqual(['fighter', 'scout', 'tank', 'interceptor'])
      expect(restoredData.credits).toBe(5000)
      expect(restoredData.upgrades.piercing).toBe(true)
    })
  })

  // ------------------------------------------------------------------ //
  //                    Corruption Recovery Tests
  // ------------------------------------------------------------------ //
  describe('Corruption Recovery', () => {
    test('recovers all corrupted stores from backups', async () => {
      const backupData = JSON.stringify({ achievements: {}, recentUnlock: null })

      mockGetCorruptedStores.mockResolvedValueOnce(['achievements', 'statistics'])

      mockCheckStoreHealth.mockImplementation((storeKey) => {
        if (storeKey === 'achievements' || storeKey === 'statistics') {
          return Promise.resolve({
            storeKey,
            isValid: false,
            issues: ['Corrupted data'],
            canRecover: true,
          })
        }
        return Promise.resolve({
          storeKey,
          isValid: true,
          issues: [],
          canRecover: true,
        })
      })

      mockAsyncStorage.getItem.mockResolvedValue(backupData)
      mockAsyncStorage.setItem.mockResolvedValue()

      const result = await autoRecoverFromCorruption()

      expect(result.hadCorruption).toBe(true)
      expect(result.recovered).toHaveLength(2)
      expect(result.recovered).toContain('achievements')
      expect(result.recovered).toContain('statistics')
      expect(result.failed).toHaveLength(0)
    })

    test('resets stores when backups are unavailable', async () => {
      mockGetCorruptedStores.mockResolvedValueOnce(['achievements'])

      mockCheckStoreHealth.mockResolvedValueOnce({
        storeKey: 'achievements',
        isValid: false,
        issues: ['Corrupted data'],
        canRecover: true,
      })

      mockAsyncStorage.getItem.mockResolvedValue(null)
      mockAsyncStorage.removeItem.mockResolvedValue()

      const result = await autoRecoverFromCorruption()

      expect(result.hadCorruption).toBe(true)
      expect(result.recovered).toContain('achievements')
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.achievements)
    })

    test('reports failed recovery for non-recoverable stores', async () => {
      mockGetCorruptedStores.mockResolvedValueOnce(['achievements'])

      mockCheckStoreHealth.mockResolvedValueOnce({
        storeKey: 'achievements',
        isValid: false,
        issues: ['Critical error'],
        canRecover: false,
      })

      const result = await autoRecoverFromCorruption()

      expect(result.hadCorruption).toBe(true)
      expect(result.failed).toContain('achievements')
      expect(result.recovered).not.toContain('achievements')
    })

    test('handles mixed recovery scenarios', async () => {
      mockGetCorruptedStores.mockResolvedValueOnce(['achievements', 'statistics', 'upgrades'])

      mockCheckStoreHealth.mockImplementation((storeKey) => {
        if (storeKey === 'achievements') {
          // Recoverable with backup
          return Promise.resolve({
            storeKey,
            isValid: false,
            issues: ['Corrupted'],
            canRecover: true,
          })
        }
        if (storeKey === 'statistics') {
          // Recoverable without backup (reset)
          return Promise.resolve({
            storeKey,
            isValid: false,
            issues: ['Corrupted'],
            canRecover: true,
          })
        }
        if (storeKey === 'upgrades') {
          // Not recoverable
          return Promise.resolve({
            storeKey,
            isValid: false,
            issues: ['Critical'],
            canRecover: false,
          })
        }
        return Promise.resolve({
          storeKey,
          isValid: true,
          issues: [],
          canRecover: true,
        })
      })

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === BACKUP_KEYS.achievements) {
          return Promise.resolve(JSON.stringify({ achievements: {}, recentUnlock: null }))
        }
        return Promise.resolve(null)
      })

      mockAsyncStorage.setItem.mockResolvedValue()
      mockAsyncStorage.removeItem.mockResolvedValue()

      const result = await autoRecoverFromCorruption()

      expect(result.hadCorruption).toBe(true)
      expect(result.recovered).toHaveLength(2)
      expect(result.recovered).toContain('achievements')
      expect(result.recovered).toContain('statistics')
      expect(result.failed).toHaveLength(1)
      expect(result.failed).toContain('upgrades')
    })
  })

  // ------------------------------------------------------------------ //
  //                    Backup Metadata Tests
  // ------------------------------------------------------------------ //
  describe('Backup Metadata', () => {
    test('creates metadata with correct version and timestamp', async () => {
      const beforeBackup = Date.now()

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify({ data: 'test' }))
      mockAsyncStorage.setItem.mockResolvedValue()

      const result = await backupAllStores()

      const afterBackup = Date.now()

      expect(result).not.toBeNull()
      expect(result?.version).toBe('1.0.0')
      expect(result?.timestamp).toBeGreaterThanOrEqual(beforeBackup)
      expect(result?.timestamp).toBeLessThanOrEqual(afterBackup)
    })

    test('retrieves backup metadata correctly', async () => {
      const metadata = {
        timestamp: 1234567890,
        version: '1.0.0',
        stores: ['achievements', 'statistics'] as StorageKey[],
      }

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(metadata))

      const result = await getBackupMetadata()

      expect(result).toEqual(metadata)
      expect(result?.stores).toHaveLength(2)
    })

    test('handles missing metadata gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null)

      const result = await getBackupMetadata()

      expect(result).toBeNull()
    })

    test('handles corrupted metadata gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce('invalid json {')

      const result = await getBackupMetadata()

      expect(result).toBeNull()
    })
  })

  // ------------------------------------------------------------------ //
  //                    Edge Cases and Error Handling
  // ------------------------------------------------------------------ //
  describe('Edge Cases and Error Handling', () => {
    test('handles storage errors during backup', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage unavailable'))

      const result = await backupAllStores()

      expect(result).toBeNull()
    })

    test('handles storage errors during restore', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage unavailable'))

      const result = await restoreAllStores()

      expect(result).toEqual([])
    })

    test('continues restore even if one store fails', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === BACKUP_KEYS.achievements) {
          return Promise.reject(new Error('Read error'))
        }
        return Promise.resolve(JSON.stringify({ data: 'test' }))
      })

      mockAsyncStorage.setItem.mockResolvedValue()

      const result = await restoreAllStores()

      expect(result.length).toBeGreaterThan(0)
      expect(result).not.toContain('achievements')
    })

    test('handles concurrent backup/restore operations', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify({ data: 'test' }))
      mockAsyncStorage.setItem.mockResolvedValue()

      const backupPromise = backupAllStores()
      const restorePromise = restoreAllStores()

      const [backupResult, restoreResult] = await Promise.all([backupPromise, restorePromise])

      expect(backupResult).not.toBeNull()
      expect(restoreResult).toBeInstanceOf(Array)
    })

    test('handles empty store gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null)

      const backupResult = await backupAllStores()

      expect(backupResult).toBeNull()
    })

    test('handles very large data sets', async () => {
      const largeData = {
        achievements: {} as Record<string, any>,
        recentUnlock: null,
      }

      // Create 1000 achievements
      for (let i = 0; i < 1000; i++) {
        largeData.achievements[`achievement_${i}`] = {
          id: `achievement_${i}`,
          name: `Achievement ${i}`,
          description: `Description for achievement ${i}`,
          icon: '🏆',
          unlocked: i % 2 === 0,
          progress: i,
          target: i + 100,
          unlockedAt: i % 2 === 0 ? Date.now() : undefined,
        }
      }

      const dataString = JSON.stringify(largeData)

      mockAsyncStorage.getItem.mockResolvedValue(dataString)
      mockAsyncStorage.setItem.mockResolvedValue()

      const backupResult = await backupAllStores()
      expect(backupResult).not.toBeNull()

      jest.clearAllMocks()
      mockAsyncStorage.getItem.mockResolvedValue(dataString)
      mockAsyncStorage.setItem.mockResolvedValue()

      const restoreResult = await restoreAllStores()
      expect(restoreResult.length).toBeGreaterThan(0)
    })
  })

  // ------------------------------------------------------------------ //
  //                    Complete Recovery Workflow
  // ------------------------------------------------------------------ //
  describe('Complete Recovery Workflow', () => {
    test('simulates full app lifecycle with backup and recovery', async () => {
      // Step 1: Initial state with data
      const initialData = {
        achievements: JSON.stringify({ achievements: {}, recentUnlock: null }),
        statistics: JSON.stringify({ stats: { totalGames: 10 } }),
        upgrades: JSON.stringify({ upgrades: {}, credits: 500, unlockedShips: ['fighter'] }),
      }

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === STORAGE_KEYS.achievements) return Promise.resolve(initialData.achievements)
        if (key === STORAGE_KEYS.statistics) return Promise.resolve(initialData.statistics)
        if (key === STORAGE_KEYS.upgrades) return Promise.resolve(initialData.upgrades)
        return Promise.resolve(null)
      })

      mockAsyncStorage.setItem.mockResolvedValue()

      // Step 2: Create backup
      const backupResult = await backupAllStores()
      expect(backupResult).not.toBeNull()
      expect(backupResult?.stores).toHaveLength(3)

      // Step 3: Simulate corruption
      mockGetCorruptedStores.mockResolvedValueOnce(['statistics'])
      mockCheckStoreHealth.mockResolvedValueOnce({
        storeKey: 'statistics',
        isValid: false,
        issues: ['Parse error'],
        canRecover: true,
      })

      // Setup backup data for recovery
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === BACKUP_KEYS.statistics) return Promise.resolve(initialData.statistics)
        return Promise.resolve(null)
      })

      // Step 4: Auto-recover
      const recoveryResult = await autoRecoverFromCorruption()

      expect(recoveryResult.hadCorruption).toBe(true)
      expect(recoveryResult.recovered).toContain('statistics')
      expect(recoveryResult.failed).toHaveLength(0)

      // Step 5: Verify data integrity after recovery
      const restoreCall = mockAsyncStorage.setItem.mock.calls.find(
        (call) => call[0] === STORAGE_KEYS.statistics
      )
      expect(restoreCall).toBeDefined()

      const restoredData = JSON.parse(restoreCall![1])
      expect(restoredData.stats.totalGames).toBe(10)
    })

    test('handles catastrophic failure with all stores corrupted', async () => {
      mockGetCorruptedStores.mockResolvedValueOnce([
        'achievements',
        'statistics',
        'upgrades',
        'settings',
        'highScores',
      ])

      mockCheckStoreHealth.mockImplementation((storeKey) =>
        Promise.resolve({
          storeKey,
          isValid: false,
          issues: ['Corrupted'],
          canRecover: true,
        })
      )

      // No backups available
      mockAsyncStorage.getItem.mockResolvedValue(null)
      mockAsyncStorage.removeItem.mockResolvedValue()

      const result = await autoRecoverFromCorruption()

      expect(result.hadCorruption).toBe(true)
      expect(result.recovered).toHaveLength(5)
      expect(result.failed).toHaveLength(0)

      // All stores should be reset
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledTimes(5)
    })

    test('handles partial recovery with some backups available', async () => {
      mockGetCorruptedStores.mockResolvedValueOnce(['achievements', 'statistics', 'upgrades'])

      mockCheckStoreHealth.mockImplementation((storeKey) =>
        Promise.resolve({
          storeKey,
          isValid: false,
          issues: ['Corrupted'],
          canRecover: true,
        })
      )

      // Only achievements and upgrades have backups
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === BACKUP_KEYS.achievements) {
          return Promise.resolve(JSON.stringify({ achievements: {}, recentUnlock: null }))
        }
        if (key === BACKUP_KEYS.upgrades) {
          return Promise.resolve(
            JSON.stringify({ upgrades: {}, credits: 1000, unlockedShips: ['fighter'] })
          )
        }
        return Promise.resolve(null)
      })

      mockAsyncStorage.setItem.mockResolvedValue()
      mockAsyncStorage.removeItem.mockResolvedValue()

      const result = await autoRecoverFromCorruption()

      expect(result.hadCorruption).toBe(true)
      expect(result.recovered).toHaveLength(3)

      // Two stores restored from backup
      const achievementsRestore = mockAsyncStorage.setItem.mock.calls.find(
        (call) => call[0] === STORAGE_KEYS.achievements
      )
      const upgradesRestore = mockAsyncStorage.setItem.mock.calls.find(
        (call) => call[0] === STORAGE_KEYS.upgrades
      )
      expect(achievementsRestore).toBeDefined()
      expect(upgradesRestore).toBeDefined()

      // One store reset
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.statistics)
    })
  })
})
