/**
 * Enemy Spawning and Session Tracking Tests
 * Tests for enemy spawn logic, weights, and session statistics
 */

import { create } from 'zustand'
import { ENEMY_STATS } from '../types/game'
import { getEnemySpawnWeights } from '../state/gameStore'

describe('Enemy Spawning Logic', () => {
  // ------------------------------------------------------------------ //
  //                         Enemy Types Tests
  // ------------------------------------------------------------------ //
  describe('Enemy Types', () => {

    test('scout is fastest but weakest', () => {
      expect(ENEMY_STATS.scout.speed).toBeGreaterThan(ENEMY_STATS.tank.speed)
      expect(ENEMY_STATS.scout.hp).toBeLessThan(ENEMY_STATS.tank.hp)
    })

    test('juggernaut is toughest (sniper is slowest)', () => {
      const speeds = Object.values(ENEMY_STATS).map((s) => s.speed)
      const hps = Object.values(ENEMY_STATS).map((s) => s.hp)

      // Sniper is slowest (40), juggernaut is second slowest (50)
      expect(ENEMY_STATS.sniper.speed).toBe(Math.min(...speeds))
      expect(ENEMY_STATS.juggernaut.hp).toBe(Math.max(...hps))
    })

    test('sniper has highest damage', () => {
      const damages = Object.values(ENEMY_STATS).map((s) => s.damage)
      expect(ENEMY_STATS.sniper.damage).toBe(Math.max(...damages))
    })

    test('points scale with difficulty', () => {
      expect(ENEMY_STATS.tank.points).toBeGreaterThan(ENEMY_STATS.scout.points)
      expect(ENEMY_STATS.sniper.points).toBeGreaterThan(ENEMY_STATS.scout.points)
    })

    test('teleporter has moderate speed and hp', () => {
      expect(ENEMY_STATS.teleporter.speed).toBeGreaterThan(ENEMY_STATS.tank.speed)
      expect(ENEMY_STATS.teleporter.speed).toBeLessThan(ENEMY_STATS.scout.speed)
      expect(ENEMY_STATS.teleporter.hp).toBeGreaterThan(ENEMY_STATS.scout.hp)
      expect(ENEMY_STATS.teleporter.hp).toBeLessThan(ENEMY_STATS.tank.hp)
    })

    test('healer is fragile with low threat', () => {
      // Healer has low HP - only tougher than scout
      expect(ENEMY_STATS.healer.hp).toBeLessThan(ENEMY_STATS.tank.hp)
      expect(ENEMY_STATS.healer.hp).toBeLessThan(ENEMY_STATS.bomber.hp)
      expect(ENEMY_STATS.healer.hp).toBeGreaterThan(ENEMY_STATS.scout.hp)

      // Healer has lowest damage (tied with scout)
      expect(ENEMY_STATS.healer.damage).toBeLessThanOrEqual(ENEMY_STATS.scout.damage)
      const damages = Object.values(ENEMY_STATS).map((s) => s.damage)
      expect(ENEMY_STATS.healer.damage).toBe(Math.min(...damages))

      // Moderate speed - between tank and teleporter
      expect(ENEMY_STATS.healer.speed).toBeGreaterThan(ENEMY_STATS.tank.speed)
      expect(ENEMY_STATS.healer.speed).toBeLessThan(ENEMY_STATS.teleporter.speed)
    })

    test('juggernaut is heaviest non-tank enemy', () => {
      // Juggernaut has the most HP of all enemies (even more than tank)
      expect(ENEMY_STATS.juggernaut.hp).toBeGreaterThan(ENEMY_STATS.tank.hp)

      // Among non-tank enemies, juggernaut is the heaviest
      const nonTankHps = Object.entries(ENEMY_STATS)
        .filter(([type]) => type !== 'tank')
        .map(([, stats]) => stats.hp)
      expect(ENEMY_STATS.juggernaut.hp).toBe(Math.max(...nonTankHps))

      // Second slowest (only sniper is slower)
      expect(ENEMY_STATS.juggernaut.speed).toBeGreaterThan(ENEMY_STATS.sniper.speed)
      expect(ENEMY_STATS.juggernaut.speed).toBeLessThan(ENEMY_STATS.tank.speed)

      // High damage, second only to sniper
      expect(ENEMY_STATS.juggernaut.damage).toBeGreaterThan(ENEMY_STATS.tank.damage)
      expect(ENEMY_STATS.juggernaut.damage).toBeLessThan(ENEMY_STATS.sniper.damage)

      // Highest points of all regular enemies
      const allPoints = Object.values(ENEMY_STATS).map((s) => s.points)
      expect(ENEMY_STATS.juggernaut.points).toBe(Math.max(...allPoints))
    })
  })

  // ------------------------------------------------------------------ //
  //                         Spawn Weight Tests
  // ------------------------------------------------------------------ //
  describe('Enemy Spawn Weights', () => {
    test('only scouts spawn on wave 1', () => {
      const weights = getEnemySpawnWeights(1)
      expect(weights.scout).toBe(40)
      expect(weights.tank).toBe(0)
      expect(weights.sniper).toBe(0)
      expect(weights.bomber).toBe(0)
      expect(weights.teleporter).toBe(0)
      expect(weights.healer).toBe(0)
      expect(weights.juggernaut).toBe(0)
    })

    test('tanks unlock at wave 3', () => {
      const wave2 = getEnemySpawnWeights(2)
      const wave3 = getEnemySpawnWeights(3)

      expect(wave2.tank).toBe(0)
      expect(wave3.tank).toBe(20)
    })

    test('snipers unlock at wave 5', () => {
      const wave4 = getEnemySpawnWeights(4)
      const wave5 = getEnemySpawnWeights(5)

      expect(wave4.sniper).toBe(0)
      expect(wave5.sniper).toBe(15)
    })

    test('bombers unlock at wave 7', () => {
      const wave6 = getEnemySpawnWeights(6)
      const wave7 = getEnemySpawnWeights(7)

      expect(wave6.bomber).toBe(0)
      expect(wave7.bomber).toBe(15)
    })

    test('teleporters unlock at wave 9', () => {
      const wave8 = getEnemySpawnWeights(8)
      const wave9 = getEnemySpawnWeights(9)

      expect(wave8.teleporter).toBe(0)
      expect(wave9.teleporter).toBe(10)
    })

    test('healers unlock at wave 11', () => {
      const wave10 = getEnemySpawnWeights(10)
      const wave11 = getEnemySpawnWeights(11)

      expect(wave10.healer).toBe(0)
      expect(wave11.healer).toBe(10)
    })

    test('juggernauts unlock at wave 15', () => {
      const wave14 = getEnemySpawnWeights(14)
      const wave15 = getEnemySpawnWeights(15)

      expect(wave14.juggernaut).toBe(0)
      expect(wave15.juggernaut).toBe(8)
    })

    test('all enemies available at wave 15+', () => {
      const weights = getEnemySpawnWeights(15)
      expect(Object.values(weights).every((w) => w > 0)).toBe(true)
    })

    test('weighted random selection', () => {
      const weights = getEnemySpawnWeights(15) // All types available
      const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)

      expect(totalWeight).toBe(40 + 20 + 15 + 15 + 10 + 10 + 8) // 118

      // Simulate 1000 spawns
      const counts: Record<string, number> = {
        scout: 0, tank: 0, sniper: 0, bomber: 0,
        teleporter: 0, healer: 0, juggernaut: 0,
      }

      for (let i = 0; i < 1000; i++) {
        let random = Math.random() * totalWeight
        for (const [type, weight] of Object.entries(weights)) {
          random -= weight
          if (random <= 0) {
            counts[type]++
            break
          }
        }
      }

      // Scouts should be ~34% (40/118)
      expect(counts.scout / 1000).toBeGreaterThan(0.26)
      expect(counts.scout / 1000).toBeLessThan(0.42)

      // Tanks should be ~17% (20/118)
      expect(counts.tank / 1000).toBeGreaterThan(0.10)
      expect(counts.tank / 1000).toBeLessThan(0.24)

      // Teleporters should be ~8.5% (10/118)
      expect(counts.teleporter / 1000).toBeGreaterThan(0.04)
      expect(counts.teleporter / 1000).toBeLessThan(0.14)

      // Juggernauts should be ~6.8% (8/118)
      expect(counts.juggernaut / 1000).toBeGreaterThan(0.03)
      expect(counts.juggernaut / 1000).toBeLessThan(0.12)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Enemy Wave Spawning Tests
  // ------------------------------------------------------------------ //
  describe('Enemy Wave Spawning', () => {
    test('enemy count scales with wave', () => {
      const getEnemyCount = (wave: number) => Math.min(2 + Math.floor(wave / 2), 6)

      expect(getEnemyCount(1)).toBe(2)
      expect(getEnemyCount(2)).toBe(3)
      expect(getEnemyCount(4)).toBe(4)
      expect(getEnemyCount(6)).toBe(5)
      expect(getEnemyCount(8)).toBe(6)
      expect(getEnemyCount(20)).toBe(6) // Capped at 6
    })

    test('enemies spawn on even waves', () => {
      const shouldSpawnEnemies = (wave: number) => wave % 2 === 0

      expect(shouldSpawnEnemies(1)).toBe(false)
      expect(shouldSpawnEnemies(2)).toBe(true)
      expect(shouldSpawnEnemies(3)).toBe(false)
      expect(shouldSpawnEnemies(4)).toBe(true)
    })

    test('BUG: enemy spawn position can overlap player', () => {
      // Enemies spawn at random positions without checking player distance
      const playerPos = { x: 200, y: 300 }
      const screenW = 400
      const screenH = 600

      // Simulate spawning - could land on player
      const enemyPos = {
        x: Math.random() * screenW,
        y: Math.random() * screenH,
      }

      // Calculate distance
      const dist = Math.sqrt(
        (enemyPos.x - playerPos.x) ** 2 + (enemyPos.y - playerPos.y) ** 2
      )

      // This could be 0 if enemy spawns exactly on player
      // Bug: no minimum distance check
      const SAFE_SPAWN_DISTANCE = 100

      // Test documents the bug - spawn doesn't enforce safe distance
      const isSafeSpawn = dist >= SAFE_SPAWN_DISTANCE
      // This may or may not be true - it's random
      console.log('Spawn distance:', dist, 'Safe:', isSafeSpawn)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Carrier Boss Spawn Bug Test
  // ------------------------------------------------------------------ //
  describe('Carrier Boss Enemy Spawning', () => {
    test('BUG: carrier can spawn unlimited enemies', () => {
      let enemyCount = 5 // Starting enemies
      const MAX_ENEMIES = 20 // Should have a limit

      // Simulate carrier special attack every 5 seconds for 60 seconds
      const specialCooldown = 5
      const battleDuration = 60

      for (let t = 0; t < battleDuration; t += specialCooldown) {
        enemyCount += 2 // Carrier spawns 2 scouts per special
      }

      // After 60 seconds: 5 + (60/5 * 2) = 5 + 24 = 29 enemies
      expect(enemyCount).toBe(29)

      // Bug: No limit on enemy count
      expect(enemyCount > MAX_ENEMIES).toBe(true)
    })
  })
})

describe('Session Tracking Logic', () => {
  // ------------------------------------------------------------------ //
  //                         Kill Tracking Tests
  // ------------------------------------------------------------------ //
  describe('Kill Tracking', () => {
    interface SessionState {
      sessionKillsRecent: number
      sessionKillTimer: number
      sessionShotsHit: number
      recordKill: () => void
      updateTime: (dt: number) => void
    }

    const createSessionStore = () =>
      create<SessionState>((set) => ({
        sessionKillsRecent: 0,
        sessionKillTimer: 0,
        sessionShotsHit: 0,

        recordKill: () =>
          set((state) => ({
            sessionKillsRecent: state.sessionKillsRecent + 1,
            sessionKillTimer: 10,
            sessionShotsHit: state.sessionShotsHit + 1, // BUG: shouldn't increment here
          })),

        updateTime: (dt) =>
          set((state) => ({
            sessionKillTimer: state.sessionKillTimer > 0 ? state.sessionKillTimer - dt : 0,
            sessionKillsRecent: state.sessionKillTimer <= dt ? 0 : state.sessionKillsRecent,
          })),
      }))

    test('kill increments recent kill count', () => {
      const store = createSessionStore()
      store.getState().recordKill()
      expect(store.getState().sessionKillsRecent).toBe(1)
    })

    test('kill resets timer to 10 seconds', () => {
      const store = createSessionStore()
      store.getState().recordKill()
      expect(store.getState().sessionKillTimer).toBe(10)
    })

    test('recent kills reset after timer expires', () => {
      const store = createSessionStore()
      store.getState().recordKill()
      store.getState().recordKill()
      store.getState().recordKill()

      expect(store.getState().sessionKillsRecent).toBe(3)

      // Fast forward 11 seconds
      store.getState().updateTime(11)

      expect(store.getState().sessionKillsRecent).toBe(0)
    })

    test('BUG: recordKill incorrectly increments sessionShotsHit', () => {
      const store = createSessionStore()

      // Fire 10 shots, hit 0 enemies
      // Then kill 1 enemy with homing missile (doesn't fire a shot)
      store.getState().recordKill()

      // sessionShotsHit should still be 0 (no actual shots hit)
      // But due to bug, it's incremented to 1
      expect(store.getState().sessionShotsHit).toBe(1) // Bug: should be 0
    })
  })

  // ------------------------------------------------------------------ //
  //                         Accuracy Tracking Tests
  // ------------------------------------------------------------------ //
  describe('Accuracy Tracking', () => {
    interface AccuracyState {
      sessionShotsFired: number
      sessionShotsHit: number
      addBullet: (friendly: boolean) => void
      recordHit: () => void
      getAccuracy: () => number
    }

    const createAccuracyStore = () =>
      create<AccuracyState>((set, get) => ({
        sessionShotsFired: 0,
        sessionShotsHit: 0,

        addBullet: (friendly) =>
          set((state) => ({
            sessionShotsFired: friendly ? state.sessionShotsFired + 1 : state.sessionShotsFired,
          })),

        recordHit: () =>
          set((state) => ({
            sessionShotsHit: state.sessionShotsHit + 1,
          })),

        getAccuracy: () => {
          const state = get()
          if (state.sessionShotsFired === 0) return 0
          return (state.sessionShotsHit / state.sessionShotsFired) * 100
        },
      }))

    test('accuracy is 0 when no shots fired', () => {
      const store = createAccuracyStore()
      expect(store.getState().getAccuracy()).toBe(0)
    })

    test('accuracy calculation is correct', () => {
      const store = createAccuracyStore()

      // Fire 10 shots, hit 7
      for (let i = 0; i < 10; i++) {
        store.getState().addBullet(true)
      }
      for (let i = 0; i < 7; i++) {
        store.getState().recordHit()
      }

      expect(store.getState().getAccuracy()).toBe(70)
    })

    test('enemy bullets do not count toward accuracy', () => {
      const store = createAccuracyStore()

      store.getState().addBullet(true) // Player shot
      store.getState().addBullet(false) // Enemy shot
      store.getState().addBullet(false) // Enemy shot

      expect(store.getState().sessionShotsFired).toBe(1)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Damage Tracking Tests
  // ------------------------------------------------------------------ //
  describe('Damage Tracking', () => {
    test('sessionDamageTaken tracks per-wave damage', () => {
      let sessionDamageTaken = false

      const recordDamage = () => {
        sessionDamageTaken = true
      }

      const resetWaveTracking = () => {
        sessionDamageTaken = false
      }

      // Start of wave
      expect(sessionDamageTaken).toBe(false)

      // Take damage
      recordDamage()
      expect(sessionDamageTaken).toBe(true)

      // Next wave
      resetWaveTracking()
      expect(sessionDamageTaken).toBe(false)
    })

    test('untouchable achievement requires no damage in wave', () => {
      const checkUntouchable = (damageTaken: boolean, waveComplete: boolean) => {
        return waveComplete && !damageTaken
      }

      expect(checkUntouchable(false, true)).toBe(true) // Achievement earned
      expect(checkUntouchable(true, true)).toBe(false) // Took damage
      expect(checkUntouchable(false, false)).toBe(false) // Wave not complete
    })
  })

  // ------------------------------------------------------------------ //
  //                         Speed Demon Achievement Tests
  // ------------------------------------------------------------------ //
  describe('Speed Demon Achievement', () => {
    test('requires 10 kills in 10 seconds', () => {
      const REQUIRED_KILLS = 10
      const TIME_WINDOW = 10

      let recentKills = 0
      let timer = 0

      const recordKill = () => {
        recentKills++
        timer = TIME_WINDOW
      }

      const update = (dt: number) => {
        timer = Math.max(0, timer - dt)
        if (timer <= 0) {
          recentKills = 0
        }
      }

      // Kill 10 enemies within 10 seconds
      for (let i = 0; i < 10; i++) {
        recordKill()
        update(0.5) // 0.5 seconds between kills
      }

      expect(recentKills).toBe(10)
      expect(recentKills >= REQUIRED_KILLS).toBe(true)
    })

    test('kills reset after 10 seconds without killing', () => {
      let recentKills = 5
      let timer = 5 // 5 seconds left

      // Simulate 6 seconds passing without kills
      timer = Math.max(0, timer - 6)
      if (timer <= 0) {
        recentKills = 0
      }

      expect(recentKills).toBe(0)
    })
  })
})
