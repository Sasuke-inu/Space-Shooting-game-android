import AsyncStorage from '@react-native-async-storage/async-storage'
import { STORAGE_KEYS, type StorageKey } from './backupManager'

// ------------------------------------------------------------------ //
//                         Version Definitions
// ------------------------------------------------------------------ //

/**
 * Schema version for each store
 * Increment when making breaking changes to the store structure
 */
export const STORE_VERSIONS: Record<StorageKey, number> = {
  achievements: 1,
  statistics: 1,
  upgrades: 1,
  settings: 1,
  highScores: 1,
} as const

export interface VersionInfo {
  storeKey: StorageKey
  version: number
  lastMigrated: number  // Timestamp
}

const VERSION_INFO_KEY = 'data-version-info'

// ------------------------------------------------------------------ //
//                         Migration Types
// ------------------------------------------------------------------ //

/**
 * Migration function type
 * Takes old data and returns migrated data
 */
export type MigrationFn = (oldData: any) => any

/**
 * Migration definition
 */
export interface Migration {
  storeKey: StorageKey
  fromVersion: number
  toVersion: number
  migrate: MigrationFn
}

/**
 * Registry of all migrations
 * Add new migrations here when schema changes
 */
const MIGRATIONS: Migration[] = [
  // Example migration (placeholder for future use):
  // {
  //   storeKey: 'achievements',
  //   fromVersion: 1,
  //   toVersion: 2,
  //   migrate: (oldData) => {
  //     // Transform oldData to new structure
  //     return { ...oldData, newField: defaultValue }
  //   }
  // }
]

// ------------------------------------------------------------------ //
//                         Version Tracking
// ------------------------------------------------------------------ //

/**
 * Gets version info for all stores
 */
export async function getVersionInfo(): Promise<Record<StorageKey, VersionInfo> | null> {
  try {
    const infoStr = await AsyncStorage.getItem(VERSION_INFO_KEY)
    if (infoStr === null) {
      return null
    }

    const info = JSON.parse(infoStr) as Record<StorageKey, VersionInfo>
    return info
  } catch (error) {
    console.error('Failed to get version info:', error)
    return null
  }
}

/**
 * Gets version for a specific store
 */
export async function getStoreVersion(storeKey: StorageKey): Promise<number | null> {
  try {
    const versionInfo = await getVersionInfo()
    if (versionInfo === null) {
      return null
    }

    return versionInfo[storeKey]?.version ?? null
  } catch (error) {
    console.error(`Failed to get version for ${storeKey}:`, error)
    return null
  }
}

/**
 * Sets version info for a store
 */
export async function setStoreVersion(storeKey: StorageKey, version: number): Promise<boolean> {
  try {
    const versionInfo = (await getVersionInfo()) || ({} as Record<StorageKey, VersionInfo>)

    versionInfo[storeKey] = {
      storeKey,
      version,
      lastMigrated: Date.now(),
    }

    await AsyncStorage.setItem(VERSION_INFO_KEY, JSON.stringify(versionInfo))
    return true
  } catch (error) {
    console.error(`Failed to set version for ${storeKey}:`, error)
    return false
  }
}

/**
 * Initializes version tracking for all stores
 */
export async function initializeVersions(): Promise<boolean> {
  try {
    const existingInfo = await getVersionInfo()
    if (existingInfo !== null) {
      // Already initialized
      return true
    }

    const versionInfo: Partial<Record<StorageKey, VersionInfo>> = {}
    const storeKeys = Object.keys(STORAGE_KEYS) as StorageKey[]

    for (const storeKey of storeKeys) {
      versionInfo[storeKey] = {
        storeKey,
        version: STORE_VERSIONS[storeKey],
        lastMigrated: Date.now(),
      }
    }

    await AsyncStorage.setItem(VERSION_INFO_KEY, JSON.stringify(versionInfo))
    return true
  } catch (error) {
    console.error('Failed to initialize versions:', error)
    return false
  }
}

// ------------------------------------------------------------------ //
//                         Migration Functions
// ------------------------------------------------------------------ //

/**
 * Checks if a store needs migration
 */
export async function needsMigration(storeKey: StorageKey): Promise<boolean> {
  try {
    const currentVersion = await getStoreVersion(storeKey)
    const targetVersion = STORE_VERSIONS[storeKey]

    if (currentVersion === null) {
      // No version info means first time, no migration needed
      return false
    }

    return currentVersion < targetVersion
  } catch (error) {
    console.error(`Failed to check if ${storeKey} needs migration:`, error)
    return false
  }
}

/**
 * Gets all migrations needed to upgrade from one version to another
 */
export function getMigrationsForStore(
  storeKey: StorageKey,
  fromVersion: number,
  toVersion: number
): Migration[] {
  return MIGRATIONS.filter(
    (migration) =>
      migration.storeKey === storeKey &&
      migration.fromVersion >= fromVersion &&
      migration.toVersion <= toVersion
  ).sort((a, b) => a.fromVersion - b.fromVersion)
}

/**
 * Applies a single migration to data
 */
export async function applyMigration(migration: Migration, data: any): Promise<any> {
  try {
    const migratedData = migration.migrate(data)
    return migratedData
  } catch (error) {
    console.error(
      `Failed to apply migration ${migration.storeKey} v${migration.fromVersion} -> v${migration.toVersion}:`,
      error
    )
    throw error
  }
}

/**
 * Migrates a store from its current version to the target version
 */
export async function migrateStore(storeKey: StorageKey): Promise<boolean> {
  try {
    const currentVersion = await getStoreVersion(storeKey)
    const targetVersion = STORE_VERSIONS[storeKey]

    if (currentVersion === null) {
      // No version info, set current version
      await setStoreVersion(storeKey, targetVersion)
      return true
    }

    if (currentVersion >= targetVersion) {
      // Already up to date
      return true
    }

    // Get data from storage
    const dataStr = await AsyncStorage.getItem(STORAGE_KEYS[storeKey])
    if (dataStr === null) {
      // No data to migrate
      await setStoreVersion(storeKey, targetVersion)
      return true
    }

    let data = JSON.parse(dataStr)

    // Get all migrations needed
    const migrations = getMigrationsForStore(storeKey, currentVersion, targetVersion)

    // Apply migrations in sequence
    for (const migration of migrations) {
      data = await applyMigration(migration, data)
    }

    // Save migrated data
    await AsyncStorage.setItem(STORAGE_KEYS[storeKey], JSON.stringify(data))

    // Update version
    await setStoreVersion(storeKey, targetVersion)

    return true
  } catch (error) {
    console.error(`Failed to migrate store ${storeKey}:`, error)
    return false
  }
}

/**
 * Migrates all stores that need migration
 */
export async function migrateAllStores(): Promise<StorageKey[]> {
  try {
    const storeKeys = Object.keys(STORAGE_KEYS) as StorageKey[]
    const migrated: StorageKey[] = []

    for (const storeKey of storeKeys) {
      const needs = await needsMigration(storeKey)
      if (needs) {
        const success = await migrateStore(storeKey)
        if (success) {
          migrated.push(storeKey)
        }
      }
    }

    return migrated
  } catch (error) {
    console.error('Failed to migrate all stores:', error)
    return []
  }
}

// ------------------------------------------------------------------ //
//                         Version Validation
// ------------------------------------------------------------------ //

/**
 * Checks if data version is compatible with current schema
 */
export async function isVersionCompatible(storeKey: StorageKey): Promise<boolean> {
  try {
    const currentVersion = await getStoreVersion(storeKey)
    const targetVersion = STORE_VERSIONS[storeKey]

    if (currentVersion === null) {
      // No version info, assume compatible (first run)
      return true
    }

    // Compatible if current version <= target version
    // (we can migrate up, but not down)
    return currentVersion <= targetVersion
  } catch (error) {
    console.error(`Failed to check version compatibility for ${storeKey}:`, error)
    return false
  }
}

/**
 * Validates all store versions are compatible
 */
export async function validateAllVersions(): Promise<{
  compatible: boolean
  incompatible: StorageKey[]
}> {
  try {
    const storeKeys = Object.keys(STORAGE_KEYS) as StorageKey[]
    const incompatible: StorageKey[] = []

    for (const storeKey of storeKeys) {
      const compatible = await isVersionCompatible(storeKey)
      if (!compatible) {
        incompatible.push(storeKey)
      }
    }

    return {
      compatible: incompatible.length === 0,
      incompatible,
    }
  } catch (error) {
    console.error('Failed to validate all versions:', error)
    return {
      compatible: false,
      incompatible: Object.keys(STORAGE_KEYS) as StorageKey[],
    }
  }
}

// ------------------------------------------------------------------ //
//                         Export All
// ------------------------------------------------------------------ //

export const dataVersioning = {
  // Version tracking
  getVersionInfo,
  getStoreVersion,
  setStoreVersion,
  initializeVersions,

  // Migration
  needsMigration,
  getMigrationsForStore,
  applyMigration,
  migrateStore,
  migrateAllStores,

  // Validation
  isVersionCompatible,
  validateAllVersions,

  // Constants
  STORE_VERSIONS,
}
