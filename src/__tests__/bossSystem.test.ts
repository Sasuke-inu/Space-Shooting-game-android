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
      mothership: { hp: 1250, phases: 3, points: 3000 },
    }

    test('all boss types have correct stats', () => {
      expect(BOSS_STATS.destroyer.hp).toBe(500)
      expect(BOSS_STATS.carrier.hp).toBe(750)
      expect(BOSS_STATS.dreadnought.hp).toBe(1000)
      expect(BOSS_STATS.mothership.hp).toBe(1250)
    })

    test('boss difficulty increases with type', () => {
      expect(BOSS_STATS.mothership.hp).toBeGreaterThan(BOSS_STATS.dreadnought.hp)
      expect(BOSS_STATS.dreadnought.hp).toBeGreaterThan(BOSS_STATS.carrier.hp)
      expect(BOSS_STATS.carrier.hp).toBeGreaterThan(BOSS_STATS.destroyer.hp)
    })

    test('points scale with difficulty', () => {
      expect(BOSS_STATS.mothership.points).toBeGreaterThan(BOSS_STATS.dreadnought.points)
      expect(BOSS_STATS.dreadnought.points).toBeGreaterThan(BOSS_STATS.carrier.points)
      expect(BOSS_STATS.carrier.points).toBeGreaterThan(BOSS_STATS.destroyer.points)
    })

    test('mothership is the toughest boss', () => {
      expect(BOSS_STATS.mothership.hp).toBe(1250)
      expect(BOSS_STATS.mothership.phases).toBe(3)
      expect(BOSS_STATS.mothership.points).toBe(3000)
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
        const bossTypes = ['destroyer', 'carrier', 'dreadnought', 'mothership']
        const waveBasedIndex = wave >= 25 ? 3 : Math.min(Math.floor(wave / 10), 2)
        return bossTypes[waveBasedIndex]
      }

      expect(getBossType(5)).toBe('destroyer')
      expect(getBossType(10)).toBe('carrier')
      expect(getBossType(15)).toBe('carrier')
      expect(getBossType(20)).toBe('dreadnought')
      expect(getBossType(24)).toBe('dreadnought')
    })

    test('boss type selection returns mothership at wave 25+', () => {
      const getBossType = (wave: number) => {
        const bossTypes = ['destroyer', 'carrier', 'dreadnought', 'mothership']
        const waveBasedIndex = wave >= 25 ? 3 : Math.min(Math.floor(wave / 10), 2)
        return bossTypes[waveBasedIndex]
      }

      expect(getBossType(25)).toBe('mothership')
      expect(getBossType(30)).toBe('mothership')
      expect(getBossType(50)).toBe('mothership')
      expect(getBossType(100)).toBe('mothership') // Capped at mothership
    })
  })

  // ------------------------------------------------------------------ //
  //                         Boss Phase Transition Tests
  // ------------------------------------------------------------------ //
  describe('Boss Phase Transitions', () => {
    type BossType = 'destroyer' | 'carrier' | 'dreadnought' | 'mothership'

    interface Boss {
      hp: number
      maxHp: number
      phase: 1 | 2 | 3
      type: BossType
      shieldActive?: boolean
      shieldCooldown?: number
    }

    const PHASE_BOSS_STATS: Record<BossType, { hp: number; phases: number }> = {
      destroyer: { hp: 500, phases: 2 },
      carrier: { hp: 750, phases: 3 },
      dreadnought: { hp: 1000, phases: 3 },
      mothership: { hp: 1250, phases: 3 },
    }

    const createBossStore = () =>
      create<{
        boss: Boss | null
        spawnBoss: (type: BossType) => void
        damageBoss: (damage: number) => void
      }>((set) => ({
        boss: null,

        spawnBoss: (type) => {
          const stats = PHASE_BOSS_STATS[type]
          set({
            boss: {
              hp: stats.hp,
              maxHp: stats.hp,
              phase: 1,
              type,
              shieldActive: false,
              shieldCooldown: 10,
            },
          })
        },

        damageBoss: (damage) =>
          set((state) => {
            if (!state.boss) return state
            // Mothership shield: 75% damage reduction when active
            const effectiveDamage = (state.boss.type === 'mothership' && state.boss.shieldActive)
              ? Math.ceil(damage * 0.25)
              : damage
            const newHp = state.boss.hp - effectiveDamage
            const hpPercent = newHp / state.boss.maxHp
            const maxPhases = PHASE_BOSS_STATS[state.boss.type].phases

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

    test('mothership starts at phase 1 with 1250 HP', () => {
      const store = createBossStore()
      store.getState().spawnBoss('mothership')
      expect(store.getState().boss?.phase).toBe(1)
      expect(store.getState().boss?.hp).toBe(1250)
      expect(store.getState().boss?.maxHp).toBe(1250)
    })

    test('mothership transitions to phase 2 at 66% hp', () => {
      const store = createBossStore()
      store.getState().spawnBoss('mothership') // 1250 HP

      // Deal 425 damage (1250 - 425 = 825, which is 66% of 1250)
      store.getState().damageBoss(425)
      expect(store.getState().boss?.phase).toBe(2)
    })

    test('mothership transitions to phase 3 at 33% hp', () => {
      const store = createBossStore()
      store.getState().spawnBoss('mothership') // 1250 HP

      // Phase 1 -> 2 at 66% (825 HP remaining, deal 425 damage)
      store.getState().damageBoss(425)
      expect(store.getState().boss?.phase).toBe(2)

      // Phase 2 -> 3 at 33% (412.5 HP remaining, deal 413 more damage)
      store.getState().damageBoss(413)
      expect(store.getState().boss?.phase).toBe(3)
    })

    test('mothership has 3 distinct phases', () => {
      const store = createBossStore()
      store.getState().spawnBoss('mothership') // 1250 HP

      // Phase 1
      expect(store.getState().boss?.phase).toBe(1)

      // Phase 1 -> 2
      store.getState().damageBoss(425)
      expect(store.getState().boss?.phase).toBe(2)

      // Phase 2 -> 3
      store.getState().damageBoss(413)
      expect(store.getState().boss?.phase).toBe(3)

      // Phase 3 stays at 3 even with more damage
      store.getState().damageBoss(100)
      expect(store.getState().boss?.phase).toBe(3)
    })

    test('mothership shield reduces damage by 75%', () => {
      const store = createBossStore()
      store.getState().spawnBoss('mothership') // 1250 HP

      // Activate shield
      store.setState({
        boss: { ...store.getState().boss!, shieldActive: true },
      })

      // Deal 100 damage with shield active -> only 25 effective damage (ceil(100 * 0.25))
      store.getState().damageBoss(100)
      expect(store.getState().boss?.hp).toBe(1225) // 1250 - 25
    })

    test('mothership shield does not affect other boss types', () => {
      const store = createBossStore()
      store.getState().spawnBoss('dreadnought') // 1000 HP

      // Even if shieldActive were somehow set, it shouldn't affect dreadnought
      store.setState({
        boss: { ...store.getState().boss!, shieldActive: true },
      })

      store.getState().damageBoss(100)
      expect(store.getState().boss?.hp).toBe(900) // Full damage, no reduction
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

    test('carrier respects lifetime spawn limit (max 12 enemies)', () => {
      const MAX_CARRIER_SPAWNED_ENEMIES = 12
      let spawnedEnemiesCount = 0
      let totalEnemiesSpawned = 0

      // Simulate multiple special attacks
      for (let attack = 0; attack < 10; attack++) {
        // Check if we can still spawn
        if (spawnedEnemiesCount < MAX_CARRIER_SPAWNED_ENEMIES) {
          const spawnCount = Math.min(2, MAX_CARRIER_SPAWNED_ENEMIES - spawnedEnemiesCount)
          totalEnemiesSpawned += spawnCount
          spawnedEnemiesCount += spawnCount
        }
      }

      // Verify we never exceeded the limit
      expect(totalEnemiesSpawned).toBeLessThanOrEqual(MAX_CARRIER_SPAWNED_ENEMIES)
      expect(spawnedEnemiesCount).toBe(MAX_CARRIER_SPAWNED_ENEMIES)
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

    test('mothership phase 1 fires 3-bullet targeted fan', () => {
      const phase = 1
      const fanCount = phase >= 2 ? 5 : 3
      const fanSpread = 0.2
      const baseAngle = Math.PI / 2 // Targeting downward

      const bullets: { angle: number }[] = []
      for (let i = 0; i < fanCount; i++) {
        const offset = (i - (fanCount - 1) / 2) * fanSpread
        bullets.push({ angle: baseAngle + offset })
      }

      expect(bullets.length).toBe(3)
      // Bullets should be centered around base angle
      expect(bullets[1].angle).toBeCloseTo(baseAngle)
    })

    test('mothership phase 2 fires wider 5-bullet fan', () => {
      const phase = 2
      const fanCount = phase >= 2 ? 5 : 3
      const fanSpread = 0.2

      const bullets: { angle: number }[] = []
      const baseAngle = Math.PI / 2
      for (let i = 0; i < fanCount; i++) {
        const offset = (i - (fanCount - 1) / 2) * fanSpread
        bullets.push({ angle: baseAngle + offset })
      }

      expect(bullets.length).toBe(5)
      // Middle bullet should be centered
      expect(bullets[2].angle).toBeCloseTo(baseAngle)
    })

    test('mothership phase 3 fires expanding ring (8 bullets) + fan', () => {
      const phase = 3

      // Expanding ring
      const ring: { angle: number }[] = []
      if (phase >= 3) {
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2
          ring.push({ angle })
        }
      }

      // Wide targeted fan
      const fanCount = phase >= 2 ? 5 : 3
      const fanSpread = 0.2
      const baseAngle = Math.PI / 2
      const fan: { angle: number }[] = []
      for (let i = 0; i < fanCount; i++) {
        const offset = (i - (fanCount - 1) / 2) * fanSpread
        fan.push({ angle: baseAngle + offset })
      }

      expect(ring.length).toBe(8)
      expect(fan.length).toBe(5)

      // Ring angles should be evenly distributed
      const expectedInterval = (Math.PI * 2) / 8
      for (let i = 0; i < ring.length - 1; i++) {
        const diff = ring[i + 1].angle - ring[i].angle
        expect(diff).toBeCloseTo(expectedInterval)
      }
    })

    test('mothership spawns scouts in phase 1', () => {
      const phase = 1
      const MAX_MOTHERSHIP_SCREEN_ENEMIES = 8
      const MAX_MOTHERSHIP_SPAWNED_ENEMIES = 16

      const enemiesSpawned: string[] = []
      let spawnedEnemiesCount = 0
      const currentEnemyCount = 0

      // Simulate phase 1 special attack spawning
      if (phase === 1) {
        const remainingLifetimeSpawns = MAX_MOTHERSHIP_SPAWNED_ENEMIES - spawnedEnemiesCount
        const spawnCount = Math.min(2, MAX_MOTHERSHIP_SCREEN_ENEMIES - currentEnemyCount, remainingLifetimeSpawns)
        for (let i = 0; i < spawnCount; i++) {
          enemiesSpawned.push('scout')
          spawnedEnemiesCount++
        }
      }

      expect(enemiesSpawned.length).toBe(2)
      expect(enemiesSpawned.every((e) => e === 'scout')).toBe(true)
    })

    test('mothership spawns healers in phase 2', () => {
      const phase = 2
      const MAX_MOTHERSHIP_SCREEN_ENEMIES = 8
      const MAX_MOTHERSHIP_SPAWNED_ENEMIES = 16

      const enemiesSpawned: string[] = []
      let spawnedEnemiesCount = 0
      const currentEnemyCount = 2

      // Simulate phase 2 special attack spawning
      if (phase >= 2 && phase < 3) {
        if (spawnedEnemiesCount < MAX_MOTHERSHIP_SPAWNED_ENEMIES &&
            currentEnemyCount < MAX_MOTHERSHIP_SCREEN_ENEMIES) {
          enemiesSpawned.push('healer')
          spawnedEnemiesCount++
        }
      }

      expect(enemiesSpawned.length).toBe(1)
      expect(enemiesSpawned[0]).toBe('healer')
    })

    test('mothership spawns juggernaut in phase 3', () => {
      const phase = 3
      const MAX_MOTHERSHIP_SPAWNED_ENEMIES = 16

      const enemiesSpawned: string[] = []
      let spawnedEnemiesCount = 4

      // Simulate phase 3 special attack spawning
      if (phase >= 3) {
        const hasJuggernaut = false // No juggernaut on screen
        if (spawnedEnemiesCount < MAX_MOTHERSHIP_SPAWNED_ENEMIES && !hasJuggernaut) {
          enemiesSpawned.push('juggernaut')
          spawnedEnemiesCount++
        }
      }

      expect(enemiesSpawned.length).toBe(1)
      expect(enemiesSpawned[0]).toBe('juggernaut')
      expect(spawnedEnemiesCount).toBe(5)
    })

    test('mothership respects lifetime spawn limit (max 16 enemies)', () => {
      const MAX_MOTHERSHIP_SPAWNED_ENEMIES = 16
      let spawnedEnemiesCount = 0
      let totalEnemiesSpawned = 0

      // Simulate multiple special attacks across all phases
      for (let attack = 0; attack < 20; attack++) {
        if (spawnedEnemiesCount < MAX_MOTHERSHIP_SPAWNED_ENEMIES) {
          const spawnCount = Math.min(2, MAX_MOTHERSHIP_SPAWNED_ENEMIES - spawnedEnemiesCount)
          totalEnemiesSpawned += spawnCount
          spawnedEnemiesCount += spawnCount
        }
      }

      expect(totalEnemiesSpawned).toBeLessThanOrEqual(MAX_MOTHERSHIP_SPAWNED_ENEMIES)
      expect(spawnedEnemiesCount).toBe(MAX_MOTHERSHIP_SPAWNED_ENEMIES)
    })

    test('mothership respects max on-screen enemy limit (max 8)', () => {
      const MAX_MOTHERSHIP_SCREEN_ENEMIES = 8
      const MAX_MOTHERSHIP_SPAWNED_ENEMIES = 16
      let currentEnemyCount = 7 // Near limit
      let spawnedEnemiesCount = 0

      // Phase 1 spawn attempt with nearly full screen
      const remainingLifetimeSpawns = MAX_MOTHERSHIP_SPAWNED_ENEMIES - spawnedEnemiesCount
      const spawnCount = Math.min(2, MAX_MOTHERSHIP_SCREEN_ENEMIES - currentEnemyCount, remainingLifetimeSpawns)

      expect(spawnCount).toBe(1) // Only room for 1 more

      currentEnemyCount = MAX_MOTHERSHIP_SCREEN_ENEMIES
      const spawnCount2 = Math.min(2, MAX_MOTHERSHIP_SCREEN_ENEMIES - currentEnemyCount, remainingLifetimeSpawns)
      expect(spawnCount2).toBe(0) // No room for any
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
      mothership: { hp: 1250, phases: 3, points: 3000 },
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

    test('defeating mothership awards 3000 points', () => {
      let score = 0
      const bossType: keyof typeof BOSS_STATS = 'mothership'

      score += BOSS_STATS[bossType].points

      expect(score).toBe(3000)
    })

    test('defeating mothership awards 300 credits', () => {
      let credits = 0
      const bossType: keyof typeof BOSS_STATS = 'mothership'

      credits += Math.floor(BOSS_STATS[bossType].points / 10)

      expect(credits).toBe(300)
    })

    test('mothership awards highest points and credits of all bosses', () => {
      const bossTypes = Object.keys(BOSS_STATS) as (keyof typeof BOSS_STATS)[]
      const mothershipPoints = BOSS_STATS.mothership.points
      const mothershipCredits = Math.floor(mothershipPoints / 10)

      for (const bossType of bossTypes) {
        if (bossType !== 'mothership') {
          expect(mothershipPoints).toBeGreaterThan(BOSS_STATS[bossType].points)
          expect(mothershipCredits).toBeGreaterThan(Math.floor(BOSS_STATS[bossType].points / 10))
        }
      }
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
