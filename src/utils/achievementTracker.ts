import { useCallback } from "react"
import { useAchievementStore } from "../state/progressStore"
import { useStatisticsStore } from "../state/progressStore"
import { useUpgradesStore } from "../state/progressStore"
import type { AchievementId, ShipType, BossType } from "../types/game"

// ------------------------------------------------------------------ //
//                      Achievement Tracker
// ------------------------------------------------------------------ //

/**
 * Hook that provides achievement tracking functions
 * Call these functions when game events occur to check and unlock achievements
 */
export const useAchievementTracker = () => {
  /**
   * Check kill-based achievements
   * Call this when an enemy is destroyed
   */
  const checkKillAchievements = useCallback(() => {
    const stats = useStatisticsStore.getState().stats
    const achievementStore = useAchievementStore.getState()

    // First Blood - Destroy your first enemy
    if (stats.totalKills >= 1) {
      achievementStore.updateProgress('first_blood', 1)
    }
  }, [])

  /**
   * Check combo-based achievements
   * Call this when combo count changes
   * @param comboCount - Current combo count
   */
  const checkComboAchievements = useCallback((comboCount: number) => {
    const achievementStore = useAchievementStore.getState()

    // Combo Master - Reach a 20x combo
    if (comboCount >= 20) {
      achievementStore.updateProgress('combo_master', comboCount)
    }

    // Update highest combo stat
    useStatisticsStore.getState().updateHighestCombo(comboCount)
  }, [])

  /**
   * Check wave survival achievements
   * Call this when a wave is completed
   * @param wave - Wave number just completed
   * @param tookDamage - Whether player took damage during the wave
   */
  const checkWaveAchievements = useCallback((wave: number, tookDamage: boolean = true) => {
    const achievementStore = useAchievementStore.getState()

    // Wave survival milestones
    if (wave >= 10) {
      achievementStore.updateProgress('survivor_10', wave)
    }
    if (wave >= 20) {
      achievementStore.updateProgress('survivor_20', wave)
    }
    if (wave >= 30) {
      achievementStore.updateProgress('survivor_30', wave)
    }
    if (wave >= 40) {
      achievementStore.updateProgress('survivor_40', wave)
    }

    // Untouchable - Complete a wave without taking damage
    if (!tookDamage) {
      achievementStore.unlockAchievement('untouchable')
    }
  }, [])

  /**
   * Check boss-related achievements
   * Call this when a boss is defeated
   * @param bossType - Type of boss defeated
   */
  const checkBossAchievements = useCallback((bossType: BossType) => {
    const stats = useStatisticsStore.getState().stats
    const achievementStore = useAchievementStore.getState()

    // Boss Slayer - Defeat your first boss
    if (stats.totalBossesDefeated >= 1) {
      achievementStore.updateProgress('boss_slayer', 1)
    }

    // Boss-specific achievements
    const bossKills = stats.killsByBossType[bossType]
    switch (bossType) {
      case 'destroyer':
        achievementStore.updateProgress('destroyer_hunter', bossKills)
        break
      case 'carrier':
        achievementStore.updateProgress('carrier_hunter', bossKills)
        break
      case 'dreadnought':
        achievementStore.updateProgress('dreadnought_slayer', bossKills)
        break
    }
  }, [])

  /**
   * Check power-up collection achievement
   * Call this when a power-up is collected
   */
  const checkPowerUpAchievements = useCallback(() => {
    const stats = useStatisticsStore.getState().stats
    const achievementStore = useAchievementStore.getState()

    // Power Collector - Collect 50 power-ups
    achievementStore.updateProgress('power_collector', stats.totalPowerUpsCollected)
  }, [])

  /**
   * Check end-of-game achievements
   * Call this when a game ends
   * @param accuracy - Accuracy percentage for the game (0-100)
   * @param survivalTime - Time survived in seconds
   * @param score - Final score
   */
  const checkGameEndAchievements = useCallback((accuracy: number, survivalTime: number, score: number) => {
    const stats = useStatisticsStore.getState().stats
    const achievementStore = useAchievementStore.getState()

    // Sharpshooter - Achieve 80% accuracy in a game
    if (accuracy >= 80) {
      achievementStore.unlockAchievement('sharpshooter')
    }

    // Time Warrior - Survive for 10 minutes (600 seconds) in a single game
    if (survivalTime >= 600) {
      achievementStore.updateProgress('time_warrior', survivalTime)
    }

    // Millionaire - Accumulate 1,000,000 total score
    achievementStore.updateProgress('millionaire', stats.totalScore)
  }, [])

  /**
   * Check speed-based achievements
   * Call this periodically during gameplay to check time-based achievements
   * @param killsInLast10Seconds - Number of enemies killed in the last 10 seconds
   * @param secondsWithoutShooting - Consecutive seconds without shooting
   */
  const checkSpeedAchievements = useCallback((killsInLast10Seconds: number, secondsWithoutShooting: number) => {
    const achievementStore = useAchievementStore.getState()

    // Speed Demon - Destroy 10 enemies in 10 seconds
    if (killsInLast10Seconds >= 10) {
      achievementStore.updateProgress('speed_demon', killsInLast10Seconds)
    }

    // Pacifist - Survive 60 seconds without shooting
    if (secondsWithoutShooting >= 60) {
      achievementStore.unlockAchievement('pacifist')
    }
  }, [])

  /**
   * Check upgrade-related achievements
   * Call this when weapon upgrades are purchased
   */
  const checkUpgradeAchievements = useCallback(() => {
    const upgrades = useUpgradesStore.getState().weaponUpgrades
    const achievementStore = useAchievementStore.getState()

    // Fully Loaded - Max out all weapon upgrades
    const fullyUpgraded =
      upgrades.damage === 5 &&
      upgrades.fireRate === 5 &&
      upgrades.bulletSize === 3 &&
      upgrades.multiShot === 2 &&
      upgrades.piercing === true

    if (fullyUpgraded) {
      achievementStore.unlockAchievement('fully_upgraded')
    }
  }, [])

  /**
   * Check all achievements
   * Call this to perform a comprehensive check of all achievements
   * Useful for one-time checks on app start or game end
   */
  const checkAllAchievements = useCallback(() => {
    const stats = useStatisticsStore.getState().stats
    const achievementStore = useAchievementStore.getState()

    // Combat achievements
    if (stats.totalKills >= 1) {
      achievementStore.updateProgress('first_blood', 1)
    }
    if (stats.highestCombo >= 20) {
      achievementStore.updateProgress('combo_master', stats.highestCombo)
    }

    // Survival achievements
    if (stats.highestWave >= 10) {
      achievementStore.updateProgress('survivor_10', stats.highestWave)
    }
    if (stats.highestWave >= 20) {
      achievementStore.updateProgress('survivor_20', stats.highestWave)
    }
    if (stats.highestWave >= 30) {
      achievementStore.updateProgress('survivor_30', stats.highestWave)
    }
    if (stats.highestWave >= 40) {
      achievementStore.updateProgress('survivor_40', stats.highestWave)
    }

    // Boss achievements
    if (stats.totalBossesDefeated >= 1) {
      achievementStore.updateProgress('boss_slayer', 1)
    }
    achievementStore.updateProgress('destroyer_hunter', stats.killsByBossType.destroyer)
    achievementStore.updateProgress('carrier_hunter', stats.killsByBossType.carrier)
    achievementStore.updateProgress('dreadnought_slayer', stats.killsByBossType.dreadnought)

    // Collection achievements
    achievementStore.updateProgress('power_collector', stats.totalPowerUpsCollected)

    // Accuracy achievement
    if (stats.bestAccuracy >= 80) {
      achievementStore.unlockAchievement('sharpshooter')
    }

    // Score achievement
    achievementStore.updateProgress('millionaire', stats.totalScore)

    // Time achievement
    if (stats.longestSurvival >= 600) {
      achievementStore.updateProgress('time_warrior', stats.longestSurvival)
    }

    // Ship mastery achievements - TODO: Implement when killsByShipType is added to statistics
    // Note: Ship mastery tracking requires enhancement to statistics store

    // Upgrade achievement
    checkUpgradeAchievements()
  }, [checkUpgradeAchievements])

  return {
    checkKillAchievements,
    checkComboAchievements,
    checkWaveAchievements,
    checkBossAchievements,
    checkPowerUpAchievements,
    checkGameEndAchievements,
    checkSpeedAchievements,
    checkUpgradeAchievements,
    checkAllAchievements,
  }
}

// ------------------------------------------------------------------ //
//                    Helper Functions
// ------------------------------------------------------------------ //

/**
 * Get achievement completion percentage
 * @returns Percentage of achievements unlocked (0-100)
 */
export const getAchievementCompletionPercentage = (): number => {
  const achievements = useAchievementStore.getState().achievements
  const achievementIds = Object.keys(achievements) as AchievementId[]
  const unlockedCount = achievementIds.filter(id => achievements[id].unlocked).length
  return Math.round((unlockedCount / achievementIds.length) * 100)
}

/**
 * Get number of unlocked achievements
 * @returns Object with unlocked and total achievement counts
 */
export const getAchievementCounts = (): { unlocked: number; total: number } => {
  const achievements = useAchievementStore.getState().achievements
  const achievementIds = Object.keys(achievements) as AchievementId[]
  const unlocked = achievementIds.filter(id => achievements[id].unlocked).length
  return { unlocked, total: achievementIds.length }
}

/**
 * Get achievements by category
 * @param category - Achievement category to filter by
 * @returns Array of achievement IDs in the category
 */
export const getAchievementsByCategory = (category: AchievementCategory): AchievementId[] => {
  const categoryMap: Record<AchievementCategory, AchievementId[]> = {
    combat: ['first_blood', 'combo_master', 'speed_demon', 'sharpshooter'],
    survival: ['survivor_10', 'survivor_20', 'survivor_30', 'survivor_40', 'untouchable', 'pacifist', 'time_warrior'],
    boss: ['boss_slayer', 'destroyer_hunter', 'carrier_hunter', 'dreadnought_slayer'],
    collection: ['power_collector'],
    progression: ['millionaire', 'fully_upgraded'],
    mastery: ['ship_master_fighter', 'ship_master_scout', 'ship_master_tank', 'ship_master_interceptor'],
  }
  return categoryMap[category]
}

/**
 * Achievement categories
 */
export type AchievementCategory = 'combat' | 'survival' | 'boss' | 'collection' | 'progression' | 'mastery'

/**
 * Get all achievement categories
 * @returns Array of all achievement category names
 */
export const getAllCategories = (): AchievementCategory[] => {
  return ['combat', 'survival', 'boss', 'collection', 'progression', 'mastery']
}

/**
 * Get category display name
 * @param category - Achievement category
 * @returns Human-readable category name
 */
export const getCategoryDisplayName = (category: AchievementCategory): string => {
  const displayNames: Record<AchievementCategory, string> = {
    combat: 'Combat',
    survival: 'Survival',
    boss: 'Boss Battles',
    collection: 'Collection',
    progression: 'Progression',
    mastery: 'Ship Mastery',
  }
  return displayNames[category]
}

/**
 * Get category icon
 * @param category - Achievement category
 * @returns Emoji icon for the category
 */
export const getCategoryIcon = (category: AchievementCategory): string => {
  const icons: Record<AchievementCategory, string> = {
    combat: '⚔️',
    survival: '🛡️',
    boss: '👑',
    collection: '💎',
    progression: '🚀',
    mastery: '✈️',
  }
  return icons[category]
}
