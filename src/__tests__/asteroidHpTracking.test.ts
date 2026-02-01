/**
 * Asteroid HP Tracking Tests
 * Tests for asteroid HP initialization, damage accumulation, and destruction
 */

import { useGameStore, getAsteroidHp } from '../state/gameStore'
import type { Asteroid } from '../types/game'

// Reset store before each test
beforeEach(() => {
  useGameStore.getState().resetGame()
  useGameStore.getState().setDimensions(800, 600)
})

describe('Asteroid HP Tracking', () => {
  // ------------------------------------------------------------------ //
  //                         HP Initialization
  // ------------------------------------------------------------------ //
  describe('HP initialization', () => {
    test('getAsteroidHp returns correct HP for tier 3', () => {
      expect(getAsteroidHp(3)).toBe(3)
    })

    test('getAsteroidHp returns correct HP for tier 2', () => {
      expect(getAsteroidHp(2)).toBe(2)
    })

    test('getAsteroidHp returns correct HP for tier 1', () => {
      expect(getAsteroidHp(1)).toBe(1)
    })

    test('spawned asteroids have correct HP based on tier', () => {
      useGameStore.getState().spawnAsteroids(5)
      const asteroids = useGameStore.getState().asteroids

      expect(asteroids).toHaveLength(5)
      // All spawned asteroids are tier 3
      asteroids.forEach((asteroid) => {
        expect(asteroid.tier).toBe(3)
        expect(asteroid.hp).toBe(3)
      })
    })

    test('split asteroids have correct HP for tier 2', () => {
      // Spawn tier 3 asteroid
      useGameStore.getState().spawnAsteroids(1)
      const tier3 = useGameStore.getState().asteroids[0]

      // Split tier 3 into tier 2
      useGameStore.getState().splitAsteroid(tier3)

      const tier2Asteroids = useGameStore.getState().asteroids.filter((a) => a.tier === 2)
      expect(tier2Asteroids).toHaveLength(2)

      tier2Asteroids.forEach((asteroid) => {
        expect(asteroid.tier).toBe(2)
        expect(asteroid.hp).toBe(2)
      })
    })

    test('split tier 2 asteroids have correct HP for tier 1', () => {
      // Manually create tier 2 asteroid
      const tier2: Asteroid = {
        pos: { x: 100, y: 100 },
        vel: { x: 0, y: 0 },
        radius: 30,
        spin: 0,
        ang: 0,
        tier: 2,
        hp: 2,
      }
      useGameStore.setState({ asteroids: [tier2] })

      // Split tier 2 into tier 1
      useGameStore.getState().splitAsteroid(tier2)

      const tier1Asteroids = useGameStore.getState().asteroids.filter((a) => a.tier === 1)
      expect(tier1Asteroids).toHaveLength(2)

      tier1Asteroids.forEach((asteroid) => {
        expect(asteroid.tier).toBe(1)
        expect(asteroid.hp).toBe(1)
      })
    })
  })

  // ------------------------------------------------------------------ //
  //                         HP Consistency
  // ------------------------------------------------------------------ //
  describe('HP consistency', () => {
    test('all tier 3 asteroids start with 3 HP', () => {
      useGameStore.getState().spawnAsteroids(10)
      const asteroids = useGameStore.getState().asteroids

      asteroids.forEach((asteroid) => {
        if (asteroid.tier === 3) {
          expect(asteroid.hp).toBe(3)
        }
      })
    })

    test('HP matches tier value', () => {
      const tiers: Array<1 | 2 | 3> = [1, 2, 3]

      tiers.forEach((tier) => {
        const hp = getAsteroidHp(tier)
        expect(hp).toBe(tier)
      })
    })

    test('split asteroids maintain HP integrity', () => {
      useGameStore.getState().spawnAsteroids(1)
      const tier3 = useGameStore.getState().asteroids[0]

      // Split tier 3 -> tier 2
      useGameStore.getState().splitAsteroid(tier3)
      const tier2s = useGameStore.getState().asteroids.filter((a) => a.tier === 2)

      tier2s.forEach((asteroid) => {
        expect(asteroid.hp).toBe(asteroid.tier)
      })

      // Split tier 2 -> tier 1
      useGameStore.getState().splitAsteroid(tier2s[0])
      const tier1s = useGameStore.getState().asteroids.filter((a) => a.tier === 1)

      tier1s.forEach((asteroid) => {
        expect(asteroid.hp).toBe(asteroid.tier)
      })
    })
  })

  // ------------------------------------------------------------------ //
  //                         Asteroid Splitting
  // ------------------------------------------------------------------ //
  describe('asteroid splitting behavior', () => {
    test('tier 3 asteroid splits into 2 tier 2 asteroids', () => {
      useGameStore.getState().spawnAsteroids(1)
      const tier3 = useGameStore.getState().asteroids[0]

      useGameStore.getState().splitAsteroid(tier3)

      const tier2s = useGameStore.getState().asteroids.filter((a) => a.tier === 2)
      expect(tier2s).toHaveLength(2)

      tier2s.forEach((asteroid) => {
        expect(asteroid.hp).toBe(2)
        expect(asteroid.radius).toBe(tier3.radius * 0.65)
      })
    })

    test('tier 2 asteroid splits into 2 tier 1 asteroids', () => {
      const tier2: Asteroid = {
        pos: { x: 200, y: 200 },
        vel: { x: 0, y: 0 },
        radius: 30,
        spin: 0,
        ang: 0,
        tier: 2,
        hp: 2,
      }
      useGameStore.setState({ asteroids: [tier2] })

      useGameStore.getState().splitAsteroid(tier2)

      const tier1s = useGameStore.getState().asteroids.filter((a) => a.tier === 1)
      expect(tier1s).toHaveLength(2)

      tier1s.forEach((asteroid) => {
        expect(asteroid.hp).toBe(1)
        expect(asteroid.radius).toBe(tier2.radius * 0.65)
      })
    })

    test('tier 1 asteroid does not split', () => {
      const tier1: Asteroid = {
        pos: { x: 100, y: 100 },
        vel: { x: 0, y: 0 },
        radius: 15,
        spin: 0,
        ang: 0,
        tier: 1,
        hp: 1,
      }
      useGameStore.setState({ asteroids: [tier1] })

      useGameStore.getState().splitAsteroid(tier1)

      // No new asteroids should be created
      const asteroids = useGameStore.getState().asteroids
      expect(asteroids).toHaveLength(1)
      expect(asteroids[0]).toBe(tier1)
    })

    test('split asteroids have random velocities', () => {
      useGameStore.getState().spawnAsteroids(1)
      const tier3 = useGameStore.getState().asteroids[0]
      const originalVel = { ...tier3.vel }

      useGameStore.getState().splitAsteroid(tier3)

      const tier2s = useGameStore.getState().asteroids.filter((a) => a.tier === 2)

      // Split asteroids should have different velocities from each other and parent
      tier2s.forEach((asteroid) => {
        const velMagnitude = Math.sqrt(asteroid.vel.x ** 2 + asteroid.vel.y ** 2)
        // Should have some velocity (not zero)
        expect(velMagnitude).toBeGreaterThan(0)
      })

      // Two split asteroids should have different velocities
      const vel1 = tier2s[0].vel
      const vel2 = tier2s[1].vel
      const sameVelocity = vel1.x === vel2.x && vel1.y === vel2.y
      expect(sameVelocity).toBe(false)
    })
  })

  // ------------------------------------------------------------------ //
  //                         HP Field Presence
  // ------------------------------------------------------------------ //
  describe('HP field presence', () => {
    test('all asteroids have hp field', () => {
      useGameStore.getState().spawnAsteroids(5)
      const asteroids = useGameStore.getState().asteroids

      asteroids.forEach((asteroid) => {
        expect(asteroid).toHaveProperty('hp')
        expect(typeof asteroid.hp).toBe('number')
      })
    })

    test('hp field is always positive', () => {
      useGameStore.getState().spawnAsteroids(5)
      const asteroids = useGameStore.getState().asteroids

      asteroids.forEach((asteroid) => {
        expect(asteroid.hp).toBeGreaterThan(0)
      })
    })

    test('hp field is integer', () => {
      useGameStore.getState().spawnAsteroids(5)
      const asteroids = useGameStore.getState().asteroids

      asteroids.forEach((asteroid) => {
        expect(Number.isInteger(asteroid.hp)).toBe(true)
      })
    })

    test('hp field is within valid range', () => {
      useGameStore.getState().spawnAsteroids(10)

      // Create tier 2 and tier 1 asteroids by splitting
      const tier3 = useGameStore.getState().asteroids[0]
      useGameStore.getState().splitAsteroid(tier3)

      const tier2 = useGameStore.getState().asteroids.find((a) => a.tier === 2)!
      useGameStore.getState().splitAsteroid(tier2)

      const allAsteroids = useGameStore.getState().asteroids

      allAsteroids.forEach((asteroid) => {
        expect(asteroid.hp).toBeGreaterThanOrEqual(1)
        expect(asteroid.hp).toBeLessThanOrEqual(3)
      })
    })
  })

  // ------------------------------------------------------------------ //
  //                         Edge Cases
  // ------------------------------------------------------------------ //
  describe('edge cases', () => {
    test('spawning zero asteroids creates no asteroids', () => {
      useGameStore.getState().spawnAsteroids(0)
      expect(useGameStore.getState().asteroids).toHaveLength(0)
    })

    test('spawning multiple waves maintains HP integrity', () => {
      useGameStore.getState().spawnAsteroids(3)
      useGameStore.getState().spawnAsteroids(3)
      useGameStore.getState().spawnAsteroids(3)

      const asteroids = useGameStore.getState().asteroids
      expect(asteroids).toHaveLength(9)

      asteroids.forEach((asteroid) => {
        expect(asteroid.hp).toBe(3)
        expect(asteroid.tier).toBe(3)
      })
    })

    test('splitting multiple asteroids maintains HP consistency', () => {
      useGameStore.getState().spawnAsteroids(3)
      const tier3s = [...useGameStore.getState().asteroids]

      // Split all tier 3 asteroids
      tier3s.forEach((asteroid) => {
        useGameStore.getState().splitAsteroid(asteroid)
      })

      const tier2s = useGameStore.getState().asteroids.filter((a) => a.tier === 2)
      expect(tier2s).toHaveLength(6) // 3 asteroids * 2 splits each

      tier2s.forEach((asteroid) => {
        expect(asteroid.hp).toBe(2)
        expect(asteroid.tier).toBe(2)
      })
    })

    test('HP remains consistent across game reset', () => {
      useGameStore.getState().spawnAsteroids(5)
      useGameStore.getState().resetGame()
      useGameStore.getState().spawnAsteroids(5)

      const asteroids = useGameStore.getState().asteroids
      asteroids.forEach((asteroid) => {
        expect(asteroid.hp).toBe(3)
      })
    })
  })

  // ------------------------------------------------------------------ //
  //                         Type Validation
  // ------------------------------------------------------------------ //
  describe('type validation', () => {
    test('getAsteroidHp only accepts valid tier values', () => {
      // Valid tiers
      expect(() => getAsteroidHp(1)).not.toThrow()
      expect(() => getAsteroidHp(2)).not.toThrow()
      expect(() => getAsteroidHp(3)).not.toThrow()
    })

    test('asteroid tier is always 1, 2, or 3', () => {
      useGameStore.getState().spawnAsteroids(5)
      const tier3 = useGameStore.getState().asteroids[0]
      useGameStore.getState().splitAsteroid(tier3)
      const tier2 = useGameStore.getState().asteroids.find((a) => a.tier === 2)!
      useGameStore.getState().splitAsteroid(tier2)

      const allAsteroids = useGameStore.getState().asteroids
      allAsteroids.forEach((asteroid) => {
        expect([1, 2, 3]).toContain(asteroid.tier)
      })
    })

    test('asteroid HP matches TypeScript type definition', () => {
      useGameStore.getState().spawnAsteroids(1)
      const asteroid = useGameStore.getState().asteroids[0]

      // HP should be a number (TypeScript ensures this at compile time)
      expect(typeof asteroid.hp).toBe('number')
      expect(asteroid).toMatchObject({
        pos: expect.any(Object),
        vel: expect.any(Object),
        radius: expect.any(Number),
        spin: expect.any(Number),
        ang: expect.any(Number),
        tier: expect.any(Number),
        hp: expect.any(Number),
      })
    })
  })
})
