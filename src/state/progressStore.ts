import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type {
  Achievement,
  AchievementId,
  GameStatistics,
  WeaponUpgrades,
  ShipType,
  EnemyType,
  BossType,
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

      unlockAchievement: (id) =>
        set((state) => {
          if (state.achievements[id].unlocked) return state
          return {
            achievements: {
              ...state.achievements,
              [id]: {
                ...state.achievements[id],
                unlocked: true,
                unlockedAt: Date.now(),
              },
            },
            recentUnlock: id,
          }
        }),

      updateProgress: (id, progress) =>
        set((state) => {
          const achievement = state.achievements[id]
          if (achievement.unlocked) return state

          const target = achievement.target || 1
          const newProgress = Math.min(progress, target)

          if (newProgress >= target) {
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
        }),

      clearRecentUnlock: () => set({ recentUnlock: null }),

      isUnlocked: (id) => get().achievements[id]?.unlocked ?? false,

      getProgress: (id) => get().achievements[id]?.progress ?? 0,
    }),
    {
      name: 'space-shooter-achievements',
      storage: createJSONStorage(() => AsyncStorage),
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
  recordGameEnd: (score: number, wave: number, time: number, kills: number, shotsFired: number, shotsHit: number) => void
  recordKill: (enemyType: EnemyType) => void
  recordBossKill: (bossType: BossType) => void
  recordPowerUpCollected: () => void
  updateHighestCombo: (combo: number) => void
  setFavoriteShip: (ship: ShipType) => void
  setFavoriteTheme: (theme: string) => void
  resetStats: () => void
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
  },
  killsByBossType: {
    destroyer: 0,
    carrier: 0,
    dreadnought: 0,
  },
  favoriteShip: 'fighter',
  favoriteTheme: 'neon-void',
  lastPlayed: Date.now(),
}

export const useStatisticsStore = create<StatisticsState>()(
  persist(
    (set, get) => ({
      stats: { ...initialStats },
      lastSessionStats: null,

      recordGameEnd: (score, wave, time, kills, shotsFired, shotsHit) =>
        set((state) => {
          const accuracy = shotsFired > 0 ? (shotsHit / shotsFired) * 100 : 0
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
    }),
    {
      name: 'space-shooter-statistics',
      storage: createJSONStorage(() => AsyncStorage),
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

  // Actions
  addCredits: (amount: number) => void
  spendCredits: (amount: number) => boolean
  purchaseUpgrade: (type: keyof WeaponUpgrades) => boolean
  unlockShip: (ship: ShipType) => void
  isShipUnlocked: (ship: ShipType) => boolean
  getUpgradeCost: (type: keyof WeaponUpgrades) => number | null
  resetUpgrades: () => void
}

const initialUpgrades: WeaponUpgrades = {
  damage: 0,
  fireRate: 0,
  bulletSize: 0,
  multiShot: 0,
  piercing: false,
}

const SHIP_COSTS: Record<ShipType, number> = {
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

      resetUpgrades: () =>
        set({
          upgrades: { ...initialUpgrades },
          unlockedShips: ['fighter'],
        }),
    }),
    {
      name: 'space-shooter-upgrades',
      storage: createJSONStorage(() => AsyncStorage),
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
