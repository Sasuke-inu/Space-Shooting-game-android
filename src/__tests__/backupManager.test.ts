/**
 * Backup Manager Unit Tests
 * Tests backup, restore, and recovery functionality
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
  getCorruptedStores: jest.fn(),
}))

import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  backupStore,
  backupAllStores,
  restoreStore,
  restoreAllStores,
  getBackupMetadata,
  hasBackup,
  hasAllBackups,
  clearBackup,
  clearAllBackups,
  recoverStore,
  recoverAllStores,
  autoRecoverFromCorruption,
  STORAGE_KEYS,
  BACKUP_KEYS,
} from '../utils/backupManager'
import { checkStoreHealth, getCorruptedStores } from '../utils/storageHealth'

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>
const mockCheckStoreHealth = checkStoreHealth as jest.MockedFunction<typeof checkStoreHealth>
const mockGetCorruptedStores = getCorruptedStores as jest.MockedFunction<typeof getCorruptedStores>

describe('backupManager', () => {
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
  //                         Backup Functions Tests
  // ------------------------------------------------------------------ //
  describe('Backup Functions', () => {
    describe('backupStore', () => {
      test('backs up store data successfully', async () => {
        const testData = JSON.stringify({ achievements: {} })
        mockAsyncStorage.getItem.mockResolvedValueOnce(testData)
        mockAsyncStorage.setItem.mockResolvedValueOnce()

        const result = await backupStore('achievements')

        expect(result).toBe(true)
        expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.achievements)
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(BACKUP_KEYS.achievements, testData)
      })

      test('returns false when no data exists', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce(null)

        const result = await backupStore('achievements')

        expect(result).toBe(false)
        expect(mockAsyncStorage.setItem).not.toHaveBeenCalled()
      })

      test('returns false on error', async () => {
        mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'))

        const result = await backupStore('achievements')

        expect(result).toBe(false)
      })
    })

    describe('backupAllStores', () => {
      test('backs up all stores with metadata', async () => {
        // Mock all stores have data
        mockAsyncStorage.getItem.mockImplementation((key) => {
          if (key.startsWith('space-shooter') || key.startsWith('app-settings') || key.startsWith('high-scores')) {
            return Promise.resolve(JSON.stringify({ data: 'test' }))
          }
          return Promise.resolve(null)
        })
        mockAsyncStorage.setItem.mockResolvedValue()

        const result = await backupAllStores()

        expect(result).not.toBeNull()
        expect(result?.stores).toHaveLength(5)
        expect(result?.version).toBe('1.0.0')
        expect(result?.timestamp).toBeGreaterThan(0)
      })

      test('returns null when no stores have data', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce(null)

        const result = await backupAllStores()

        expect(result).toBeNull()
      })

      test('saves backup metadata', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ data: 'test' }))
        mockAsyncStorage.setItem.mockResolvedValue()

        await backupAllStores()

        const metadataCall = mockAsyncStorage.setItem.mock.calls.find(
          (call) => call[0] === 'backup-metadata'
        )
        expect(metadataCall).toBeDefined()
        const metadata = JSON.parse(metadataCall![1])
        expect(metadata.version).toBe('1.0.0')
        expect(metadata.stores).toBeInstanceOf(Array)
      })

      test('returns null on error', async () => {
        mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'))

        const result = await backupAllStores()

        expect(result).toBeNull()
      })
    })
  })

  // ------------------------------------------------------------------ //
  //                         Restore Functions Tests
  // ------------------------------------------------------------------ //
  describe('Restore Functions', () => {
    describe('restoreStore', () => {
      test('restores store from backup successfully', async () => {
        const backupData = JSON.stringify({ achievements: {} })
        mockAsyncStorage.getItem.mockResolvedValueOnce(backupData)
        mockAsyncStorage.setItem.mockResolvedValueOnce()

        const result = await restoreStore('achievements')

        expect(result).toBe(true)
        expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(BACKUP_KEYS.achievements)
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.achievements, backupData)
      })

      test('returns false when no backup exists', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce(null)

        const result = await restoreStore('achievements')

        expect(result).toBe(false)
        expect(mockAsyncStorage.setItem).not.toHaveBeenCalled()
      })

      test('returns false when backup has invalid JSON', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce('invalid json')

        const result = await restoreStore('achievements')

        expect(result).toBe(false)
      })

      test('returns false on error', async () => {
        mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'))

        const result = await restoreStore('achievements')

        expect(result).toBe(false)
      })
    })

    describe('restoreAllStores', () => {
      test('restores all stores successfully', async () => {
        mockAsyncStorage.getItem.mockImplementation(() => Promise.resolve(JSON.stringify({ data: 'test' })))
        mockAsyncStorage.setItem.mockResolvedValue()

        const result = await restoreAllStores()

        expect(result).toHaveLength(5)
        expect(result).toContain('achievements')
        expect(result).toContain('statistics')
        expect(result).toContain('upgrades')
        expect(result).toContain('settings')
        expect(result).toContain('highScores')
      })

      test('skips stores without backups', async () => {
        mockAsyncStorage.getItem.mockImplementation((key) => {
          if (key === BACKUP_KEYS.achievements) {
            return Promise.resolve(JSON.stringify({ data: 'test' }))
          }
          return Promise.resolve(null)
        })

        const result = await restoreAllStores()

        expect(result).toHaveLength(1)
        expect(result).toContain('achievements')
      })

      test('returns empty array on error', async () => {
        mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'))

        const result = await restoreAllStores()

        expect(result).toEqual([])
      })
    })
  })

  // ------------------------------------------------------------------ //
  //                         Info Functions Tests
  // ------------------------------------------------------------------ //
  describe('Info Functions', () => {
    describe('getBackupMetadata', () => {
      test('returns backup metadata', async () => {
        const metadata = {
          timestamp: Date.now(),
          version: '1.0.0',
          stores: ['achievements', 'statistics'],
        }
        mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(metadata))

        const result = await getBackupMetadata()

        expect(result).toEqual(metadata)
      })

      test('returns null when no metadata exists', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce(null)

        const result = await getBackupMetadata()

        expect(result).toBeNull()
      })

      test('returns null on parse error', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce('invalid json')

        const result = await getBackupMetadata()

        expect(result).toBeNull()
      })
    })

    describe('hasBackup', () => {
      test('returns true when backup exists', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ data: 'test' }))

        const result = await hasBackup('achievements')

        expect(result).toBe(true)
        expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(BACKUP_KEYS.achievements)
      })

      test('returns false when backup does not exist', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce(null)

        const result = await hasBackup('achievements')

        expect(result).toBe(false)
      })

      test('returns false on error', async () => {
        mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'))

        const result = await hasBackup('achievements')

        expect(result).toBe(false)
      })
    })

    describe('hasAllBackups', () => {
      test('returns true when all backups exist', async () => {
        mockAsyncStorage.getItem.mockImplementation(() => Promise.resolve(JSON.stringify({ data: 'test' })))

        const result = await hasAllBackups()

        expect(result).toBe(true)
      })

      test('returns false when any backup is missing', async () => {
        mockAsyncStorage.getItem.mockImplementation((key) => {
          if (key === BACKUP_KEYS.achievements) {
            return Promise.resolve(null)
          }
          return Promise.resolve(JSON.stringify({ data: 'test' }))
        })

        const result = await hasAllBackups()

        expect(result).toBe(false)
      })

      test('returns false on error', async () => {
        mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'))

        const result = await hasAllBackups()

        expect(result).toBe(false)
      })
    })
  })

  // ------------------------------------------------------------------ //
  //                         Clear Functions Tests
  // ------------------------------------------------------------------ //
  describe('Clear Functions', () => {
    describe('clearBackup', () => {
      test('clears backup successfully', async () => {
        mockAsyncStorage.removeItem.mockResolvedValueOnce()

        const result = await clearBackup('achievements')

        expect(result).toBe(true)
        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(BACKUP_KEYS.achievements)
      })

      test('returns false on error', async () => {
        mockAsyncStorage.removeItem.mockRejectedValueOnce(new Error('Storage error'))

        const result = await clearBackup('achievements')

        expect(result).toBe(false)
      })
    })

    describe('clearAllBackups', () => {
      test('clears all backups and metadata', async () => {
        mockAsyncStorage.removeItem.mockResolvedValueOnce()

        const result = await clearAllBackups()

        expect(result).toBe(true)
        expect(mockAsyncStorage.removeItem).toHaveBeenCalledTimes(6) // 5 stores + metadata
        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('backup-metadata')
      })

      test('returns false on error', async () => {
        mockAsyncStorage.removeItem.mockRejectedValue(new Error('Storage error'))

        const result = await clearAllBackups()

        expect(result).toBe(false)
      })
    })
  })

  // ------------------------------------------------------------------ //
  //                         Recovery Functions Tests
  // ------------------------------------------------------------------ //
  describe('Recovery Functions', () => {
    describe('recoverStore', () => {
      test('returns none method when store is healthy', async () => {
        mockCheckStoreHealth.mockResolvedValueOnce({
          storeKey: 'achievements',
          isValid: true,
          issues: [],
          canRecover: true,
        })

        const result = await recoverStore('achievements')

        expect(result.storeKey).toBe('achievements')
        expect(result.recovered).toBe(false)
        expect(result.method).toBe('none')
      })

      test('recovers from backup when corrupted', async () => {
        mockCheckStoreHealth.mockResolvedValueOnce({
          storeKey: 'achievements',
          isValid: false,
          issues: ['Corrupted data'],
          canRecover: true,
        })
        // Mock getItem twice: once for hasBackup, once for restoreStore
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify({ data: 'backup' }))
        mockAsyncStorage.setItem.mockResolvedValueOnce()

        const result = await recoverStore('achievements')

        expect(result.storeKey).toBe('achievements')
        expect(result.recovered).toBe(true)
        expect(result.method).toBe('backup')
      })

      test('resets when corrupted and no backup exists', async () => {
        mockCheckStoreHealth.mockResolvedValueOnce({
          storeKey: 'achievements',
          isValid: false,
          issues: ['Corrupted data'],
          canRecover: true,
        })
        mockAsyncStorage.getItem.mockResolvedValueOnce(null)
        mockAsyncStorage.removeItem.mockResolvedValueOnce()

        const result = await recoverStore('achievements')

        expect(result.storeKey).toBe('achievements')
        expect(result.recovered).toBe(true)
        expect(result.method).toBe('reset')
        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.achievements)
      })

      test('returns error when store is not recoverable', async () => {
        mockCheckStoreHealth.mockResolvedValueOnce({
          storeKey: 'achievements',
          isValid: false,
          issues: ['Critical error'],
          canRecover: false,
        })

        const result = await recoverStore('achievements')

        expect(result.storeKey).toBe('achievements')
        expect(result.recovered).toBe(false)
        expect(result.method).toBe('none')
        expect(result.error).toBe('Store is not recoverable')
      })

      test('returns error on exception', async () => {
        mockCheckStoreHealth.mockRejectedValueOnce(new Error('Storage error'))

        const result = await recoverStore('achievements')

        expect(result.storeKey).toBe('achievements')
        expect(result.recovered).toBe(false)
        expect(result.method).toBe('none')
        expect(result.error).toBe('Storage error')
      })
    })

    describe('recoverAllStores', () => {
      test('returns empty array when no stores are corrupted', async () => {
        mockGetCorruptedStores.mockResolvedValueOnce([])

        const result = await recoverAllStores()

        expect(result).toEqual([])
      })

      test('recovers all corrupted stores', async () => {
        mockGetCorruptedStores.mockResolvedValueOnce(['achievements', 'statistics'])
        mockCheckStoreHealth.mockResolvedValue({
          storeKey: 'achievements',
          isValid: false,
          issues: ['Corrupted'],
          canRecover: true,
        })
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify({ data: 'backup' }))
        mockAsyncStorage.setItem.mockResolvedValue()

        const result = await recoverAllStores()

        expect(result).toHaveLength(2)
        expect(result[0].storeKey).toBe('achievements')
        expect(result[1].storeKey).toBe('statistics')
      })

      test('returns empty array on error', async () => {
        mockGetCorruptedStores.mockRejectedValueOnce(new Error('Storage error'))

        const result = await recoverAllStores()

        expect(result).toEqual([])
      })
    })

    describe('autoRecoverFromCorruption', () => {
      test('returns no corruption when all stores are healthy', async () => {
        mockGetCorruptedStores.mockResolvedValueOnce([])

        const result = await autoRecoverFromCorruption()

        expect(result.hadCorruption).toBe(false)
        expect(result.recovered).toEqual([])
        expect(result.failed).toEqual([])
      })

      test('returns recovered stores', async () => {
        mockGetCorruptedStores.mockResolvedValueOnce(['achievements'])
        mockCheckStoreHealth.mockResolvedValueOnce({
          storeKey: 'achievements',
          isValid: false,
          issues: ['Corrupted'],
          canRecover: true,
        })
        mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ data: 'backup' }))
        mockAsyncStorage.setItem.mockResolvedValueOnce()

        const result = await autoRecoverFromCorruption()

        expect(result.hadCorruption).toBe(true)
        expect(result.recovered).toContain('achievements')
        expect(result.failed).toEqual([])
      })

      test('returns failed stores', async () => {
        mockGetCorruptedStores.mockResolvedValueOnce(['achievements'])
        mockCheckStoreHealth.mockResolvedValueOnce({
          storeKey: 'achievements',
          isValid: false,
          issues: ['Critical error'],
          canRecover: false,
        })

        const result = await autoRecoverFromCorruption()

        expect(result.hadCorruption).toBe(true)
        expect(result.recovered).toEqual([])
        expect(result.failed).toContain('achievements')
      })

      test('returns no corruption on error', async () => {
        mockGetCorruptedStores.mockRejectedValueOnce(new Error('Storage error'))

        const result = await autoRecoverFromCorruption()

        expect(result.hadCorruption).toBe(false)
        expect(result.recovered).toEqual([])
        expect(result.failed).toEqual([])
      })
    })
  })
})
