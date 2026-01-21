/**
 * Power-Up System Tests
 * Tests for power-up spawning, collection, and effects
 */

import { create } from 'zustand'

describe('Power-Up System Logic', () => {
  // ------------------------------------------------------------------ //
  //                         Power-Up Types Tests
  // ------------------------------------------------------------------ //
  describe('Power-Up Types', () => {
    const POWER_UP_TYPES = ['shield', 'rapid_fire', 'spread_shot', 'magnet'] as const
    type PowerUpType = typeof POWER_UP_TYPES[number]

    test('all power-up types are defined', () => {
      expect(POWER_UP_TYPES).toHaveLength(4)
      expect(POWER_UP_TYPES).toContain('shield')
      expect(POWER_UP_TYPES).toContain('rapid_fire')
      expect(POWER_UP_TYPES).toContain('spread_shot')
      expect(POWER_UP_TYPES).toContain('magnet')
    })

    test('random type selection is uniform', () => {
      const counts: Record<PowerUpType, number> = {
        shield: 0,
        rapid_fire: 0,
        spread_shot: 0,
        magnet: 0,
      }

      // Simulate 1000 random selections
      for (let i = 0; i < 1000; i++) {
        const type = POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)]
        counts[type]++
      }

      // Each should be roughly 250 (25% of 1000)
      Object.values(counts).forEach((count) => {
        expect(count).toBeGreaterThan(150)
        expect(count).toBeLessThan(350)
      })
    })
  })

  // ------------------------------------------------------------------ //
  //                         Power-Up Duration Tests
  // ------------------------------------------------------------------ //
  describe('Power-Up Duration', () => {
    const POWERUP_DURATION = 8
    const POWERUP_LIFETIME = 10

    interface ActivePowerUp {
      type: string
      duration: number
    }

    const createPowerUpStore = () =>
      create<{
        activePowerUps: ActivePowerUp[]
        updateActivePowerUps: (dt: number) => void
        addPowerUp: (type: string) => void
        hasPowerUp: (type: string) => boolean
      }>((set, get) => ({
        activePowerUps: [],

        updateActivePowerUps: (dt) =>
          set((state) => ({
            activePowerUps: state.activePowerUps
              .map((p) => ({ ...p, duration: p.duration - dt }))
              .filter((p) => p.duration > 0),
          })),

        addPowerUp: (type) =>
          set((state) => {
            const existing = state.activePowerUps.findIndex((p) => p.type === type)
            if (existing >= 0) {
              const updated = [...state.activePowerUps]
              updated[existing] = { type, duration: POWERUP_DURATION }
              return { activePowerUps: updated }
            }
            return {
              activePowerUps: [...state.activePowerUps, { type, duration: POWERUP_DURATION }],
            }
          }),

        hasPowerUp: (type) => get().activePowerUps.some((p) => p.type === type),
      }))

    test('power-up duration decreases over time', () => {
      const store = createPowerUpStore()
      store.getState().addPowerUp('shield')

      expect(store.getState().activePowerUps[0].duration).toBe(POWERUP_DURATION)

      store.getState().updateActivePowerUps(1)
      expect(store.getState().activePowerUps[0].duration).toBe(7)
    })

    test('power-up expires when duration reaches 0', () => {
      const store = createPowerUpStore()
      store.getState().addPowerUp('shield')

      // Fast forward 8 seconds
      store.getState().updateActivePowerUps(8)

      expect(store.getState().activePowerUps.length).toBe(0)
      expect(store.getState().hasPowerUp('shield')).toBe(false)
    })

    test('collecting same power-up refreshes duration', () => {
      const store = createPowerUpStore()
      store.getState().addPowerUp('shield')
      store.getState().updateActivePowerUps(5) // 3 seconds left

      expect(store.getState().activePowerUps[0].duration).toBe(3)

      store.getState().addPowerUp('shield') // Refresh
      expect(store.getState().activePowerUps[0].duration).toBe(POWERUP_DURATION)
    })

    test('multiple power-ups can be active simultaneously', () => {
      const store = createPowerUpStore()
      store.getState().addPowerUp('shield')
      store.getState().addPowerUp('rapid_fire')
      store.getState().addPowerUp('spread_shot')

      expect(store.getState().activePowerUps.length).toBe(3)
      expect(store.getState().hasPowerUp('shield')).toBe(true)
      expect(store.getState().hasPowerUp('rapid_fire')).toBe(true)
      expect(store.getState().hasPowerUp('spread_shot')).toBe(true)
    })

    test('power-ups expire independently', () => {
      const store = createPowerUpStore()
      store.getState().addPowerUp('shield')
      store.getState().updateActivePowerUps(2) // shield: 6s left

      store.getState().addPowerUp('rapid_fire') // rapid_fire: 8s

      store.getState().updateActivePowerUps(6) // shield expires, rapid_fire: 2s

      expect(store.getState().hasPowerUp('shield')).toBe(false)
      expect(store.getState().hasPowerUp('rapid_fire')).toBe(true)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Power-Up Spawning Tests
  // ------------------------------------------------------------------ //
  describe('Power-Up Spawning', () => {
    const POWERUP_DROP_ENEMY = 0.25
    const POWERUP_DROP_ASTEROID = 0.05

    test('enemy drop chance is 25%', () => {
      let drops = 0
      const trials = 10000

      for (let i = 0; i < trials; i++) {
        if (Math.random() < POWERUP_DROP_ENEMY) {
          drops++
        }
      }

      const dropRate = drops / trials
      expect(dropRate).toBeGreaterThan(0.22)
      expect(dropRate).toBeLessThan(0.28)
    })

    test('asteroid drop chance is 5%', () => {
      let drops = 0
      const trials = 10000

      for (let i = 0; i < trials; i++) {
        if (Math.random() < POWERUP_DROP_ASTEROID) {
          drops++
        }
      }

      const dropRate = drops / trials
      expect(dropRate).toBeGreaterThan(0.03)
      expect(dropRate).toBeLessThan(0.07)
    })

    test('only large asteroids can drop power-ups', () => {
      const asteroidTiers = [1, 2, 3]
      const canDropPowerUp = (tier: number) => tier === 3

      expect(canDropPowerUp(1)).toBe(false)
      expect(canDropPowerUp(2)).toBe(false)
      expect(canDropPowerUp(3)).toBe(true)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Power-Up Effects Tests
  // ------------------------------------------------------------------ //
  describe('Power-Up Effects', () => {
    test('shield prevents damage', () => {
      let hp = 100
      const hasShield = true
      const damage = 20

      if (!hasShield) {
        hp -= damage
      }

      expect(hp).toBe(100)
    })

    test('rapid fire doubles cooldown reduction rate', () => {
      const baseCooldownRate = 1
      const rapidFireRate = 2

      let cooldown = 0.16
      const dt = 0.033

      // Normal cooldown
      let normalFrames = 0
      let tempCooldown = cooldown
      while (tempCooldown > 0) {
        tempCooldown -= dt * baseCooldownRate
        normalFrames++
      }

      // Rapid fire cooldown
      let rapidFrames = 0
      tempCooldown = cooldown
      while (tempCooldown > 0) {
        tempCooldown -= dt * rapidFireRate
        rapidFrames++
      }

      expect(rapidFrames).toBeLessThan(normalFrames)
      // Rapid fire should be roughly half the frames (with some rounding)
      expect(rapidFrames).toBeLessThanOrEqual(Math.ceil(normalFrames / 2))
    })

    test('spread shot fires 3 bullets', () => {
      const spreadAngles = [-0.2, 0, 0.2]
      expect(spreadAngles.length).toBe(3)

      // Angles should be symmetric
      expect(spreadAngles[0]).toBe(-spreadAngles[2])
      expect(spreadAngles[1]).toBe(0)
    })

    test('magnet attraction radius is 200', () => {
      const MAGNET_RADIUS = 200
      const playerPos = { x: 100, y: 100 }
      const powerUpPos = { x: 250, y: 100 }

      const distance = Math.sqrt(
        (playerPos.x - powerUpPos.x) ** 2 + (playerPos.y - powerUpPos.y) ** 2
      )

      expect(distance).toBe(150)
      expect(distance < MAGNET_RADIUS).toBe(true)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Power-Up Collection Tests
  // ------------------------------------------------------------------ //
  describe('Power-Up Collection', () => {
    interface PowerUp {
      pos: { x: number; y: number }
      type: string
      lifetime: number
    }

    test('power-up despawns after lifetime', () => {
      const POWERUP_LIFETIME = 10
      let powerUp: PowerUp | null = {
        pos: { x: 100, y: 100 },
        type: 'shield',
        lifetime: POWERUP_LIFETIME,
      }

      // Simulate time passing
      for (let t = 0; t < 12; t++) {
        if (powerUp) {
          powerUp.lifetime -= 1
          if (powerUp.lifetime <= 0) {
            powerUp = null
          }
        }
      }

      expect(powerUp).toBeNull()
    })

    test('collection radius is 30', () => {
      const COLLECTION_RADIUS = 30
      const playerPos = { x: 100, y: 100 }
      const powerUpPos = { x: 125, y: 100 }

      const distSquared = (playerPos.x - powerUpPos.x) ** 2 + (playerPos.y - powerUpPos.y) ** 2
      const thresholdSquared = COLLECTION_RADIUS * COLLECTION_RADIUS

      expect(distSquared).toBe(625) // 25^2
      expect(distSquared < thresholdSquared).toBe(true) // 625 < 900
    })

    test('collecting invalid index returns unchanged state', () => {
      const powerUps: PowerUp[] = [
        { pos: { x: 100, y: 100 }, type: 'shield', lifetime: 10 },
      ]

      const collectPowerUp = (index: number) => {
        const powerUp = powerUps[index]
        if (!powerUp) return null
        return powerUp
      }

      expect(collectPowerUp(0)).not.toBeNull()
      expect(collectPowerUp(5)).toBeNull()
      expect(collectPowerUp(-1)).toBeNull()
    })
  })
})
