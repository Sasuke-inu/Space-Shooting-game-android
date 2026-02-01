import AsyncStorage from '@react-native-async-storage/async-storage'

// ------------------------------------------------------------------ //
//                         Storage Keys
// ------------------------------------------------------------------ //

export const STORAGE_KEYS = {
  achievements: 'space-shooter-achievements',
  statistics: 'space-shooter-statistics',
  upgrades: 'space-shooter-upgrades',
  settings: 'app-settings-storage',
  highScores: 'high-scores-storage',
  weeklyEvents: 'weekly-events-storage',
} as const

export const BACKUP_KEYS = {
  achievements: 'backup-space-shooter-achievements',
  statistics: 'backup-space-shooter-statistics',
  upgrades: 'backup-space-shooter-upgrades',
  settings: 'backup-app-settings-storage',
  highScores: 'backup-high-scores-storage',
  weeklyEvents: 'backup-weekly-events-storage',
} as const

export type StorageKey = keyof typeof STORAGE_KEYS
export type BackupKey = keyof typeof BACKUP_KEYS

// ------------------------------------------------------------------ //
//                         Backup Metadata
// ------------------------------------------------------------------ //

export interface BackupMetadata {
  timestamp: number
  version: string
  stores: StorageKey[]
}

const BACKUP_METADATA_KEY = 'backup-metadata'
const BACKUP_VERSION = '1.0.0'

// ------------------------------------------------------------------ //
//                         Backup Functions
// ------------------------------------------------------------------ //

/**
 * Creates a snapshot of a single store's data to its backup key
 */
export async function backupStore(storeKey: StorageKey): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS[storeKey])
    if (data === null) {
      // No data to backup
      return false
    }

    const backupKey = BACKUP_KEYS[storeKey]
    await AsyncStorage.setItem(backupKey, data)
    return true
  } catch (error) {
    console.error(`Failed to backup store ${storeKey}:`, error)
    return false
  }
}

/**
 * Creates snapshots of all stores to their backup keys
 */
export async function backupAllStores(): Promise<BackupMetadata | null> {
  try {
    const storeKeys = Object.keys(STORAGE_KEYS) as StorageKey[]
    const backedUp: StorageKey[] = []

    for (const storeKey of storeKeys) {
      const success = await backupStore(storeKey)
      if (success) {
        backedUp.push(storeKey)
      }
    }

    if (backedUp.length === 0) {
      return null
    }

    const metadata: BackupMetadata = {
      timestamp: Date.now(),
      version: BACKUP_VERSION,
      stores: backedUp,
    }

    await AsyncStorage.setItem(BACKUP_METADATA_KEY, JSON.stringify(metadata))
    return metadata
  } catch (error) {
    console.error('Failed to backup all stores:', error)
    return null
  }
}

// ------------------------------------------------------------------ //
//                         Restore Functions
// ------------------------------------------------------------------ //

/**
 * Restores a single store from its backup
 */
export async function restoreStore(storeKey: StorageKey): Promise<boolean> {
  try {
    const backupKey = BACKUP_KEYS[storeKey]
    const backupData = await AsyncStorage.getItem(backupKey)

    if (backupData === null) {
      // No backup available
      return false
    }

    // Validate JSON before restoring
    JSON.parse(backupData)

    await AsyncStorage.setItem(STORAGE_KEYS[storeKey], backupData)
    return true
  } catch (error) {
    console.error(`Failed to restore store ${storeKey}:`, error)
    return false
  }
}

/**
 * Restores all stores from their backups
 */
export async function restoreAllStores(): Promise<StorageKey[]> {
  try {
    const storeKeys = Object.keys(STORAGE_KEYS) as StorageKey[]
    const restored: StorageKey[] = []

    for (const storeKey of storeKeys) {
      const success = await restoreStore(storeKey)
      if (success) {
        restored.push(storeKey)
      }
    }

    return restored
  } catch (error) {
    console.error('Failed to restore all stores:', error)
    return []
  }
}

// ------------------------------------------------------------------ //
//                         Backup Info Functions
// ------------------------------------------------------------------ //

/**
 * Gets the metadata for the last backup
 */
export async function getBackupMetadata(): Promise<BackupMetadata | null> {
  try {
    const metadataStr = await AsyncStorage.getItem(BACKUP_METADATA_KEY)
    if (metadataStr === null) {
      return null
    }

    const metadata = JSON.parse(metadataStr) as BackupMetadata
    return metadata
  } catch (error) {
    console.error('Failed to get backup metadata:', error)
    return null
  }
}

/**
 * Checks if a backup exists for a specific store
 */
export async function hasBackup(storeKey: StorageKey): Promise<boolean> {
  try {
    const backupKey = BACKUP_KEYS[storeKey]
    const backupData = await AsyncStorage.getItem(backupKey)
    return backupData !== null
  } catch (error) {
    console.error(`Failed to check backup for ${storeKey}:`, error)
    return false
  }
}

/**
 * Checks if backups exist for all stores
 */
export async function hasAllBackups(): Promise<boolean> {
  try {
    const storeKeys = Object.keys(STORAGE_KEYS) as StorageKey[]

    for (const storeKey of storeKeys) {
      const exists = await hasBackup(storeKey)
      if (!exists) {
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Failed to check all backups:', error)
    return false
  }
}

// ------------------------------------------------------------------ //
//                         Clear Functions
// ------------------------------------------------------------------ //

/**
 * Clears the backup for a specific store
 */
export async function clearBackup(storeKey: StorageKey): Promise<boolean> {
  try {
    const backupKey = BACKUP_KEYS[storeKey]
    await AsyncStorage.removeItem(backupKey)
    return true
  } catch (error) {
    console.error(`Failed to clear backup for ${storeKey}:`, error)
    return false
  }
}

/**
 * Clears all backups
 */
export async function clearAllBackups(): Promise<boolean> {
  try {
    const storeKeys = Object.keys(STORAGE_KEYS) as StorageKey[]

    for (const storeKey of storeKeys) {
      await clearBackup(storeKey)
    }

    await AsyncStorage.removeItem(BACKUP_METADATA_KEY)
    return true
  } catch (error) {
    console.error('Failed to clear all backups:', error)
    return false
  }
}

// ------------------------------------------------------------------ //
//                         Recovery Functions
// ------------------------------------------------------------------ //

/**
 * Result of a recovery operation
 */
export interface RecoveryResult {
  storeKey: StorageKey
  recovered: boolean
  method: 'backup' | 'reset' | 'none'
  error?: string
}

/**
 * Attempts to recover a single store from corruption
 * 1. Checks if store is corrupted using storageHealth
 * 2. If corrupted, attempts to restore from backup
 * 3. If no backup, removes corrupted data to allow default initialization
 */
export async function recoverStore(storeKey: StorageKey): Promise<RecoveryResult> {
  try {
    // Import storageHealth functions dynamically to avoid circular dependency
    const { checkStoreHealth } = await import('./storageHealth')

    // Check if store is corrupted
    const health = await checkStoreHealth(storeKey)

    if (health.isValid) {
      // Store is healthy, no recovery needed
      return {
        storeKey,
        recovered: false,
        method: 'none',
      }
    }

    // Store is corrupted, attempt recovery
    if (!health.canRecover) {
      return {
        storeKey,
        recovered: false,
        method: 'none',
        error: 'Store is not recoverable',
      }
    }

    // Try to restore from backup
    const backupExists = await hasBackup(storeKey)
    if (backupExists) {
      const restored = await restoreStore(storeKey)
      if (restored) {
        return {
          storeKey,
          recovered: true,
          method: 'backup',
        }
      }
    }

    // No backup or backup restore failed, reset to defaults
    await AsyncStorage.removeItem(STORAGE_KEYS[storeKey])
    return {
      storeKey,
      recovered: true,
      method: 'reset',
    }
  } catch (error) {
    return {
      storeKey,
      recovered: false,
      method: 'none',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Attempts to recover all corrupted stores
 */
export async function recoverAllStores(): Promise<RecoveryResult[]> {
  try {
    // Import storageHealth functions dynamically
    const { getCorruptedStores } = await import('./storageHealth')

    // Get list of corrupted stores
    const corrupted = await getCorruptedStores()

    if (corrupted.length === 0) {
      return []
    }

    // Attempt to recover each corrupted store
    const results: RecoveryResult[] = []
    for (const storeKey of corrupted) {
      const result = await recoverStore(storeKey)
      results.push(result)
    }

    return results
  } catch (error) {
    console.error('Failed to recover all stores:', error)
    return []
  }
}

/**
 * Performs automatic recovery check and fixes any corrupted stores
 * Returns true if any stores were recovered
 */
export async function autoRecoverFromCorruption(): Promise<{
  hadCorruption: boolean
  recovered: StorageKey[]
  failed: StorageKey[]
}> {
  try {
    const results = await recoverAllStores()

    if (results.length === 0) {
      return {
        hadCorruption: false,
        recovered: [],
        failed: [],
      }
    }

    const recovered: StorageKey[] = []
    const failed: StorageKey[] = []

    for (const result of results) {
      if (result.recovered) {
        recovered.push(result.storeKey)
      } else {
        failed.push(result.storeKey)
      }
    }

    return {
      hadCorruption: true,
      recovered,
      failed,
    }
  } catch (error) {
    console.error('Auto-recovery failed:', error)
    return {
      hadCorruption: false,
      recovered: [],
      failed: [],
    }
  }
}

// ------------------------------------------------------------------ //
//                         Export All
// ------------------------------------------------------------------ //

export const backupManager = {
  // Backup functions
  backupStore,
  backupAllStores,

  // Restore functions
  restoreStore,
  restoreAllStores,

  // Recovery functions
  recoverStore,
  recoverAllStores,
  autoRecoverFromCorruption,

  // Info functions
  getBackupMetadata,
  hasBackup,
  hasAllBackups,

  // Clear functions
  clearBackup,
  clearAllBackups,

  // Constants
  STORAGE_KEYS,
  BACKUP_KEYS,
  BACKUP_VERSION,
}
