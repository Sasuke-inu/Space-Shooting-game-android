/**
 * Score System Unit Tests
 * Tests centralized scoring and credit calculation logic
 */

import {
  getAsteroidScore,
  getAsteroidCredits,
  getEnemyScore,
  getEnemyCredits,
  getBossScore,
  getBossCredits,
} from '../utils/scoreSystem'

describe('ScoreSystem', () => {
  // ------------------------------------------------------------------ //
  //                         Asteroid Scoring
  // ------------------------------------------------------------------ //
  describe('asteroid scoring', () => {
    describe('getAsteroidScore()', () => {
      test('tier 1 asteroids give 20 points', () => {
        expect(getAsteroidScore(1)).toBe(20)
      })

      test('tier 2 asteroids give 40 points', () => {
        expect(getAsteroidScore(2)).toBe(40)
      })

      test('tier 3 asteroids give 60 points', () => {
        expect(getAsteroidScore(3)).toBe(60)
      })

      test('score scales linearly with tier', () => {
        const tier1 = getAsteroidScore(1)
        const tier2 = getAsteroidScore(2)
        const tier3 = getAsteroidScore(3)
        expect(tier2).toBe(tier1 * 2)
        expect(tier3).toBe(tier1 * 3)
      })
    })

    describe('getAsteroidCredits()', () => {
      test('tier 1 asteroids give 1 credit', () => {
        expect(getAsteroidCredits(1)).toBe(1)
      })

      test('tier 2 asteroids give 2 credits', () => {
        expect(getAsteroidCredits(2)).toBe(2)
      })

      test('tier 3 asteroids give 3 credits', () => {
        expect(getAsteroidCredits(3)).toBe(3)
      })

      test('credits equal tier value', () => {
        expect(getAsteroidCredits(1)).toBe(1)
        expect(getAsteroidCredits(2)).toBe(2)
        expect(getAsteroidCredits(3)).toBe(3)
      })
    })
  })

  // ------------------------------------------------------------------ //
  //                         Enemy Scoring
  // ------------------------------------------------------------------ //
  describe('enemy scoring', () => {
    describe('getEnemyScore()', () => {
      test('scout gives 75 points', () => {
        expect(getEnemyScore('scout')).toBe(75)
      })

      test('tank gives 200 points', () => {
        expect(getEnemyScore('tank')).toBe(200)
      })

      test('sniper gives 150 points', () => {
        expect(getEnemyScore('sniper')).toBe(150)
      })

      test('bomber gives 125 points', () => {
        expect(getEnemyScore('bomber')).toBe(125)
      })

      test('tank gives highest points', () => {
        const scout = getEnemyScore('scout')
        const tank = getEnemyScore('tank')
        const sniper = getEnemyScore('sniper')
        const bomber = getEnemyScore('bomber')
        expect(tank).toBeGreaterThan(scout)
        expect(tank).toBeGreaterThan(sniper)
        expect(tank).toBeGreaterThan(bomber)
      })

      test('scout gives lowest points', () => {
        const scout = getEnemyScore('scout')
        const tank = getEnemyScore('tank')
        const sniper = getEnemyScore('sniper')
        const bomber = getEnemyScore('bomber')
        expect(scout).toBeLessThan(tank)
        expect(scout).toBeLessThan(sniper)
        expect(scout).toBeLessThan(bomber)
      })
    })

    describe('getEnemyCredits()', () => {
      test('scout gives 7 credits', () => {
        expect(getEnemyCredits('scout')).toBe(7)
      })

      test('tank gives 20 credits', () => {
        expect(getEnemyCredits('tank')).toBe(20)
      })

      test('sniper gives 15 credits', () => {
        expect(getEnemyCredits('sniper')).toBe(15)
      })

      test('bomber gives 12 credits', () => {
        expect(getEnemyCredits('bomber')).toBe(12)
      })

      test('credits are 1/10th of points (floored)', () => {
        expect(getEnemyCredits('scout')).toBe(Math.floor(75 / 10))
        expect(getEnemyCredits('tank')).toBe(Math.floor(200 / 10))
        expect(getEnemyCredits('sniper')).toBe(Math.floor(150 / 10))
        expect(getEnemyCredits('bomber')).toBe(Math.floor(125 / 10))
      })

      test('credits are always integers', () => {
        expect(Number.isInteger(getEnemyCredits('scout'))).toBe(true)
        expect(Number.isInteger(getEnemyCredits('tank'))).toBe(true)
        expect(Number.isInteger(getEnemyCredits('sniper'))).toBe(true)
        expect(Number.isInteger(getEnemyCredits('bomber'))).toBe(true)
      })
    })
  })

  // ------------------------------------------------------------------ //
  //                         Boss Scoring
  // ------------------------------------------------------------------ //
  describe('boss scoring', () => {
    describe('getBossScore()', () => {
      test('destroyer gives 1000 points', () => {
        expect(getBossScore('destroyer')).toBe(1000)
      })

      test('carrier gives 1500 points', () => {
        expect(getBossScore('carrier')).toBe(1500)
      })

      test('dreadnought gives 2500 points', () => {
        expect(getBossScore('dreadnought')).toBe(2500)
      })

      test('dreadnought gives highest points', () => {
        const destroyer = getBossScore('destroyer')
        const carrier = getBossScore('carrier')
        const dreadnought = getBossScore('dreadnought')
        expect(dreadnought).toBeGreaterThan(destroyer)
        expect(dreadnought).toBeGreaterThan(carrier)
      })

      test('destroyer gives lowest points', () => {
        const destroyer = getBossScore('destroyer')
        const carrier = getBossScore('carrier')
        const dreadnought = getBossScore('dreadnought')
        expect(destroyer).toBeLessThan(carrier)
        expect(destroyer).toBeLessThan(dreadnought)
      })

      test('boss points are significantly higher than enemies', () => {
        const tankPoints = getEnemyScore('tank') // Highest enemy
        const destroyerPoints = getBossScore('destroyer') // Lowest boss
        expect(destroyerPoints).toBeGreaterThan(tankPoints * 4)
      })
    })

    describe('getBossCredits()', () => {
      test('destroyer gives 100 credits', () => {
        expect(getBossCredits('destroyer')).toBe(100)
      })

      test('carrier gives 150 credits', () => {
        expect(getBossCredits('carrier')).toBe(150)
      })

      test('dreadnought gives 250 credits', () => {
        expect(getBossCredits('dreadnought')).toBe(250)
      })

      test('credits are 1/10th of points (floored)', () => {
        expect(getBossCredits('destroyer')).toBe(Math.floor(1000 / 10))
        expect(getBossCredits('carrier')).toBe(Math.floor(1500 / 10))
        expect(getBossCredits('dreadnought')).toBe(Math.floor(2500 / 10))
      })

      test('credits are always integers', () => {
        expect(Number.isInteger(getBossCredits('destroyer'))).toBe(true)
        expect(Number.isInteger(getBossCredits('carrier'))).toBe(true)
        expect(Number.isInteger(getBossCredits('dreadnought'))).toBe(true)
      })

      test('boss credits are significantly higher than enemies', () => {
        const tankCredits = getEnemyCredits('tank') // Highest enemy
        const destroyerCredits = getBossCredits('destroyer') // Lowest boss
        expect(destroyerCredits).toBeGreaterThan(tankCredits * 4)
      })
    })
  })

  // ------------------------------------------------------------------ //
  //                         Cross-Entity Comparisons
  // ------------------------------------------------------------------ //
  describe('cross-entity comparisons', () => {
    test('bosses give more points than enemies', () => {
      const maxEnemyScore = Math.max(
        getEnemyScore('scout'),
        getEnemyScore('tank'),
        getEnemyScore('sniper'),
        getEnemyScore('bomber')
      )
      const minBossScore = Math.min(
        getBossScore('destroyer'),
        getBossScore('carrier'),
        getBossScore('dreadnought')
      )
      expect(minBossScore).toBeGreaterThan(maxEnemyScore)
    })

    test('enemies give more points than asteroids', () => {
      const maxAsteroidScore = getAsteroidScore(3)
      const minEnemyScore = Math.min(
        getEnemyScore('scout'),
        getEnemyScore('tank'),
        getEnemyScore('sniper'),
        getEnemyScore('bomber')
      )
      expect(minEnemyScore).toBeGreaterThan(maxAsteroidScore)
    })

    test('bosses give more credits than enemies', () => {
      const maxEnemyCredits = Math.max(
        getEnemyCredits('scout'),
        getEnemyCredits('tank'),
        getEnemyCredits('sniper'),
        getEnemyCredits('bomber')
      )
      const minBossCredits = Math.min(
        getBossCredits('destroyer'),
        getBossCredits('carrier'),
        getBossCredits('dreadnought')
      )
      expect(minBossCredits).toBeGreaterThan(maxEnemyCredits)
    })

    test('enemies give more credits than asteroids', () => {
      const maxAsteroidCredits = getAsteroidCredits(3)
      const minEnemyCredits = Math.min(
        getEnemyCredits('scout'),
        getEnemyCredits('tank'),
        getEnemyCredits('sniper'),
        getEnemyCredits('bomber')
      )
      expect(minEnemyCredits).toBeGreaterThan(maxAsteroidCredits)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Value Consistency
  // ------------------------------------------------------------------ //
  describe('value consistency', () => {
    test('all functions return positive values', () => {
      expect(getAsteroidScore(1)).toBeGreaterThan(0)
      expect(getAsteroidScore(2)).toBeGreaterThan(0)
      expect(getAsteroidScore(3)).toBeGreaterThan(0)
      expect(getAsteroidCredits(1)).toBeGreaterThan(0)
      expect(getAsteroidCredits(2)).toBeGreaterThan(0)
      expect(getAsteroidCredits(3)).toBeGreaterThan(0)
      expect(getEnemyScore('scout')).toBeGreaterThan(0)
      expect(getEnemyScore('tank')).toBeGreaterThan(0)
      expect(getEnemyScore('sniper')).toBeGreaterThan(0)
      expect(getEnemyScore('bomber')).toBeGreaterThan(0)
      expect(getEnemyCredits('scout')).toBeGreaterThan(0)
      expect(getEnemyCredits('tank')).toBeGreaterThan(0)
      expect(getEnemyCredits('sniper')).toBeGreaterThan(0)
      expect(getEnemyCredits('bomber')).toBeGreaterThan(0)
      expect(getBossScore('destroyer')).toBeGreaterThan(0)
      expect(getBossScore('carrier')).toBeGreaterThan(0)
      expect(getBossScore('dreadnought')).toBeGreaterThan(0)
      expect(getBossCredits('destroyer')).toBeGreaterThan(0)
      expect(getBossCredits('carrier')).toBeGreaterThan(0)
      expect(getBossCredits('dreadnought')).toBeGreaterThan(0)
    })

    test('all score functions return integers', () => {
      expect(Number.isInteger(getAsteroidScore(1))).toBe(true)
      expect(Number.isInteger(getAsteroidScore(2))).toBe(true)
      expect(Number.isInteger(getAsteroidScore(3))).toBe(true)
      expect(Number.isInteger(getEnemyScore('scout'))).toBe(true)
      expect(Number.isInteger(getEnemyScore('tank'))).toBe(true)
      expect(Number.isInteger(getEnemyScore('sniper'))).toBe(true)
      expect(Number.isInteger(getEnemyScore('bomber'))).toBe(true)
      expect(Number.isInteger(getBossScore('destroyer'))).toBe(true)
      expect(Number.isInteger(getBossScore('carrier'))).toBe(true)
      expect(Number.isInteger(getBossScore('dreadnought'))).toBe(true)
    })

    test('all credit functions return integers', () => {
      expect(Number.isInteger(getAsteroidCredits(1))).toBe(true)
      expect(Number.isInteger(getAsteroidCredits(2))).toBe(true)
      expect(Number.isInteger(getAsteroidCredits(3))).toBe(true)
      expect(Number.isInteger(getEnemyCredits('scout'))).toBe(true)
      expect(Number.isInteger(getEnemyCredits('tank'))).toBe(true)
      expect(Number.isInteger(getEnemyCredits('sniper'))).toBe(true)
      expect(Number.isInteger(getEnemyCredits('bomber'))).toBe(true)
      expect(Number.isInteger(getBossCredits('destroyer'))).toBe(true)
      expect(Number.isInteger(getBossCredits('carrier'))).toBe(true)
      expect(Number.isInteger(getBossCredits('dreadnought'))).toBe(true)
    })

    test('credits are always less than or equal to points', () => {
      expect(getAsteroidCredits(1)).toBeLessThanOrEqual(getAsteroidScore(1))
      expect(getAsteroidCredits(2)).toBeLessThanOrEqual(getAsteroidScore(2))
      expect(getAsteroidCredits(3)).toBeLessThanOrEqual(getAsteroidScore(3))
      expect(getEnemyCredits('scout')).toBeLessThanOrEqual(getEnemyScore('scout'))
      expect(getEnemyCredits('tank')).toBeLessThanOrEqual(getEnemyScore('tank'))
      expect(getEnemyCredits('sniper')).toBeLessThanOrEqual(getEnemyScore('sniper'))
      expect(getEnemyCredits('bomber')).toBeLessThanOrEqual(getEnemyScore('bomber'))
      expect(getBossCredits('destroyer')).toBeLessThanOrEqual(getBossScore('destroyer'))
      expect(getBossCredits('carrier')).toBeLessThanOrEqual(getBossScore('carrier'))
      expect(getBossCredits('dreadnought')).toBeLessThanOrEqual(getBossScore('dreadnought'))
    })
  })
})
