import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * Storage keys used by the application stores
 */
const STORAGE_KEYS = [
  'app-settings-storage',          // settingsStore.ts
  'space-shooter-achievements',     // progressStore.ts - achievements
  'space-shooter-statistics',       // progressStore.ts - statistics
  'space-shooter-upgrades',         // progressStore.ts - upgrades
  'high-scores-storage',            // highScoresStore.ts
  'settings-storage',               // themeStore.ts
  'i18n-storage',                   // i18n/store.ts
] as const;

/**
 * Flag key to track migration completion
 */
const MIGRATION_COMPLETE_KEY = 'storage-migration-complete';

/**
 * Migrates data from AsyncStorage to SecureStore for all application stores.
 * This is a one-time migration that runs automatically on app startup.
 *
 * The migration is idempotent - it's safe to run multiple times as it checks
 * if migration has already been completed before proceeding.
 *
 * @returns Promise<void>
 * @throws Error if migration fails critically (logs individual key failures)
 */
export async function migrateStorageToSecureStore(): Promise<void> {
  try {
    // Check if migration has already been completed
    const migrationComplete = await SecureStore.getItemAsync(MIGRATION_COMPLETE_KEY);

    if (migrationComplete === 'true') {
      // Migration already completed, skip
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Migrate each storage key
    for (const key of STORAGE_KEYS) {
      try {
        // Get data from AsyncStorage
        const asyncStorageData = await AsyncStorage.getItem(key);

        if (asyncStorageData !== null) {
          // Data exists in AsyncStorage, migrate it to SecureStore
          await SecureStore.setItemAsync(key, asyncStorageData);
          migratedCount++;
        } else {
          // No data in AsyncStorage for this key, skip
          skippedCount++;
        }
      } catch (error) {
        // Log error but continue with other keys
        console.error(`[Migration] Failed to migrate key "${key}":`, error);
        errorCount++;
      }
    }

    // Mark migration as complete
    await SecureStore.setItemAsync(MIGRATION_COMPLETE_KEY, 'true');

    // Log migration summary
    if (migratedCount > 0 || errorCount > 0) {
      console.log(`[Migration] Storage migration complete. Migrated: ${migratedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
    }
  } catch (error) {
    // Critical migration error
    console.error('[Migration] Critical error during storage migration:', error);
    throw error;
  }
}

/**
 * Resets the migration flag, forcing migration to run again on next app start.
 * This is useful for testing or debugging migration issues.
 *
 * WARNING: Only use this for development/testing purposes.
 *
 * @returns Promise<void>
 */
export async function resetMigrationFlag(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(MIGRATION_COMPLETE_KEY);
  } catch (error) {
    console.error('[Migration] Failed to reset migration flag:', error);
    throw error;
  }
}

/**
 * Checks if storage migration has been completed.
 *
 * @returns Promise<boolean> - true if migration is complete, false otherwise
 */
export async function isMigrationComplete(): Promise<boolean> {
  try {
    const migrationComplete = await SecureStore.getItemAsync(MIGRATION_COMPLETE_KEY);
    return migrationComplete === 'true';
  } catch (error) {
    console.error('[Migration] Failed to check migration status:', error);
    return false;
  }
}
