// ------------------------------------------------------------------ //
//                    Score System (centralized scoring logic)
// ------------------------------------------------------------------ //

import { ENEMY_STATS, BOSS_STATS } from "../types/game"
import type { EnemyType, BossType } from "../types/game"

// ------------------------------------------------------------------ //
//                         Asteroid Scoring
// ------------------------------------------------------------------ //

/**
 * Calculate score for destroying an asteroid
 *
 * @param tier - The asteroid tier (1 = small, 2 = medium, 3 = large)
 * @returns Score points awarded (formula: 20 * tier)
 */
export const getAsteroidScore = (tier: 1 | 2 | 3): number => {
  return 20 * tier
}

/**
 * Calculate credits for destroying an asteroid
 *
 * @param tier - The asteroid tier (1 = small, 2 = medium, 3 = large)
 * @returns Credits awarded (formula: tier value directly, 1-3 credits)
 */
export const getAsteroidCredits = (tier: 1 | 2 | 3): number => {
  return tier
}

// ------------------------------------------------------------------ //
//                         Enemy Scoring
// ------------------------------------------------------------------ //

/**
 * Calculate score for destroying an enemy
 *
 * @param type - The enemy type (scout, tank, sniper, bomber)
 * @returns Score points awarded (pulled from ENEMY_STATS[type].points)
 */
export const getEnemyScore = (type: EnemyType): number => {
  return ENEMY_STATS[type].points
}

/**
 * Calculate credits for destroying an enemy
 *
 * @param type - The enemy type (scout, tank, sniper, bomber)
 * @returns Credits awarded (formula: floor(enemy points / 10))
 */
export const getEnemyCredits = (type: EnemyType): number => {
  return Math.floor(ENEMY_STATS[type].points / 10)
}

// ------------------------------------------------------------------ //
//                         Boss Scoring
// ------------------------------------------------------------------ //

/**
 * Calculate score for defeating a boss
 *
 * @param type - The boss type (destroyer, carrier, dreadnought)
 * @returns Score points awarded (pulled from BOSS_STATS[type].points)
 */
export const getBossScore = (type: BossType): number => {
  return BOSS_STATS[type].points
}

/**
 * Calculate credits for defeating a boss
 *
 * @param type - The boss type (destroyer, carrier, dreadnought)
 * @returns Credits awarded (formula: floor(boss points / 10))
 */
export const getBossCredits = (type: BossType): number => {
  return Math.floor(BOSS_STATS[type].points / 10)
}
