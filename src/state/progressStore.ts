import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import secureStorage from '../utils/secureStorage'
import type {
  Achievement,
  AchievementId,
  GameStatistics,
  WeaponUpgrades,
  ShipType,
  EnemyType,
  BossType,
  SkinId,
} from '../types/game'
import { ACHIEVEMENTS, UPGRADE_COSTS } from '../types/game'
import type { ThemeId } from '../theme/types'

// ------------------------------------------------------------------ //
//                         Achievement Store
// ------------------------------------------------------------------ //

interface AchievementState {
  achievements: Record<AchievementId, Achievement>
  recentUnlock: AchievementId | null

  // Actions
  unlockAchievement: (id: AchievementId) => void
  updateProgress: (id: AchievementId, progress: number) => void
  clearRecentUnlock: () => void
  isUnlocked: (id: AchievementId) => boolean
  getProgress: (id: AchievementId) => number
  backup: () => Promise<boolean>
  restore: () => Promise<boolean>
}

const initializeAchievements = (): Record<AchievementId, Achievement> => {
  const achievements: Partial<Record<AchievementId, Achievement>> = {}
  for (const [id, data] of Object.entries(ACHIEVEMENTS)) {
    achievements[id as AchievementId] = {
      ...data,
      unlocked: false,
      progress: 0,
    }
  }
  return achievements as Record<AchievementId, Achievement>
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      achievements: initializeAchievements(),
      recentUnlock: null,

      unlockAchievement: (id) => {
        set((state) => {
          if (state.achievements[id].unlocked) return state

        const achievement = state.achievements[id]

        set({
          achievements: {
            ...state.achievements,
            [id]: {
              ...achievement,
              unlocked: true,
              unlockedAt: Date.now(),
            },
            recentUnlock: id,
          }
        })

        // Award credits for achievement
        const upgradesStore = useUpgradesStore.getState()
        upgradesStore.addCredits(achievement.creditReward)

        // Check if any skins can be unlocked with this achievement
        upgradesStore.checkAndUnlockAchievementSkins()
      },

      updateProgress: (id, progress) => {
        set((state) => {
          const achievement = state.achievements[id]
          if (achievement.unlocked) return state

          const target = achievement.target || 1
          const newProgress = Math.min(progress, target)

          if (newProgress >= target) {
            // Play celebration sound for new achievement
            playSfx('achievement_unlock')

            // Check if any skins can be unlocked with this achievement
            const upgradesStore = useUpgradesStore.getState()
            upgradesStore.checkAndUnlockAchievementSkins()

            return {
              achievements: {
                ...state.achievements,
                [id]: {
                  ...achievement,
                  progress: newProgress,
                  unlocked: true,
                  unlockedAt: Date.now(),
                },
              },
              recentUnlock: id,
            }
          }

          return {
            achievements: {
              ...state.achievements,
              [id]: {
                ...achievement,
                progress: newProgress,
              },
            },
          }
        })
      },

      clearRecentUnlock: () => set({ recentUnlock: null }),

      isUnlocked: (id) => get().achievements[id]?.unlocked ?? false,

      getProgress: (id) => get().achievements[id]?.progress ?? 0,

      backup: async () => {
        return await backupStore('achievements')
      },

      restore: async () => {
        return await restoreStore('achievements')
      },
    }),
    {
      name: 'space-shooter-achievements',
      storage: createJSONStorage(() => secureStorage),
    }
  )
)

// ------------------------------------------------------------------ //
//                         Statistics Store
// ------------------------------------------------------------------ //

interface SessionStats {
  score: number
  wave: number
  kills: number
  accuracy: number
  time: number
  date: number
}

interface StatisticsState {
  stats: GameStatistics
  lastSessionStats: SessionStats | null

  // Actions
  recordGameEnd: (score: number, wave: number, time: number, kills: number, shotsFired: number, shotsHit: number, shipType: ShipType) => void
  recordKill: (enemyType: EnemyType) => void
  recordBossKill: (bossType: BossType) => void
  recordPowerUpCollected: () => void
  updateHighestCombo: (combo: number) => void
  setFavoriteShip: (ship: ShipType) => void
  setFavoriteTheme: (theme: string) => void
  resetStats: () => void
  backup: () => Promise<boolean>
  restore: () => Promise<boolean>
}

const initializeShipStats = (): Record<ShipType, { games: number; bestScore: number; bestWave: number }> => {
  const shipTypes: ShipType[] = ['fighter', 'scout', 'tank', 'interceptor']
  const stats: Partial<Record<ShipType, { games: number; bestScore: number; bestWave: number }>> = {}
  for (const ship of shipTypes) {
    stats[ship] = {
      games: 0,
      bestScore: 0,
      bestWave: 0,
    }
  }
  return stats as Record<ShipType, { games: number; bestScore: number; bestWave: number }>
}

const initialStats: GameStatistics = {
  totalGames: 0,
  totalScore: 0,
  totalKills: 0,
  totalDeaths: 0,
  totalTimePlayed: 0,
  totalShotsFired: 0,
  totalShotsHit: 0,
  totalPowerUpsCollected: 0,
  totalBossesDefeated: 0,
  highestScore: 0,
  highestWave: 0,
  highestCombo: 0,
  longestSurvival: 0,
  bestAccuracy: 0,
  killsByEnemyType: {
    scout: 0,
    tank: 0,
    sniper: 0,
    bomber: 0,
    teleporter: 0,
  },
  killsByBossType: {
    destroyer: 0,
    carrier: 0,
    dreadnought: 0,
  },
  perShipStats: initializeShipStats(),
  favoriteShip: 'fighter',
  favoriteTheme: 'neon-void',
  lastPlayed: Date.now(),
}

export const useStatisticsStore = create<StatisticsState>()(
  persist(
    (set, get) => ({
      stats: { ...initialStats },
      lastSessionStats: null,

      recordGameEnd: (score, wave, time, kills, shotsFired, shotsHit, shipType) =>
        set((state) => {
          const accuracy = shotsFired > 0 ? (shotsHit / shotsFired) * 100 : 0
          const currentShipStats = state.stats.perShipStats?.[shipType] || {
            games: 0,
            bestScore: 0,
            bestWave: 0
          }
          return {
            stats: {
              ...state.stats,
              totalGames: state.stats.totalGames + 1,
              totalScore: state.stats.totalScore + score,
              totalKills: state.stats.totalKills + kills,
              totalDeaths: state.stats.totalDeaths + 1,
              totalTimePlayed: state.stats.totalTimePlayed + time,
              totalShotsFired: state.stats.totalShotsFired + shotsFired,
              totalShotsHit: state.stats.totalShotsHit + shotsHit,
              highestScore: Math.max(state.stats.highestScore, score),
              highestWave: Math.max(state.stats.highestWave, wave),
              longestSurvival: Math.max(state.stats.longestSurvival, time),
              bestAccuracy: Math.max(state.stats.bestAccuracy, accuracy),
              perShipStats: {
                ...state.stats.perShipStats || initializeShipStats(),
                [shipType]: {
                  games: currentShipStats.games + 1,
                  bestScore: Math.max(currentShipStats.bestScore, score),
                  bestWave: Math.max(currentShipStats.bestWave, wave),
                },
              },
              lastPlayed: Date.now(),
            },
            lastSessionStats: {
              score,
              wave,
              kills,
              accuracy,
              time,
              date: Date.now(),
            },
          }
        }),

      recordKill: (enemyType) =>
        set((state) => ({
          stats: {
            ...state.stats,
            killsByEnemyType: {
              ...state.stats.killsByEnemyType,
              [enemyType]: state.stats.killsByEnemyType[enemyType] + 1,
            },
          },
        })),

      recordBossKill: (bossType) =>
        set((state) => ({
          stats: {
            ...state.stats,
            totalBossesDefeated: state.stats.totalBossesDefeated + 1,
            killsByBossType: {
              ...state.stats.killsByBossType,
              [bossType]: state.stats.killsByBossType[bossType] + 1,
            },
          },
        })),

      recordPowerUpCollected: () =>
        set((state) => ({
          stats: {
            ...state.stats,
            totalPowerUpsCollected: state.stats.totalPowerUpsCollected + 1,
          },
        })),

      updateHighestCombo: (combo) =>
        set((state) => ({
          stats: {
            ...state.stats,
            highestCombo: Math.max(state.stats.highestCombo, combo),
          },
        })),

      setFavoriteShip: (ship) =>
        set((state) => ({
          stats: { ...state.stats, favoriteShip: ship },
        })),

      setFavoriteTheme: (theme) =>
        set((state) => ({
          stats: { ...state.stats, favoriteTheme: theme },
        })),

      resetStats: () => set({ stats: { ...initialStats } }),

      backup: async () => {
        return await backupStore('statistics')
      },

      restore: async () => {
        return await restoreStore('statistics')
      },
    }),
    {
      name: 'space-shooter-statistics',
      storage: createJSONStorage(() => secureStorage),
    }
  )
)

// ------------------------------------------------------------------ //
//                         Weapon Upgrades Store
// ------------------------------------------------------------------ //

interface UpgradesState {
  upgrades: WeaponUpgrades
  credits: number
  unlockedShips: ShipType[]
  unlockedSkins: Record<ShipType, SkinId[]>
  selectedSkins: Record<ShipType, SkinId>

  // Actions
  addCredits: (amount: number) => void
  spendCredits: (amount: number) => boolean
  purchaseUpgrade: (type: keyof WeaponUpgrades) => boolean
  unlockShip: (ship: ShipType) => void
  isShipUnlocked: (ship: ShipType) => boolean
  getUpgradeCost: (type: keyof WeaponUpgrades) => number | null
  unlockSkin: (ship: ShipType, skinId: SkinId) => boolean
  selectSkin: (ship: ShipType, skinId: SkinId) => boolean
  isSkinUnlocked: (ship: ShipType, skinId: SkinId) => boolean
  getSelectedSkin: (ship: ShipType) => SkinId
  canUnlockSkin: (ship: ShipType, skinId: SkinId) => { canUnlock: boolean; reason?: string }
  checkAndUnlockAchievementSkins: () => void
  resetUpgrades: () => void
  backup: () => Promise<boolean>
  restore: () => Promise<boolean>
}

const initialUpgrades: WeaponUpgrades = {
  damage: 0,
  fireRate: 0,
  bulletSize: 0,
  multiShot: 0,
  piercing: false,
}

export const SHIP_COSTS: Record<ShipType, number> = {
  fighter: 0,      // Default, always unlocked
  scout: 500,
  tank: 750,
  interceptor: 1000,
}

export const useUpgradesStore = create<UpgradesState>()(
  persist(
    (set, get) => ({
      upgrades: { ...initialUpgrades },
      credits: 0,
      unlockedShips: ['fighter'],
      unlockedSkins: {
        fighter: ['default'],
        scout: ['default'],
        tank: ['default'],
        interceptor: ['default'],
      },
      selectedSkins: {
        fighter: 'default',
        scout: 'default',
        tank: 'default',
        interceptor: 'default',
      },

      addCredits: (amount) =>
        set((state) => ({ credits: state.credits + amount })),

      spendCredits: (amount) => {
        const state = get()
        if (state.credits >= amount) {
          set({ credits: state.credits - amount })
          return true
        }
        return false
      },

      purchaseUpgrade: (type) => {
        const state = get()
        const currentLevel = type === 'piercing'
          ? (state.upgrades.piercing ? 1 : 0)
          : state.upgrades[type] as number
        const costs = UPGRADE_COSTS[type]
        const cost = costs[currentLevel]

        if (cost === undefined) return false // Already maxed
        if (state.credits < cost) return false

        set({
          credits: state.credits - cost,
          upgrades: {
            ...state.upgrades,
            [type]: type === 'piercing' ? true : currentLevel + 1,
          },
        })
        return true
      },

      unlockShip: (ship) => {
        const state = get()
        if (state.unlockedShips.includes(ship)) return

        const cost = SHIP_COSTS[ship]
        if (state.credits >= cost) {
          set({
            credits: state.credits - cost,
            unlockedShips: [...state.unlockedShips, ship],
          })
        }
      },

      isShipUnlocked: (ship) => get().unlockedShips.includes(ship),

      getUpgradeCost: (type) => {
        const state = get()
        const currentLevel = type === 'piercing'
          ? (state.upgrades.piercing ? 1 : 0)
          : state.upgrades[type] as number
        const costs = UPGRADE_COSTS[type]
        return costs[currentLevel] ?? null
      },

      unlockSkin: (ship, skinId) => {
        const state = get()
        if (state.unlockedSkins[ship]?.includes(skinId)) return true

        const skinData = SHIP_SKINS[ship]?.[skinId]
        if (!skinData) return false

        // Check if skin requires an achievement
        if (skinData.achievementRequired) {
          const achievementStore = useAchievementStore.getState()
          const hasAchievement = achievementStore.isUnlocked(skinData.achievementRequired as AchievementId)

          if (!hasAchievement) return false

          // Achievement-based skins are free to unlock once achievement is met
          set({
            unlockedSkins: {
              ...state.unlockedSkins,
              [ship]: [...(state.unlockedSkins[ship] || []), skinId],
            },
          })
          return true
        }

        // Credit-based unlock
        const cost = SKIN_COSTS[skinId]
        if (cost === undefined) return false
        if (state.credits < cost) return false

        set({
          credits: state.credits - cost,
          unlockedSkins: {
            ...state.unlockedSkins,
            [ship]: [...(state.unlockedSkins[ship] || []), skinId],
          },
        })
        return true
      },

      selectSkin: (ship, skinId) => {
        const state = get()
        if (!state.unlockedSkins[ship]?.includes(skinId)) return false

        set({
          selectedSkins: {
            ...state.selectedSkins,
            [ship]: skinId,
          },
        })
        return true
      },

      isSkinUnlocked: (ship, skinId) => get().unlockedSkins[ship]?.includes(skinId) ?? false,

      getSelectedSkin: (ship) => get().selectedSkins[ship] || 'default',

      canUnlockSkin: (ship, skinId) => {
        const state = get()
        if (state.unlockedSkins[ship]?.includes(skinId)) {
          return { canUnlock: false, reason: 'Already unlocked' }
        }

        const skinData = SHIP_SKINS[ship]?.[skinId]
        if (!skinData) {
          return { canUnlock: false, reason: 'Skin does not exist' }
        }

        // Check achievement requirement
        if (skinData.achievementRequired) {
          const achievementStore = useAchievementStore.getState()
          const hasAchievement = achievementStore.isUnlocked(skinData.achievementRequired as AchievementId)

          if (!hasAchievement) {
            const achievementData = ACHIEVEMENTS[skinData.achievementRequired as AchievementId]
            return {
              canUnlock: false,
              reason: `Requires achievement: ${achievementData?.name || 'Unknown'}`,
            }
          }

          return { canUnlock: true }
        }

        // Check credit requirement
        const cost = SKIN_COSTS[skinId]
        if (cost === undefined) {
          return { canUnlock: false, reason: 'Invalid skin cost' }
        }

        if (state.credits < cost) {
          return { canUnlock: false, reason: `Not enough credits (need ${cost})` }
        }

        return { canUnlock: true }
      },

      checkAndUnlockAchievementSkins: () => {
        const state = get()
        const achievementStore = useAchievementStore.getState()
        const shipTypes: ShipType[] = ['fighter', 'scout', 'tank', 'interceptor']

        shipTypes.forEach((ship) => {
          const skins = SHIP_SKINS[ship]
          Object.entries(skins).forEach(([skinId, skinData]) => {
            // Skip if already unlocked
            if (state.unlockedSkins[ship]?.includes(skinId as SkinId)) return

            // Check if skin requires achievement
            if (skinData.achievementRequired) {
              const hasAchievement = achievementStore.isUnlocked(skinData.achievementRequired as AchievementId)

              if (hasAchievement) {
                // Auto-unlock this achievement-based skin
                set((currentState) => ({
                  unlockedSkins: {
                    ...currentState.unlockedSkins,
                    [ship]: [...(currentState.unlockedSkins[ship] || []), skinId as SkinId],
                  },
                }))
              }
            }
          })
        })
      },

      resetUpgrades: () =>
        set({
          upgrades: { ...initialUpgrades },
          unlockedShips: ['fighter'],
          unlockedSkins: {
            fighter: ['default'],
            scout: ['default'],
            tank: ['default'],
            interceptor: ['default'],
          },
          selectedSkins: {
            fighter: 'default',
            scout: 'default',
            tank: 'default',
            interceptor: 'default',
          },
        }),

      backup: async () => {
        return await backupStore('upgrades')
      },

      restore: async () => {
        return await restoreStore('upgrades')
      },
    }),
    {
      name: 'space-shooter-upgrades',
      storage: createJSONStorage(() => secureStorage),
    }
  )
)

// ------------------------------------------------------------------ //
//                         Theme Unlock Store
// ------------------------------------------------------------------ //

interface ThemeUnlockCondition {
  type: 'default' | 'achievement' | 'purchase' | 'wave'
  requirement?: string | number
  cost?: number
}

const THEME_UNLOCK_CONDITIONS: Record<ThemeId, ThemeUnlockCondition> = {
  // Default themes - unlocked from start
  'neon-void': { type: 'default' },
  'nomad': { type: 'default' },
  'sakura': { type: 'default' },
  'forest-matrix': { type: 'default' },
  'inferno': { type: 'default' },
  'arctic': { type: 'default' },

  // New unlockable themes
  'halloween': { type: 'achievement', requirement: 'boss_slayer' },
  'synthwave': { type: 'purchase', cost: 750 },
  'winter': { type: 'wave', requirement: 15 },
}

interface ThemeUnlockState {
  unlockedThemes: ThemeId[]
  recentThemeUnlock: ThemeId | null

  // Actions
  unlockTheme: (themeId: ThemeId) => void
  purchaseTheme: (themeId: ThemeId) => boolean
  isThemeUnlocked: (themeId: ThemeId) => boolean
  getUnlockCondition: (themeId: ThemeId) => ThemeUnlockCondition
  getUnlockDescription: (themeId: ThemeId) => string
  clearRecentThemeUnlock: () => void
}

export const useThemeUnlockStore = create<ThemeUnlockState>()(
  persist(
    (set, get) => ({
      unlockedThemes: ['neon-void', 'nomad', 'sakura', 'forest-matrix', 'inferno', 'arctic'],
      recentThemeUnlock: null,

      unlockTheme: (themeId) =>
        set((state) => {
          if (state.unlockedThemes.includes(themeId)) return state
          return {
            unlockedThemes: [...state.unlockedThemes, themeId],
            recentThemeUnlock: themeId,
          }
        }),

      purchaseTheme: (themeId) => {
        const condition = THEME_UNLOCK_CONDITIONS[themeId]
        if (condition.type !== 'purchase' || !condition.cost) return false

        const state = get()
        if (state.unlockedThemes.includes(themeId)) return false

        // Check if player has enough credits and spend them
        const upgradesStore = useUpgradesStore.getState()
        if (upgradesStore.spendCredits(condition.cost)) {
          set({
            unlockedThemes: [...state.unlockedThemes, themeId],
            recentThemeUnlock: themeId,
          })
          return true
        }
        return false
      },

      isThemeUnlocked: (themeId) => get().unlockedThemes.includes(themeId),

      getUnlockCondition: (themeId) => THEME_UNLOCK_CONDITIONS[themeId],

      getUnlockDescription: (themeId) => {
        const condition = THEME_UNLOCK_CONDITIONS[themeId]
        switch (condition.type) {
          case 'default':
            return 'Unlocked'
          case 'achievement':
            const achievementId = condition.requirement as AchievementId
            const achievement = ACHIEVEMENTS[achievementId]
            return `Unlock: ${achievement?.name || 'Complete achievement'}`
          case 'purchase':
            return `Purchase for ${condition.cost} credits`
          case 'wave':
            return `Reach wave ${condition.requirement}`
          default:
            return 'Unknown'
        }
      },

      clearRecentThemeUnlock: () => set({ recentThemeUnlock: null }),
    }),
    {
      name: 'space-shooter-theme-unlocks',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

// ------------------------------------------------------------------ //
//                         Helper Hooks
// ------------------------------------------------------------------ //

export const useCredits = () => useUpgradesStore((s) => s.credits)
export const useUpgrades = () => useUpgradesStore((s) => s.upgrades)
export const useUnlockedShips = () => useUpgradesStore((s) => s.unlockedShips)
export const useUnlockedThemes = () => useThemeUnlockStore((s) => s.unlockedThemes)
export const useStats = () => useStatisticsStore((s) => s.stats)
export const useAchievements = () => useAchievementStore((s) => s.achievements)

// ------------------------------------------------------------------ //
//                         Theme Unlock Helpers
// ------------------------------------------------------------------ //

/**
 * Check and unlock achievement-based themes when achievement is unlocked
 * Call this after unlocking an achievement
 */
export const checkAchievementThemeUnlocks = (achievementId: AchievementId) => {
  const themeStore = useThemeUnlockStore.getState()

  // Check each theme's unlock condition
  Object.entries(THEME_UNLOCK_CONDITIONS).forEach(([themeId, condition]) => {
    if (condition.type === 'achievement' && condition.requirement === achievementId) {
      themeStore.unlockTheme(themeId as ThemeId)
    }
  })
}

/**
 * Check and unlock wave-based themes when reaching a wave milestone
 * Call this after completing a wave
 */
export const checkWaveThemeUnlocks = (currentWave: number) => {
  const themeStore = useThemeUnlockStore.getState()

  // Check each theme's unlock condition
  Object.entries(THEME_UNLOCK_CONDITIONS).forEach(([themeId, condition]) => {
    if (condition.type === 'wave' && typeof condition.requirement === 'number') {
      if (currentWave >= condition.requirement) {
        themeStore.unlockTheme(themeId as ThemeId)
      }
    }
  })
}
