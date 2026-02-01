import AsyncStorage from '@react-native-async-storage/async-storage'
import { STORAGE_KEYS, StorageKey } from './backupManager'
import type { Achievement, AchievementId, GameStatistics, WeaponUpgrades, ShipType, EnemyType, BossType } from '../types/game'
import type { LanguageCode } from '../i18n/types'
import type { JoystickSize } from '../state/settingsStore'
import type { HighScore } from '../state/highScoresStore'

// ------------------------------------------------------------------ //
//                         Health Check Types
// ------------------------------------------------------------------ //

export interface StoreHealth {
  storeKey: StorageKey
  isValid: boolean
  issues: string[]
  canRecover: boolean
}

export interface StorageHealthReport {
  overallHealth: 'healthy' | 'degraded' | 'critical'
  timestamp: number
  stores: Record<StorageKey, StoreHealth>
  corruptedStores: StorageKey[]
  recoverableStores: StorageKey[]
}

export type ValidationResult = {
  valid: boolean
  issues: string[]
}

// ------------------------------------------------------------------ //
//                         Validation Helpers
// ------------------------------------------------------------------ //

/**
 * Validates that a value is a number
 */
function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}

/**
 * Validates that a value is a non-negative number
 */
function isNonNegativeNumber(value: unknown): boolean {
  return isNumber(value) && value >= 0
}

/**
 * Validates that a value is a string
 */
function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Validates that a value is a boolean
 */
function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

/**
 * Validates that a value is an array
 */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/**
 * Validates that a value is an object (not null, not array)
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// ------------------------------------------------------------------ //
//                         Store Validators
// ------------------------------------------------------------------ //

/**
 * Validates achievements store structure
 */
function validateAchievements(data: unknown): ValidationResult {
  const issues: string[] = []

  if (!isObject(data)) {
    return { valid: false, issues: ['Root must be an object'] }
  }

  // Check for achievements field
  if (!('achievements' in data)) {
    issues.push('Missing "achievements" field')
  } else if (!isObject(data.achievements)) {
    issues.push('"achievements" must be an object')
  } else {
    // Validate each achievement
    const achievements = data.achievements as Record<string, unknown>
    for (const [id, achievement] of Object.entries(achievements)) {
      if (!isObject(achievement)) {
        issues.push(`Achievement "${id}" must be an object`)
        continue
      }

      const ach = achievement as Record<string, unknown>

      if (!('id' in ach) || !isString(ach.id)) {
        issues.push(`Achievement "${id}" missing valid "id" field`)
      }
      if (!('name' in ach) || !isString(ach.name)) {
        issues.push(`Achievement "${id}" missing valid "name" field`)
      }
      if (!('description' in ach) || !isString(ach.description)) {
        issues.push(`Achievement "${id}" missing valid "description" field`)
      }
      if (!('icon' in ach) || !isString(ach.icon)) {
        issues.push(`Achievement "${id}" missing valid "icon" field`)
      }
      if (!('unlocked' in ach) || !isBoolean(ach.unlocked)) {
        issues.push(`Achievement "${id}" missing valid "unlocked" field`)
      }
      if ('unlockedAt' in ach && ach.unlockedAt !== undefined && !isNumber(ach.unlockedAt)) {
        issues.push(`Achievement "${id}" has invalid "unlockedAt" field`)
      }
      if ('progress' in ach && ach.progress !== undefined && !isNonNegativeNumber(ach.progress)) {
        issues.push(`Achievement "${id}" has invalid "progress" field`)
      }
      if ('target' in ach && ach.target !== undefined && !isNonNegativeNumber(ach.target)) {
        issues.push(`Achievement "${id}" has invalid "target" field`)
      }
    }
  }

  // Check for recentUnlock field
  if ('recentUnlock' in data && data.recentUnlock !== null && !isString(data.recentUnlock)) {
    issues.push('"recentUnlock" must be a string or null')
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

/**
 * Validates statistics store structure
 */
function validateStatistics(data: unknown): ValidationResult {
  const issues: string[] = []

  if (!isObject(data)) {
    return { valid: false, issues: ['Root must be an object'] }
  }

  // Check for stats field
  if (!('stats' in data)) {
    issues.push('Missing "stats" field')
    return { valid: false, issues }
  }

  if (!isObject(data.stats)) {
    issues.push('"stats" must be an object')
    return { valid: false, issues }
  }

  const stats = data.stats as Record<string, unknown>

  // Validate required numeric fields
  const requiredNumbers: Array<keyof GameStatistics> = [
    'totalGames',
    'totalScore',
    'totalKills',
    'totalDeaths',
    'totalTimePlayed',
    'totalShotsFired',
    'totalShotsHit',
    'totalPowerUpsCollected',
    'totalBossesDefeated',
    'highestScore',
    'highestWave',
    'highestCombo',
    'longestSurvival',
    'bestAccuracy',
    'lastPlayed',
  ]

  for (const field of requiredNumbers) {
    if (!(field in stats)) {
      issues.push(`Stats missing "${field}" field`)
    } else if (!isNonNegativeNumber(stats[field])) {
      issues.push(`Stats "${field}" must be a non-negative number`)
    }
  }

  // Validate killsByEnemyType
  if (!('killsByEnemyType' in stats)) {
    issues.push('Stats missing "killsByEnemyType" field')
  } else if (!isObject(stats.killsByEnemyType)) {
    issues.push('Stats "killsByEnemyType" must be an object')
  } else {
    const enemyTypes: EnemyType[] = ['scout', 'tank', 'sniper', 'bomber', 'teleporter', 'healer', 'juggernaut']
    const killsByEnemy = stats.killsByEnemyType as Record<string, unknown>
    for (const type of enemyTypes) {
      if (!(type in killsByEnemy) || !isNonNegativeNumber(killsByEnemy[type])) {
        issues.push(`Stats "killsByEnemyType" missing or invalid "${type}" count`)
      }
    }
  }

  // Validate killsByBossType
  if (!('killsByBossType' in stats)) {
    issues.push('Stats missing "killsByBossType" field')
  } else if (!isObject(stats.killsByBossType)) {
    issues.push('Stats "killsByBossType" must be an object')
  } else {
    const bossTypes: BossType[] = ['destroyer', 'carrier', 'dreadnought', 'mothership']
    const killsByBoss = stats.killsByBossType as Record<string, unknown>
    for (const type of bossTypes) {
      if (!(type in killsByBoss) || !isNonNegativeNumber(killsByBoss[type])) {
        issues.push(`Stats "killsByBossType" missing or invalid "${type}" count`)
      }
    }
  }

  // Validate favoriteShip
  if (!('favoriteShip' in stats)) {
    issues.push('Stats missing "favoriteShip" field')
  } else if (!isString(stats.favoriteShip)) {
    issues.push('Stats "favoriteShip" must be a string')
  } else {
    const validShips: ShipType[] = ['fighter', 'scout', 'tank', 'interceptor']
    if (!validShips.includes(stats.favoriteShip as ShipType)) {
      issues.push('Stats "favoriteShip" has invalid value')
    }
  }

  // Validate favoriteTheme
  if (!('favoriteTheme' in stats)) {
    issues.push('Stats missing "favoriteTheme" field')
  } else if (!isString(stats.favoriteTheme)) {
    issues.push('Stats "favoriteTheme" must be a string')
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

/**
 * Validates upgrades store structure
 */
function validateUpgrades(data: unknown): ValidationResult {
  const issues: string[] = []

  if (!isObject(data)) {
    return { valid: false, issues: ['Root must be an object'] }
  }

  // Validate upgrades field
  if (!('upgrades' in data)) {
    issues.push('Missing "upgrades" field')
  } else if (!isObject(data.upgrades)) {
    issues.push('"upgrades" must be an object')
  } else {
    const upgrades = data.upgrades as Record<string, unknown>

    // Validate damage (0-5)
    if (!('damage' in upgrades) || !isNumber(upgrades.damage)) {
      issues.push('Upgrades missing or invalid "damage" field')
    } else if (upgrades.damage < 0 || upgrades.damage > 5) {
      issues.push('Upgrades "damage" must be between 0 and 5')
    }

    // Validate fireRate (0-5)
    if (!('fireRate' in upgrades) || !isNumber(upgrades.fireRate)) {
      issues.push('Upgrades missing or invalid "fireRate" field')
    } else if (upgrades.fireRate < 0 || upgrades.fireRate > 5) {
      issues.push('Upgrades "fireRate" must be between 0 and 5')
    }

    // Validate bulletSize (0-3)
    if (!('bulletSize' in upgrades) || !isNumber(upgrades.bulletSize)) {
      issues.push('Upgrades missing or invalid "bulletSize" field')
    } else if (upgrades.bulletSize < 0 || upgrades.bulletSize > 3) {
      issues.push('Upgrades "bulletSize" must be between 0 and 3')
    }

    // Validate multiShot (0-2)
    if (!('multiShot' in upgrades) || !isNumber(upgrades.multiShot)) {
      issues.push('Upgrades missing or invalid "multiShot" field')
    } else if (upgrades.multiShot < 0 || upgrades.multiShot > 2) {
      issues.push('Upgrades "multiShot" must be between 0 and 2')
    }

    // Validate piercing (boolean)
    if (!('piercing' in upgrades) || !isBoolean(upgrades.piercing)) {
      issues.push('Upgrades missing or invalid "piercing" field')
    }
  }

  // Validate credits
  if (!('credits' in data)) {
    issues.push('Missing "credits" field')
  } else if (!isNonNegativeNumber(data.credits)) {
    issues.push('"credits" must be a non-negative number')
  }

  // Validate unlockedShips
  if (!('unlockedShips' in data)) {
    issues.push('Missing "unlockedShips" field')
  } else if (!isArray(data.unlockedShips)) {
    issues.push('"unlockedShips" must be an array')
  } else {
    const ships = data.unlockedShips as unknown[]
    const validShips: ShipType[] = ['fighter', 'scout', 'tank', 'interceptor']
    for (const ship of ships) {
      if (!isString(ship) || !validShips.includes(ship as ShipType)) {
        issues.push(`Invalid ship in "unlockedShips": ${ship}`)
      }
    }
    // Fighter should always be unlocked
    if (!ships.includes('fighter')) {
      issues.push('"unlockedShips" must include "fighter"')
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

/**
 * Validates settings store structure
 */
function validateSettings(data: unknown): ValidationResult {
  const issues: string[] = []

  if (!isObject(data)) {
    return { valid: false, issues: ['Root must be an object'] }
  }

  // Validate language
  if (!('language' in data)) {
    issues.push('Missing "language" field')
  } else if (!isString(data.language)) {
    issues.push('"language" must be a string')
  } else {
    const validLanguages: LanguageCode[] = ['en', 'es', 'zh', 'ja', 'ko']
    if (!validLanguages.includes(data.language as LanguageCode)) {
      issues.push('"language" has invalid value')
    }
  }

  // Validate joystickSize
  if (!('joystickSize' in data)) {
    issues.push('Missing "joystickSize" field')
  } else if (!isString(data.joystickSize)) {
    issues.push('"joystickSize" must be a string')
  } else {
    const validSizes: JoystickSize[] = ['small', 'medium', 'large']
    if (!validSizes.includes(data.joystickSize as JoystickSize)) {
      issues.push('"joystickSize" has invalid value')
    }
  }

  // Validate invertY
  if (!('invertY' in data)) {
    issues.push('Missing "invertY" field')
  } else if (!isBoolean(data.invertY)) {
    issues.push('"invertY" must be a boolean')
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

/**
 * Validates high scores store structure
 */
function validateHighScores(data: unknown): ValidationResult {
  const issues: string[] = []

  if (!isObject(data)) {
    return { valid: false, issues: ['Root must be an object'] }
  }

  // Validate scores field
  if (!('scores' in data)) {
    issues.push('Missing "scores" field')
  } else if (!isArray(data.scores)) {
    issues.push('"scores" must be an array')
  } else {
    const scores = data.scores as unknown[]

    // Validate array length (should be <= 5)
    if (scores.length > 5) {
      issues.push('"scores" array should not exceed 5 entries')
    }

    // Validate each score object
    for (let i = 0; i < scores.length; i++) {
      const score = scores[i]
      if (!isObject(score)) {
        issues.push(`Score at index ${i} must be an object`)
        continue
      }

      const scoreObj = score as Record<string, unknown>

      if (!('name' in scoreObj) || !isString(scoreObj.name)) {
        issues.push(`Score at index ${i} missing valid "name" field`)
      }
      if (!('score' in scoreObj) || !isNonNegativeNumber(scoreObj.score)) {
        issues.push(`Score at index ${i} missing valid "score" field`)
      }
      if (!('wave' in scoreObj) || !isNonNegativeNumber(scoreObj.wave)) {
        issues.push(`Score at index ${i} missing valid "wave" field`)
      }
      if (!('date' in scoreObj) || !isNumber(scoreObj.date)) {
        issues.push(`Score at index ${i} missing valid "date" field`)
      }
    }

    // Validate sort order (should be descending by score)
    for (let i = 0; i < scores.length - 1; i++) {
      const current = scores[i] as Record<string, unknown>
      const next = scores[i + 1] as Record<string, unknown>
      if (isNumber(current.score) && isNumber(next.score) && current.score < next.score) {
        issues.push('Scores array is not sorted in descending order')
        break
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

// ------------------------------------------------------------------ //
//                         Health Check Functions
// ------------------------------------------------------------------ //

/**
 * Validates a store's data structure based on its type
 */
export function validateStoreData(storeKey: StorageKey, data: unknown): ValidationResult {
  switch (storeKey) {
    case 'achievements':
      return validateAchievements(data)
    case 'statistics':
      return validateStatistics(data)
    case 'upgrades':
      return validateUpgrades(data)
    case 'settings':
      return validateSettings(data)
    case 'highScores':
      return validateHighScores(data)
    default:
      return { valid: false, issues: [`Unknown store type: ${storeKey}`] }
  }
}

/**
 * Checks the health of a single store
 */
export async function checkStoreHealth(storeKey: StorageKey): Promise<StoreHealth> {
  const issues: string[] = []
  let isValid = true
  let canRecover = true

  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS[storeKey])

    // Store doesn't exist or is empty
    if (data === null) {
      return {
        storeKey,
        isValid: true,
        issues: [],
        canRecover: true,
      }
    }

    // Try to parse JSON
    let parsed: unknown
    try {
      parsed = JSON.parse(data)
    } catch (parseError) {
      issues.push('Failed to parse JSON')
      isValid = false
      canRecover = true // Can recover by restoring from backup or resetting
      return { storeKey, isValid, issues, canRecover }
    }

    // Validate store structure
    const validation = validateStoreData(storeKey, parsed)
    if (!validation.valid) {
      issues.push(...validation.issues)
      isValid = false
      canRecover = true // Can recover by restoring from backup or resetting
    }
  } catch (error) {
    issues.push(`Storage access error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    isValid = false
    canRecover = false // Storage system might be broken
  }

  return {
    storeKey,
    isValid,
    issues,
    canRecover,
  }
}

/**
 * Checks the health of all stores and generates a comprehensive report
 */
export async function checkStorageHealth(): Promise<StorageHealthReport> {
  const storeKeys = Object.keys(STORAGE_KEYS) as StorageKey[]
  const stores: Record<StorageKey, StoreHealth> = {} as Record<StorageKey, StoreHealth>
  const corruptedStores: StorageKey[] = []
  const recoverableStores: StorageKey[] = []

  for (const storeKey of storeKeys) {
    const health = await checkStoreHealth(storeKey)
    stores[storeKey] = health

    if (!health.isValid) {
      corruptedStores.push(storeKey)
      if (health.canRecover) {
        recoverableStores.push(storeKey)
      }
    }
  }

  // Determine overall health
  let overallHealth: 'healthy' | 'degraded' | 'critical'
  if (corruptedStores.length === 0) {
    overallHealth = 'healthy'
  } else if (corruptedStores.length === storeKeys.length) {
    overallHealth = 'critical'
  } else {
    overallHealth = 'degraded'
  }

  return {
    overallHealth,
    timestamp: Date.now(),
    stores,
    corruptedStores,
    recoverableStores,
  }
}

/**
 * Quick check to see if any stores are corrupted
 */
export async function hasCorruptedStores(): Promise<boolean> {
  const storeKeys = Object.keys(STORAGE_KEYS) as StorageKey[]

  for (const storeKey of storeKeys) {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS[storeKey])
      if (data === null) continue

      // Try to parse JSON
      try {
        const parsed = JSON.parse(data)
        const validation = validateStoreData(storeKey, parsed)
        if (!validation.valid) {
          return true
        }
      } catch {
        return true
      }
    } catch {
      return true
    }
  }

  return false
}

/**
 * Gets a list of all corrupted store keys
 */
export async function getCorruptedStores(): Promise<StorageKey[]> {
  const storeKeys = Object.keys(STORAGE_KEYS) as StorageKey[]
  const corrupted: StorageKey[] = []

  for (const storeKey of storeKeys) {
    const health = await checkStoreHealth(storeKey)
    if (!health.isValid) {
      corrupted.push(storeKey)
    }
  }

  return corrupted
}
