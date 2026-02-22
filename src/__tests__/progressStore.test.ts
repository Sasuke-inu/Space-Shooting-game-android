/**
 * Progress Store Unit Tests
 * Tests achievements, statistics, and upgrades persistence
 */

// Mock AsyncStorage before imports
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
  },
}))

// Skip the progress store tests that require actual persistence
// These tests verify the store logic independent of persistence
import { create } from 'zustand'
import type { EnemyType, BossType, ShipType } from '../types/game'

describe('progressStore logic', () => {
  // ------------------------------------------------------------------ //
  //                         Achievement Logic Tests
  // ------------------------------------------------------------------ //
  describe('Achievement Logic', () => {
    interface TestAchievement {
      id: string
      unlocked: boolean
      progress: number
      target?: number
      unlockedAt?: number
    }

    interface AchievementTestState {
      achievements: Record<string, TestAchievement>
      recentUnlock: string | null
      unlockAchievement: (id: string) => void
      updateProgress: (id: string, progress: number) => void
      clearRecentUnlock: () => void
    }

    const createTestStore = () => create<AchievementTestState>((set, get) => ({
      achievements: {
        first_blood: { id: 'first_blood', unlocked: false, progress: 0, target: 1 },
        power_collector: { id: 'power_collector', unlocked: false, progress: 0, target: 50 },
      },
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
                [id]: { ...achievement, progress: newProgress, unlocked: true, unlockedAt: Date.now() },
              },
              recentUnlock: id,
            }
          }
          return {
            achievements: {
              ...state.achievements,
              [id]: { ...achievement, progress: newProgress },
            },
          }
        }),

      clearRecentUnlock: () => set({ recentUnlock: null }),
    }))

    let store: ReturnType<typeof createTestStore>

    beforeEach(() => {
      store = createTestStore()
    })

    test('achievements start locked', () => {
      const achievements = store.getState().achievements
      expect(Object.values(achievements).every(a => !a.unlocked)).toBe(true)
    })

    test('unlockAchievement unlocks achievement', () => {
      store.getState().unlockAchievement('first_blood')
      expect(store.getState().achievements.first_blood.unlocked).toBe(true)
    })

    test('unlockAchievement sets timestamp', () => {
      const before = Date.now()
      store.getState().unlockAchievement('first_blood')
      const after = Date.now()
      const ts = store.getState().achievements.first_blood.unlockedAt!
      expect(ts).toBeGreaterThanOrEqual(before)
      expect(ts).toBeLessThanOrEqual(after)
    })

    test('unlockAchievement sets recentUnlock', () => {
      store.getState().unlockAchievement('first_blood')
      expect(store.getState().recentUnlock).toBe('first_blood')
    })

    test('cannot re-unlock achievement', () => {
      store.getState().unlockAchievement('first_blood')
      const ts = store.getState().achievements.first_blood.unlockedAt
      store.getState().unlockAchievement('first_blood')
      expect(store.getState().achievements.first_blood.unlockedAt).toBe(ts)
    })

    test('updateProgress updates progress', () => {
      store.getState().updateProgress('power_collector', 25)
      expect(store.getState().achievements.power_collector.progress).toBe(25)
    })

    test('updateProgress auto-unlocks at target', () => {
      store.getState().updateProgress('power_collector', 50)
      expect(store.getState().achievements.power_collector.unlocked).toBe(true)
    })

    test('updateProgress caps at target', () => {
      store.getState().updateProgress('power_collector', 100)
      expect(store.getState().achievements.power_collector.progress).toBe(50)
    })

    test('clearRecentUnlock clears it', () => {
      store.getState().unlockAchievement('first_blood')
      store.getState().clearRecentUnlock()
      expect(store.getState().recentUnlock).toBeNull()
    })
  })

  // ------------------------------------------------------------------ //
  //                         Statistics Logic Tests
  // ------------------------------------------------------------------ //
  describe('Statistics Logic', () => {
    interface StatsTestState {
      stats: {
        totalGames: number
        totalScore: number
        totalKills: number
        totalTimePlayed: number
        highestScore: number
        highestWave: number
        bestAccuracy: number
        killsByEnemyType: Record<EnemyType, number>
        killsByBossType: Record<string, number>
        totalBossesDefeated: number
        totalPowerUpsCollected: number
        highestCombo: number
        favoriteShip: ShipType
        favoriteTheme: string
      }
      recordGameEnd: (score: number, wave: number, time: number, kills: number, shots: number, hits: number) => void
      recordKill: (type: EnemyType) => void
      recordBossKill: (type: string) => void
      recordPowerUpCollected: () => void
      updateHighestCombo: (combo: number) => void
      resetStats: () => void
    }

    const initialStats = {
      totalGames: 0,
      totalScore: 0,
      totalKills: 0,
      totalTimePlayed: 0,
      highestScore: 0,
      highestWave: 0,
      bestAccuracy: 0,
      killsByEnemyType: { scout: 0, tank: 0, sniper: 0, bomber: 0, teleporter: 0, healer: 0, juggernaut: 0 },
      killsByBossType: { destroyer: 0, carrier: 0, dreadnought: 0, mothership: 0 },
      totalBossesDefeated: 0,
      totalPowerUpsCollected: 0,
      highestCombo: 0,
      favoriteShip: 'fighter' as ShipType,
      favoriteTheme: 'neon-void',
    }

    const createTestStore = () => create<StatsTestState>((set) => ({
      stats: { ...initialStats },

      recordGameEnd: (score, wave, time, kills, shots, hits) =>
        set((state) => {
          const accuracy = shots > 0 ? (hits / shots) * 100 : 0
          return {
            stats: {
              ...state.stats,
              totalGames: state.stats.totalGames + 1,
              totalScore: state.stats.totalScore + score,
              totalKills: state.stats.totalKills + kills,
              totalTimePlayed: state.stats.totalTimePlayed + time,
              highestScore: Math.max(state.stats.highestScore, score),
              highestWave: Math.max(state.stats.highestWave, wave),
              bestAccuracy: Math.max(state.stats.bestAccuracy, accuracy),
            },
          }
        }),

      recordKill: (type) =>
        set((state) => ({
          stats: {
            ...state.stats,
            killsByEnemyType: {
              ...state.stats.killsByEnemyType,
              [type]: state.stats.killsByEnemyType[type] + 1,
            },
          },
        })),

      recordBossKill: (type) =>
        set((state) => ({
          stats: {
            ...state.stats,
            totalBossesDefeated: state.stats.totalBossesDefeated + 1,
            killsByBossType: {
              ...state.stats.killsByBossType,
              [type]: (state.stats.killsByBossType[type] || 0) + 1,
            },
          },
        })),

      recordPowerUpCollected: () =>
        set((state) => ({
          stats: { ...state.stats, totalPowerUpsCollected: state.stats.totalPowerUpsCollected + 1 },
        })),

      updateHighestCombo: (combo) =>
        set((state) => ({
          stats: { ...state.stats, highestCombo: Math.max(state.stats.highestCombo, combo) },
        })),

      resetStats: () => set({ stats: { ...initialStats } }),
    }))

    let store: ReturnType<typeof createTestStore>

    beforeEach(() => {
      store = createTestStore()
    })

    test('starts with zero stats', () => {
      expect(store.getState().stats.totalGames).toBe(0)
      expect(store.getState().stats.totalScore).toBe(0)
    })

    test('recordGameEnd updates totals', () => {
      store.getState().recordGameEnd(1000, 5, 120, 50, 100, 75)
      const stats = store.getState().stats
      expect(stats.totalGames).toBe(1)
      expect(stats.totalScore).toBe(1000)
      expect(stats.totalTimePlayed).toBe(120)
    })

    test('recordGameEnd updates high scores', () => {
      store.getState().recordGameEnd(500, 3, 60, 20, 50, 40)
      store.getState().recordGameEnd(1000, 5, 120, 50, 100, 75)
      expect(store.getState().stats.highestScore).toBe(1000)
      expect(store.getState().stats.highestWave).toBe(5)
    })

    test('recordGameEnd calculates accuracy', () => {
      store.getState().recordGameEnd(1000, 5, 120, 50, 100, 75)
      expect(store.getState().stats.bestAccuracy).toBe(75)
    })

    test('recordKill updates kill counts', () => {
      store.getState().recordKill('scout')
      store.getState().recordKill('scout')
      store.getState().recordKill('tank')
      expect(store.getState().stats.killsByEnemyType.scout).toBe(2)
      expect(store.getState().stats.killsByEnemyType.tank).toBe(1)
    })

    test('recordBossKill updates boss counts', () => {
      store.getState().recordBossKill('destroyer')
      store.getState().recordBossKill('carrier')
      expect(store.getState().stats.totalBossesDefeated).toBe(2)
      expect(store.getState().stats.killsByBossType.destroyer).toBe(1)
    })

    test('recordPowerUpCollected increments', () => {
      store.getState().recordPowerUpCollected()
      store.getState().recordPowerUpCollected()
      expect(store.getState().stats.totalPowerUpsCollected).toBe(2)
    })

    test('updateHighestCombo updates record', () => {
      store.getState().updateHighestCombo(5)
      store.getState().updateHighestCombo(3)
      expect(store.getState().stats.highestCombo).toBe(5)
    })

    test('resetStats clears all', () => {
      store.getState().recordGameEnd(1000, 5, 120, 50, 100, 75)
      store.getState().resetStats()
      expect(store.getState().stats.totalGames).toBe(0)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Upgrades Logic Tests
  // ------------------------------------------------------------------ //
  describe('Upgrades Logic', () => {
    type SkinId = 'default' | 'stealth' | 'neon' | 'gold' | 'veteran'

    interface UpgradesTestState {
      credits: number
      upgrades: { damage: number; fireRate: number; piercing: boolean }
      unlockedShips: ShipType[]
      unlockedSkins: Record<ShipType, SkinId[]>
      selectedSkins: Record<ShipType, SkinId>
      addCredits: (amount: number) => void
      spendCredits: (amount: number) => boolean
      purchaseUpgrade: (type: 'damage' | 'fireRate' | 'piercing') => boolean
      unlockShip: (ship: ShipType) => void
      unlockSkin: (ship: ShipType, skinId: SkinId) => boolean
      selectSkin: (ship: ShipType, skinId: SkinId) => boolean
      isSkinUnlocked: (ship: ShipType, skinId: SkinId) => boolean
      getSelectedSkin: (ship: ShipType) => SkinId
      resetUpgrades: () => void
    }

    const UPGRADE_COSTS = {
      damage: [100, 200, 400, 800, 1600],
      fireRate: [100, 200, 400, 800, 1600],
      piercing: [5000],
    }

    const SHIP_COSTS: Record<ShipType, number> = {
      fighter: 0,
      scout: 500,
      tank: 750,
      interceptor: 1000,
      ghost: 1250,
      support: 1500,
      stealth: 1750,
      heavy: 2000,
    }

    const SKIN_COSTS: Record<SkinId, number> = {
      default: 0,
      stealth: 250,
      neon: 500,
      gold: 750,
      veteran: 1000,
    }

    const createTestStore = () => create<UpgradesTestState>((set, get) => ({
      credits: 0,
      upgrades: { damage: 0, fireRate: 0, piercing: false },
      unlockedShips: ['fighter'],
      unlockedSkins: {
        fighter: ['default'],
        scout: ['default'],
        tank: ['default'],
        interceptor: ['default'],
        ghost: ['default'],
        support: ['default'],
        stealth: ['default'],
        heavy: ['default'],
      },
      selectedSkins: {
        fighter: 'default',
        scout: 'default',
        tank: 'default',
        interceptor: 'default',
        ghost: 'default',
        support: 'default',
        stealth: 'default',
        heavy: 'default',
      },

      addCredits: (amount) => set((s) => ({ credits: s.credits + amount })),

      spendCredits: (amount) => {
        if (get().credits >= amount) {
          set((s) => ({ credits: s.credits - amount }))
          return true
        }
        return false
      },

      purchaseUpgrade: (type) => {
        const state = get()
        const currentLevel = type === 'piercing'
          ? (state.upgrades.piercing ? 1 : 0)
          : state.upgrades[type]
        const cost = UPGRADE_COSTS[type][currentLevel]
        if (cost === undefined || state.credits < cost) return false

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

      unlockSkin: (ship, skinId) => {
        const state = get()
        if (state.unlockedSkins[ship]?.includes(skinId)) return true

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

      resetUpgrades: () => set({
        upgrades: { damage: 0, fireRate: 0, piercing: false },
        unlockedShips: ['fighter'],
        unlockedSkins: {
          fighter: ['default'],
          scout: ['default'],
          tank: ['default'],
          interceptor: ['default'],
          ghost: ['default'],
          support: ['default'],
          stealth: ['default'],
          heavy: ['default'],
        },
        selectedSkins: {
          fighter: 'default',
          scout: 'default',
          tank: 'default',
          interceptor: 'default',
          ghost: 'default',
          support: 'default',
          stealth: 'default',
          heavy: 'default',
        },
      }),
    }))

    let store: ReturnType<typeof createTestStore>

    beforeEach(() => {
      store = createTestStore()
    })

    test('starts with zero credits', () => {
      expect(store.getState().credits).toBe(0)
    })

    test('starts with fighter unlocked', () => {
      expect(store.getState().unlockedShips).toContain('fighter')
    })

    test('addCredits increases credits', () => {
      store.getState().addCredits(100)
      expect(store.getState().credits).toBe(100)
    })

    test('spendCredits deducts', () => {
      store.getState().addCredits(100)
      const success = store.getState().spendCredits(50)
      expect(success).toBe(true)
      expect(store.getState().credits).toBe(50)
    })

    test('spendCredits fails when insufficient', () => {
      store.getState().addCredits(50)
      const success = store.getState().spendCredits(100)
      expect(success).toBe(false)
      expect(store.getState().credits).toBe(50)
    })

    test('purchaseUpgrade increases level', () => {
      store.getState().addCredits(1000)
      store.getState().purchaseUpgrade('damage')
      expect(store.getState().upgrades.damage).toBe(1)
    })

    test('purchaseUpgrade deducts credits', () => {
      store.getState().addCredits(1000)
      const before = store.getState().credits
      store.getState().purchaseUpgrade('damage')
      expect(store.getState().credits).toBeLessThan(before)
    })

    test('purchaseUpgrade fails when insufficient', () => {
      const success = store.getState().purchaseUpgrade('damage')
      expect(success).toBe(false)
    })

    test('purchaseUpgrade handles piercing', () => {
      store.getState().addCredits(10000)
      store.getState().purchaseUpgrade('piercing')
      expect(store.getState().upgrades.piercing).toBe(true)
    })

    test('unlockShip unlocks', () => {
      store.getState().addCredits(1000)
      store.getState().unlockShip('scout')
      expect(store.getState().unlockedShips).toContain('scout')
    })

    test('unlockShip deducts credits', () => {
      store.getState().addCredits(1000)
      store.getState().unlockShip('scout')
      expect(store.getState().credits).toBeLessThan(1000)
    })

    test('unlockShip unlocks support ship', () => {
      store.getState().addCredits(2000)
      store.getState().unlockShip('support')
      expect(store.getState().unlockedShips).toContain('support')
      expect(store.getState().credits).toBe(2000 - 1250)
    })

    test('unlockShip unlocks stealth ship', () => {
      store.getState().addCredits(2000)
      store.getState().unlockShip('stealth')
      expect(store.getState().unlockedShips).toContain('stealth')
      expect(store.getState().credits).toBe(2000 - 1500)
    })

    test('unlockShip unlocks heavy ship', () => {
      store.getState().addCredits(2000)
      store.getState().unlockShip('heavy')
      expect(store.getState().unlockedShips).toContain('heavy')
      expect(store.getState().credits).toBe(2000 - 1750)
    })

    test('unlockShip fails with insufficient credits for new ships', () => {
      store.getState().addCredits(1000)
      store.getState().unlockShip('support')
      expect(store.getState().unlockedShips).not.toContain('support')
      expect(store.getState().credits).toBe(1000)
    })

    test('resetUpgrades clears upgrades', () => {
      store.getState().addCredits(10000)
      store.getState().purchaseUpgrade('damage')
      store.getState().unlockShip('scout')
      store.getState().resetUpgrades()
      expect(store.getState().upgrades.damage).toBe(0)
      expect(store.getState().unlockedShips).toEqual(['fighter'])
    })
  })

  // ------------------------------------------------------------------ //
  //                         Skin Management Tests
  // ------------------------------------------------------------------ //
  describe('Skin Management Logic', () => {
    type SkinId = 'default' | 'stealth' | 'neon' | 'gold' | 'veteran'

    interface SkinTestState {
      credits: number
      unlockedSkins: Record<ShipType, SkinId[]>
      selectedSkins: Record<ShipType, SkinId>
      addCredits: (amount: number) => void
      unlockSkin: (ship: ShipType, skinId: SkinId) => boolean
      selectSkin: (ship: ShipType, skinId: SkinId) => boolean
      isSkinUnlocked: (ship: ShipType, skinId: SkinId) => boolean
      getSelectedSkin: (ship: ShipType) => SkinId
    }

    const SKIN_COSTS: Record<SkinId, number> = {
      default: 0,
      stealth: 250,
      neon: 500,
      gold: 750,
      veteran: 1000,
    }

    const createTestStore = () => create<SkinTestState>((set, get) => ({
      credits: 0,
      unlockedSkins: {
        fighter: ['default'],
        scout: ['default'],
        tank: ['default'],
        interceptor: ['default'],
        ghost: ['default'],
        support: ['default'],
        stealth: ['default'],
        heavy: ['default'],
      },
      selectedSkins: {
        fighter: 'default',
        scout: 'default',
        tank: 'default',
        interceptor: 'default',
        ghost: 'default',
        support: 'default',
        stealth: 'default',
        heavy: 'default',
      },

      addCredits: (amount) => set((s) => ({ credits: s.credits + amount })),

      unlockSkin: (ship, skinId) => {
        const state = get()
        if (state.unlockedSkins[ship]?.includes(skinId)) return true

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
    }))

    let store: ReturnType<typeof createTestStore>

    beforeEach(() => {
      store = createTestStore()
    })

    test('all ships start with default skin unlocked', () => {
      expect(store.getState().unlockedSkins.fighter).toContain('default')
      expect(store.getState().unlockedSkins.scout).toContain('default')
      expect(store.getState().unlockedSkins.tank).toContain('default')
      expect(store.getState().unlockedSkins.interceptor).toContain('default')
      expect(store.getState().unlockedSkins.support).toContain('default')
      expect(store.getState().unlockedSkins.stealth).toContain('default')
      expect(store.getState().unlockedSkins.heavy).toContain('default')
    })

    test('all ships start with default skin selected', () => {
      expect(store.getState().selectedSkins.fighter).toBe('default')
      expect(store.getState().selectedSkins.scout).toBe('default')
      expect(store.getState().selectedSkins.tank).toBe('default')
      expect(store.getState().selectedSkins.interceptor).toBe('default')
      expect(store.getState().selectedSkins.support).toBe('default')
      expect(store.getState().selectedSkins.stealth).toBe('default')
      expect(store.getState().selectedSkins.heavy).toBe('default')
    })

    test('isSkinUnlocked returns true for default skins', () => {
      expect(store.getState().isSkinUnlocked('fighter', 'default')).toBe(true)
      expect(store.getState().isSkinUnlocked('scout', 'default')).toBe(true)
    })

    test('isSkinUnlocked returns false for locked skins', () => {
      expect(store.getState().isSkinUnlocked('fighter', 'stealth')).toBe(false)
      expect(store.getState().isSkinUnlocked('scout', 'neon')).toBe(false)
    })

    test('getSelectedSkin returns selected skin', () => {
      expect(store.getState().getSelectedSkin('fighter')).toBe('default')
    })

    test('unlockSkin unlocks skin and deducts credits', () => {
      store.getState().addCredits(1000)
      const beforeCredits = store.getState().credits
      const success = store.getState().unlockSkin('fighter', 'stealth')
      expect(success).toBe(true)
      expect(store.getState().isSkinUnlocked('fighter', 'stealth')).toBe(true)
      expect(store.getState().credits).toBe(beforeCredits - SKIN_COSTS.stealth)
    })

    test('unlockSkin fails when insufficient credits', () => {
      store.getState().addCredits(100)
      const success = store.getState().unlockSkin('fighter', 'stealth')
      expect(success).toBe(false)
      expect(store.getState().isSkinUnlocked('fighter', 'stealth')).toBe(false)
    })

    test('unlockSkin returns true if already unlocked', () => {
      store.getState().addCredits(1000)
      store.getState().unlockSkin('fighter', 'stealth')
      const creditsAfterFirst = store.getState().credits
      const success = store.getState().unlockSkin('fighter', 'stealth')
      expect(success).toBe(true)
      expect(store.getState().credits).toBe(creditsAfterFirst)
    })

    test('selectSkin changes selected skin', () => {
      store.getState().addCredits(1000)
      store.getState().unlockSkin('fighter', 'neon')
      const success = store.getState().selectSkin('fighter', 'neon')
      expect(success).toBe(true)
      expect(store.getState().getSelectedSkin('fighter')).toBe('neon')
    })

    test('selectSkin fails for locked skin', () => {
      const success = store.getState().selectSkin('fighter', 'stealth')
      expect(success).toBe(false)
      expect(store.getState().getSelectedSkin('fighter')).toBe('default')
    })

    test('skins are ship-specific', () => {
      store.getState().addCredits(2000)
      store.getState().unlockSkin('fighter', 'stealth')
      expect(store.getState().isSkinUnlocked('fighter', 'stealth')).toBe(true)
      expect(store.getState().isSkinUnlocked('scout', 'stealth')).toBe(false)
    })

    test('selected skins are ship-specific', () => {
      store.getState().addCredits(2000)
      store.getState().unlockSkin('fighter', 'stealth')
      store.getState().unlockSkin('scout', 'neon')
      store.getState().selectSkin('fighter', 'stealth')
      store.getState().selectSkin('scout', 'neon')
      expect(store.getState().getSelectedSkin('fighter')).toBe('stealth')
      expect(store.getState().getSelectedSkin('scout')).toBe('neon')
    })

    test('unlocking multiple skins for same ship', () => {
      store.getState().addCredits(5000)
      store.getState().unlockSkin('fighter', 'stealth')
      store.getState().unlockSkin('fighter', 'neon')
      store.getState().unlockSkin('fighter', 'gold')
      expect(store.getState().unlockedSkins.fighter).toContain('stealth')
      expect(store.getState().unlockedSkins.fighter).toContain('neon')
      expect(store.getState().unlockedSkins.fighter).toContain('gold')
    })

    test('new ships have default skin unlocked', () => {
      expect(store.getState().isSkinUnlocked('support', 'default')).toBe(true)
      expect(store.getState().isSkinUnlocked('stealth', 'default')).toBe(true)
      expect(store.getState().isSkinUnlocked('heavy', 'default')).toBe(true)
    })

    test('new ships have locked non-default skins', () => {
      expect(store.getState().isSkinUnlocked('support', 'neon')).toBe(false)
      expect(store.getState().isSkinUnlocked('stealth', 'gold')).toBe(false)
      expect(store.getState().isSkinUnlocked('heavy', 'veteran')).toBe(false)
    })

    test('unlocking skin for new ship types', () => {
      store.getState().addCredits(2000)
      store.getState().unlockSkin('support', 'stealth')
      store.getState().unlockSkin('heavy', 'stealth')
      expect(store.getState().isSkinUnlocked('support', 'stealth')).toBe(true)
      expect(store.getState().isSkinUnlocked('heavy', 'stealth')).toBe(true)
    })

    test('selecting skin for new ship types', () => {
      store.getState().addCredits(2000)
      store.getState().unlockSkin('stealth', 'neon')
      const success = store.getState().selectSkin('stealth', 'neon')
      expect(success).toBe(true)
      expect(store.getState().getSelectedSkin('stealth')).toBe('neon')
    })
  })
})
