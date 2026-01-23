import { useCallback } from "react"
import { useChallengesStore } from "../state/challengesStore"
import type { ChallengeType } from "../types/game"

// ------------------------------------------------------------------ //
//                         Challenge Engine
// ------------------------------------------------------------------ //

/**
 * Hook that provides challenge tracking functions
 * Call these functions when game events occur to update challenge progress
 */
export const useChallengeEngine = () => {
  /**
   * Record enemy kills for kill_count challenges
   * @param count - Number of enemies killed (default: 1)
   */
  const recordKill = useCallback((count: number = 1) => {
    const challenges = useChallengesStore.getState().challenges
    const killChallenges = challenges.filter((c) => c.type === 'kill_count' && !c.completed)

    killChallenges.forEach((challenge) => {
      const newProgress = challenge.progress + count
      useChallengesStore.getState().updateProgress(challenge.id, newProgress)
    })
  }, [])

  /**
   * Record combo achievements for combo challenges
   * @param comboCount - Current combo count
   */
  const recordCombo = useCallback((comboCount: number) => {
    const challenges = useChallengesStore.getState().challenges
    const comboChallenges = challenges.filter((c) => c.type === 'combo' && !c.completed)

    comboChallenges.forEach((challenge) => {
      // Only update if this combo is higher than current progress
      if (comboCount > challenge.progress) {
        useChallengesStore.getState().updateProgress(challenge.id, comboCount)
      }
    })
  }, [])

  /**
   * Record boss defeats for boss challenges
   * @param count - Number of bosses defeated (default: 1)
   */
  const recordBossDefeat = useCallback((count: number = 1) => {
    const challenges = useChallengesStore.getState().challenges
    const bossChallenges = challenges.filter((c) => c.type === 'boss' && !c.completed)

    bossChallenges.forEach((challenge) => {
      const newProgress = challenge.progress + count
      useChallengesStore.getState().updateProgress(challenge.id, newProgress)
    })
  }, [])

  /**
   * Record power-up collection for power_up challenges
   * @param count - Number of power-ups collected (default: 1)
   */
  const recordPowerUpCollected = useCallback((count: number = 1) => {
    const challenges = useChallengesStore.getState().challenges
    const powerUpChallenges = challenges.filter((c) => c.type === 'power_up' && !c.completed)

    powerUpChallenges.forEach((challenge) => {
      const newProgress = challenge.progress + count
      useChallengesStore.getState().updateProgress(challenge.id, newProgress)
    })
  }, [])

  /**
   * Record wave survival for survival challenges
   * @param wave - Current wave number
   */
  const recordWave = useCallback((wave: number) => {
    const challenges = useChallengesStore.getState().challenges
    const survivalChallenges = challenges.filter((c) => c.type === 'survival' && !c.completed)

    survivalChallenges.forEach((challenge) => {
      // Update progress to highest wave reached
      if (wave > challenge.progress) {
        useChallengesStore.getState().updateProgress(challenge.id, wave)
      }
    })
  }, [])

  /**
   * Record accuracy at end of game for accuracy challenges
   * @param accuracy - Accuracy percentage (0-100)
   */
  const recordAccuracy = useCallback((accuracy: number) => {
    const challenges = useChallengesStore.getState().challenges
    const accuracyChallenges = challenges.filter((c) => c.type === 'accuracy' && !c.completed)

    accuracyChallenges.forEach((challenge) => {
      // Only update if this accuracy is higher than current progress
      if (accuracy > challenge.progress) {
        useChallengesStore.getState().updateProgress(challenge.id, Math.floor(accuracy))
      }
    })
  }, [])

  /**
   * Record waves completed without taking damage for no_damage challenges
   * @param count - Number of no-damage waves completed (default: 1)
   */
  const recordNoDamageWave = useCallback((count: number = 1) => {
    const challenges = useChallengesStore.getState().challenges
    const noDamageChallenges = challenges.filter((c) => c.type === 'no_damage' && !c.completed)

    noDamageChallenges.forEach((challenge) => {
      const newProgress = challenge.progress + count
      useChallengesStore.getState().updateProgress(challenge.id, newProgress)
    })
  }, [])

  /**
   * Check and refresh challenges if a new day has started
   * Call this on app start and when returning from background
   */
  const checkDailyRefresh = useCallback(() => {
    useChallengesStore.getState().checkAndRefreshChallenges()
  }, [])

  /**
   * Initialize challenges on first load
   * Call this once when the app starts
   */
  const initializeChallenges = useCallback(() => {
    const challenges = useChallengesStore.getState().challenges
    if (challenges.length === 0) {
      useChallengesStore.getState().generateChallenges()
    }
  }, [])

  return {
    recordKill,
    recordCombo,
    recordBossDefeat,
    recordPowerUpCollected,
    recordWave,
    recordAccuracy,
    recordNoDamageWave,
    checkDailyRefresh,
    initializeChallenges,
  }
}

// ------------------------------------------------------------------ //
//                    Helper Functions
// ------------------------------------------------------------------ //

/**
 * Calculate the reward for a challenge based on its type and target
 * @param type - Challenge type
 * @param target - Target value
 * @returns Credit reward amount
 */
export const calculateChallengeReward = (type: ChallengeType, target: number): number => {
  const configs = {
    kill_count: { baseReward: 100, rewardMultiplier: 2, minTarget: 30 },
    combo: { baseReward: 150, rewardMultiplier: 10, minTarget: 3 },
    survival: { baseReward: 200, rewardMultiplier: 15, minTarget: 5 },
    boss: { baseReward: 300, rewardMultiplier: 100, minTarget: 1 },
    accuracy: { baseReward: 250, rewardMultiplier: 3, minTarget: 60 },
    power_up: { baseReward: 100, rewardMultiplier: 5, minTarget: 10 },
    no_damage: { baseReward: 200, rewardMultiplier: 20, minTarget: 3 },
  }

  const config = configs[type]
  return config.baseReward + Math.floor((target - config.minTarget) * config.rewardMultiplier)
}

/**
 * Get a human-readable description for a challenge
 * @param type - Challenge type
 * @param target - Target value
 * @returns Description string
 */
export const getChallengeDescription = (type: ChallengeType, target: number): string => {
  const descriptions: Record<ChallengeType, string> = {
    kill_count: `Destroy ${target} enemies`,
    combo: `Achieve a ${target}x combo`,
    survival: `Reach wave ${target}`,
    boss: `Defeat ${target} boss${target > 1 ? 'es' : ''}`,
    accuracy: `Achieve ${target}% accuracy`,
    power_up: `Collect ${target} power-ups`,
    no_damage: `Complete ${target} wave${target > 1 ? 's' : ''} without damage`,
  }

  return descriptions[type]
}

/**
 * Get the icon for a challenge type
 * @param type - Challenge type
 * @returns Emoji icon
 */
export const getChallengeIcon = (type: ChallengeType): string => {
  const icons: Record<ChallengeType, string> = {
    kill_count: '🎯',
    combo: '🔥',
    survival: '🛡️',
    boss: '👑',
    accuracy: '🎯',
    power_up: '💎',
    no_damage: '✨',
  }

  return icons[type]
}

/**
 * Get the name for a challenge type
 * @param type - Challenge type
 * @returns Challenge name
 */
export const getChallengeName = (type: ChallengeType): string => {
  const names: Record<ChallengeType, string> = {
    kill_count: 'Enemy Hunter',
    combo: 'Combo Streak',
    survival: 'Survivor',
    boss: 'Boss Battle',
    accuracy: 'Sharpshooter',
    power_up: 'Power Collector',
    no_damage: 'Flawless',
  }

  return names[type]
}
