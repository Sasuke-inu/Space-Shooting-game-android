import * as SecureStore from "expo-secure-store";

/**
 * SecureStore adapter for Zustand's createJSONStorage.
 * Provides encrypted storage for sensitive game data like credits, achievements, and settings.
 *
 * Compatible with AsyncStorage interface but stores data encrypted on device.
 */
const secureStorage = {
  /**
   * Get an item from secure storage
   * @param key - Storage key
   * @returns Promise resolving to the stored value or null if not found
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`[SecureStorage] Error getting item "${key}":`, error);
      return null;
    }
  },

  /**
   * Set an item in secure storage
   * @param key - Storage key
   * @param value - Value to store (will be encrypted)
   * @returns Promise resolving when storage is complete
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`[SecureStorage] Error setting item "${key}":`, error);
      throw error;
    }
  },

  /**
   * Remove an item from secure storage
   * @param key - Storage key
   * @returns Promise resolving when removal is complete
   */
  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`[SecureStorage] Error removing item "${key}":`, error);
      throw error;
    }
  },
};

export default secureStorage;
