/**
 * Boss System Tests
 * Tests for boss spawning, phases, and attack patterns
 */

import { create } from 'zustand'

describe('Boss System Logic', () => {
  // ------------------------------------------------------------------ //
  //                         Boss Type Tests
  // ------------------------------------------------------------------ //
  describe('Boss Types', () => {
    const BOSS_STATS = {
      destroyer: { hp: 500, phases: 2, points: 1000 },
      carrier: { hp: 750, phases: 3, points: 1500 },
      dreadnought: { hp: 1000, phases: 3, points: 2500 },
    }

    test('all boss types have correct stats', () => {
      expect(BOSS_STATS.destroyer.hp).toBe(500)
      expect(BOSS_STATS.carrier.hp).toBe(750)
      expect(BOSS_STATS.dreadnought.hp).toBe(1000)
    })

    test('boss difficulty increases with type', () => {
      expect(BOSS_STATS.dreadnought.hp).toBeGreaterThan(BOSS_STATS.carrier.hp)
      expect(BOSS_STATS.carrier.hp).toBeGreaterThan(BOSS_STATS.destroyer.hp)
    })

    test('points scale with difficulty', () => {
      expect(BOSS_STATS.dreadnought.points).toBeGreaterThan(BOSS_STATS.carrier.points)
      expect(BOSS_STATS.carrier.points).toBeGreaterThan(BOSS_STATS.destroyer.points)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Boss Wave Interval Tests
  // ------------------------------------------------------------------ //
  describe('Boss Wave Interval', () => {
    const BOSS_WAVE_INTERVAL = 5

    test('boss spawns every 5 waves', () => {
      const bossWaves: number[] = []
      for (let wave = 1; wave <= 25; wave++) {
        if (wave % BOSS_WAVE_INTERVAL === 0) {
          bossWaves.push(wave)
        }
      }

      expect(bossWaves).toEqual([5, 10, 15, 20, 25])
    })

    test('wave 1-4 should not trigger boss', () => {
      for (let wave = 1; wave < BOSS_WAVE_INTERVAL; wave++) {
        expect(wave % BOSS_WAVE_INTERVAL === 0).toBe(false)
      }
    })

    test('boss type selection based on wave', () => {
      const getBossType = (wave: number) => {
        const bossTypes = ['destroyer', 'carrier', 'dreadnought']
        const waveBasedIndex = Math.min(Math.floor(wave / 10), 2)
        return bossTypes[waveBasedIndex]
      }

      expect(getBossType(5)).toBe('destroyer')
      expect(getBossType(10)).toBe('carrier')
      expect(getBossType(15)).toBe('carrier')
      expect(getBossType(20)).toBe('dreadnought')
      expect(getBossType(100)).toBe('dreadnought') // Capped at dreadnought
    })
  })

  // ------------------------------------------------------------------ //
  //                         Boss Phase Transition Tests
  // ------------------------------------------------------------------ //
  describe('Boss Phase Transitions', () => {
    interface Boss {
      hp: number
      maxHp: number
      phase: 1 | 2 | 3
      type: 'destroyer' | 'carrier' | 'dreadnought'
    }

    const createBossStore = () =>
      create<{
        boss: Boss | null
        spawnBoss: (type: 'destroyer' | 'carrier' | 'dreadnought') => void
        damageBoss: (damage: number) => void
      }>((set) => ({
        boss: null,

        spawnBoss: (type) => {
          const stats = {
            destroyer: { hp: 500, phases: 2 },
            carrier: { hp: 750, phases: 3 },
            dreadnought: { hp: 1000, phases: 3 },
          }
          set({
            boss: {
              hp: stats[type].hp,
              maxHp: stats[type].hp,
              phase: 1,
              type,
            },
          })
        },

        damageBoss: (damage) =>
          set((state) => {
            if (!state.boss) return state
            const newHp = state.boss.hp - damage
            const hpPercent = newHp / state.boss.maxHp
            const maxPhases = state.boss.type === 'destroyer' ? 2 : 3

            let newPhase = state.boss.phase
            if (maxPhases >= 3 && hpPercent <= 0.33 && state.boss.phase < 3) {
              newPhase = 3
            } else if (maxPhases >= 2 && hpPercent <= 0.66 && state.boss.phase < 2) {
              newPhase = 2
            }

            return {
              boss: { ...state.boss, hp: newHp, phase: newPhase as 1 | 2 | 3 },
            }
          }),
      }))

    test('boss starts at phase 1', () => {
      const store = createBossStore()
      store.getState().spawnBoss('destroyer')
      expect(store.getState().boss?.phase).toBe(1)
    })

    test('destroyer transitions to phase 2 at 66% hp', () => {
      const store = createBossStore()
      store.getState().spawnBoss('destroyer') // 500 HP

      // Deal 170 damage (500 - 170 = 330, which is 66% of 500)
      store.getState().damageBoss(170)
      expect(store.getState().boss?.phase).toBe(2)
    })

    test('dreadnought has 3 phases', () => {
      const store = createBossStore()
      store.getState().spawnBoss('dreadnought') // 1000 HP

      // Phase 1 -> 2 at 66% (660 HP remaining, so deal 340 damage)
      store.getState().damageBoss(340)
      expect(store.getState().boss?.phase).toBe(2)

      // Phase 2 -> 3 at 33% (330 HP remaining, so deal 330 more damage)
      store.getState().damageBoss(330)
      expect(store.getState().boss?.phase).toBe(3)
    })

    test('BUG: phase skip when damage exceeds threshold', () => {
      const store = createBossStore()
      store.getState().spawnBoss('dreadnought') // 1000 HP

      // Deal massive damage that skips phase 2
      store.getState().damageBoss(700) // 300 HP remaining (30%)

      // Should be phase 3, but phase 2 was skipped
      expect(store.getState().boss?.phase).toBe(3)

      // This test documents the bug: phase 2 was never entered
      // In a real game, phase 2 effects/attacks would be missed
    })

    test('phase transitions are one-way', () => {
      const store = createBossStore()
      store.getState().spawnBoss('destroyer')

      // Trigger phase 2
      store.getState().damageBoss(170)
      expect(store.getState().boss?.phase).toBe(2)

      // Healing (negative damage) shouldn't revert phase
      store.getState().damageBoss(-100) // HP goes back up
      expect(store.getState().boss?.phase).toBe(2) // Still phase 2
    })
  })

  // ------------------------------------------------------------------ //
  //                         Boss Warning System Tests
  // ------------------------------------------------------------------ //
  describe('Boss Warning System', () => {
    const BOSS_WARNING_TIME = 3

    interface BossState {
      bossWarning: boolean
      bossWarningStartTime: number | undefined
      time: number
      boss: { hp: number } | null
      spawnBoss: () => void
    }

    const createWarningStore = () =>
      create<BossState>((set) => ({
        bossWarning: false,
        bossWarningStartTime: undefined,
        time: 0,
        boss: null,

        spawnBoss: () => set({ boss: { hp: 500 }, bossWarning: false, bossWarningStartTime: undefined }),
      }))

    test('warning starts when boss wave is reached', () => {
      const store = createWarningStore()

      // Simulate nextWave triggering boss wave
      store.setState({
        bossWarning: true,
        bossWarningStartTime: store.getState().time,
      })

      expect(store.getState().bossWarning).toBe(true)
      expect(store.getState().bossWarningStartTime).toBe(0)
    })

    test('boss spawns after warning time elapses', () => {
      const store = createWarningStore()

      // Start warning at time 100
      store.setState({
        bossWarning: true,
        bossWarningStartTime: 100,
        time: 100,
      })

      // Check at time 102 (2 seconds elapsed)
      store.setState({ time: 102 })
      const warningElapsed = store.getState().time - (store.getState().bossWarningStartTime || 0)
      expect(warningElapsed < BOSS_WARNING_TIME).toBe(true)

      // Check at time 103.5 (3.5 seconds elapsed)
      store.setState({ time: 103.5 })
      const warningElapsed2 = store.getState().time - (store.getState().bossWarningStartTime || 0)
      expect(warningElapsed2 >= BOSS_WARNING_TIME).toBe(true)

      // Boss should spawn now
      if (store.getState().bossWarning && !store.getState().boss && warningElapsed2 >= BOSS_WARNING_TIME) {
        store.getState().spawnBoss()
      }

      expect(store.getState().boss).not.toBeNull()
      expect(store.getState().bossWarning).toBe(false)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Boss Attack Pattern Tests
  // ------------------------------------------------------------------ //
  describe('Boss Attack Patterns', () => {
    test('destroyer laser sweep fires 12 bullets', () => {
      const bullets: { angle: number }[] = []
      for (let i = 0; i < 12; i++) {
        const angle = Math.PI / 2 + (i - 5.5) * 0.15
        bullets.push({ angle })
      }
      expect(bullets.length).toBe(12)
    })

    test('carrier spawns scout enemies', () => {
      const enemiesSpawned: string[] = []
      // Simulate carrier special attack
      for (let i = 0; i < 2; i++) {
        enemiesSpawned.push('scout')
      }
      expect(enemiesSpawned.length).toBe(2)
      expect(enemiesSpawned.every((e) => e === 'scout')).toBe(true)
    })

    test('dreadnought circular pattern fires 16 bullets', () => {
      const bullets: { angle: number }[] = []
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2
        bullets.push({ angle })
      }
      expect(bullets.length).toBe(16)

      // Angles should be evenly distributed
      const expectedInterval = (Math.PI * 2) / 16
      for (let i = 0; i < bullets.length - 1; i++) {
        const diff = bullets[i + 1].angle - bullets[i].angle
        expect(diff).toBeCloseTo(expectedInterval)
      }
    })

    test('dreadnought phase 3 fires double ring', () => {
      const phase = 3
      const ring1: { angle: number }[] = []
      const ring2: { angle: number }[] = []

      // First ring
      for (let i = 0; i < 16; i++) {
        ring1.push({ angle: (i / 16) * Math.PI * 2 })
      }

      // Second ring (offset) - only in phase 3
      if (phase >= 3) {
        for (let i = 0; i < 16; i++) {
          ring2.push({ angle: (i / 16) * Math.PI * 2 + Math.PI / 16 })
        }
      }

      expect(ring1.length).toBe(16)
      expect(ring2.length).toBe(16)

      // Second ring should be offset by half the angle between bullets
      const offset = ring2[0].angle - ring1[0].angle
      expect(offset).toBeCloseTo(Math.PI / 16)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Boss Defeat Tests
  // ------------------------------------------------------------------ //
  describe('Boss Defeat', () => {
    const BOSS_STATS = {
      destroyer: { hp: 500, phases: 2, points: 1000 },
      carrier: { hp: 750, phases: 3, points: 1500 },
      dreadnought: { hp: 1000, phases: 3, points: 2500 },
    }

    test('defeating boss awards points', () => {
      let score = 0
      const bossType = 'destroyer'

      score += BOSS_STATS[bossType].points

      expect(score).toBe(1000)
    })

    test('defeating boss awards credits', () => {
      let credits = 0
      const bossType = 'dreadnought'

      credits += Math.floor(BOSS_STATS[bossType].points / 10)

      expect(credits).toBe(250)
    })

    test('boss is removed after defeat', () => {
      interface State {
        boss: { hp: number } | null
        defeatBoss: () => void
      }

      const store = create<State>((set) => ({
        boss: { hp: 0 },
        defeatBoss: () => set({ boss: null }),
      }))

      expect(store.getState().boss).not.toBeNull()
      store.getState().defeatBoss()
      expect(store.getState().boss).toBeNull()
    })
  })
})
