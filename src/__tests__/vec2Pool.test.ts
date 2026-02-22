/**
 * Vec2 Pool and Mutable Operations Unit Tests
 * Tests Vec2 object pooling and mutable vector operations for GC reduction
 */

import {
  acquire,
  acquireWith,
  release,
  releaseMany,
  getStats,
  clear,
  resetStats,
} from '../utils/vec2Pool'
import { addTo, subTo, mulTo, norTo, len } from '../utils/vectorMath'

describe('Vec2 Pool', () => {
  // Reset pool state before each test
  beforeEach(() => {
    clear()
    resetStats()
  })

  // ------------------------------------------------------------------ //
  //                         Basic Pool Operations
  // ------------------------------------------------------------------ //
  describe('Basic pool operations', () => {
    test('acquire returns a zero vector', () => {
      const v = acquire()
      expect(v.x).toBe(0)
      expect(v.y).toBe(0)
    })

    test('acquire decreases available count', () => {
      const initialStats = getStats()
      const initialAvailable = initialStats.available

      acquire()

      const stats = getStats()
      expect(stats.available).toBe(initialAvailable - 1)
    })

    test('acquireWith returns vector with specified values', () => {
      const v = acquireWith(3, 4)
      expect(v.x).toBe(3)
      expect(v.y).toBe(4)
    })

    test('acquireWith handles negative values', () => {
      const v = acquireWith(-5, -10)
      expect(v.x).toBe(-5)
      expect(v.y).toBe(-10)
    })

    test('acquireWith handles zero values', () => {
      const v = acquireWith(0, 0)
      expect(v.x).toBe(0)
      expect(v.y).toBe(0)
    })

    test('release returns vector to pool', () => {
      const v = acquire()
      const statsBeforeRelease = getStats()

      release(v)

      const statsAfterRelease = getStats()
      expect(statsAfterRelease.available).toBe(statsBeforeRelease.available + 1)
    })

    test('release resets vector to zero', () => {
      const v = acquireWith(100, 200)
      release(v)

      const reused = acquire()
      expect(reused.x).toBe(0)
      expect(reused.y).toBe(0)
    })

    test('released vectors are reused', () => {
      const v1 = acquire()
      v1.x = 42
      v1.y = 99
      release(v1)

      const v2 = acquire()
      // v2 should be the same object as v1 (reset to 0, 0)
      expect(v2).toBe(v1)
      expect(v2.x).toBe(0)
      expect(v2.y).toBe(0)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Batch Operations
  // ------------------------------------------------------------------ //
  describe('Batch operations', () => {
    test('releaseMany releases multiple vectors at once', () => {
      const vectors = [acquire(), acquire(), acquire()]
      const statsBeforeRelease = getStats()

      releaseMany(vectors)

      const statsAfterRelease = getStats()
      expect(statsAfterRelease.available).toBe(statsBeforeRelease.available + 3)
    })

    test('releaseMany resets all vectors', () => {
      const vectors = [
        acquireWith(1, 2),
        acquireWith(3, 4),
        acquireWith(5, 6),
      ]

      releaseMany(vectors)

      // Acquire them back and verify they're reset
      const v1 = acquire()
      const v2 = acquire()
      const v3 = acquire()

      expect(v1.x).toBe(0)
      expect(v1.y).toBe(0)
      expect(v2.x).toBe(0)
      expect(v2.y).toBe(0)
      expect(v3.x).toBe(0)
      expect(v3.y).toBe(0)
    })

    test('releaseMany handles empty array', () => {
      const statsBefore = getStats()
      releaseMany([])
      const statsAfter = getStats()

      expect(statsAfter.available).toBe(statsBefore.available)
    })

    test('releaseMany handles large batches', () => {
      const vectors = []
      for (let i = 0; i < 50; i++) {
        vectors.push(acquireWith(i, i * 2))
      }

      const statsBeforeRelease = getStats()
      releaseMany(vectors)
      const statsAfterRelease = getStats()

      expect(statsAfterRelease.available).toBe(statsBeforeRelease.available + 50)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Pool Statistics
  // ------------------------------------------------------------------ //
  describe('Pool statistics', () => {
    test('getStats returns pool statistics', () => {
      const stats = getStats()

      expect(stats).toHaveProperty('available')
      expect(stats).toHaveProperty('size')
      expect(stats).toHaveProperty('acquired')
      expect(stats).toHaveProperty('released')
      expect(stats).toHaveProperty('created')
    })

    test('stats track acquired count', () => {
      resetStats()

      acquire()
      acquire()
      acquire()

      const stats = getStats()
      expect(stats.acquired).toBe(3)
    })

    test('stats track released count', () => {
      resetStats()

      const v1 = acquire()
      const v2 = acquire()

      release(v1)
      release(v2)

      const stats = getStats()
      expect(stats.released).toBe(2)
    })

    test('stats track created count when pool is empty', () => {
      clear()
      resetStats()

      // Acquire when pool is empty - should create new vectors
      acquire()
      acquire()

      const stats = getStats()
      expect(stats.created).toBe(2)
    })

    test('resetStats clears lifetime statistics', () => {
      acquire()
      acquire()
      release(acquire())

      resetStats()

      const stats = getStats()
      expect(stats.acquired).toBe(0)
      expect(stats.released).toBe(0)
      expect(stats.created).toBe(0)
    })

    test('clear empties the pool', () => {
      acquire()
      acquire()

      clear()

      const stats = getStats()
      expect(stats.available).toBe(0)
      expect(stats.size).toBe(0)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Pool Lifecycle
  // ------------------------------------------------------------------ //
  describe('Pool lifecycle', () => {
    test('pool maintains available count across acquire/release cycles', () => {
      const initialStats = getStats()
      const initialAvailable = initialStats.available

      const v1 = acquire()
      const v2 = acquire()
      const v3 = acquire()

      release(v1)
      release(v2)
      release(v3)

      const finalStats = getStats()
      expect(finalStats.available).toBe(initialAvailable)
    })

    test('pool grows when exhausted', () => {
      clear()

      // Pool is empty, acquire should create new vectors
      const v1 = acquire()
      const v2 = acquire()

      expect(v1).toBeDefined()
      expect(v2).toBeDefined()

      const stats = getStats()
      expect(stats.created).toBe(2)
    })

    test('pool reuses vectors efficiently', () => {
      clear()
      resetStats()

      // Acquire and release multiple times
      for (let i = 0; i < 10; i++) {
        const v = acquire()
        v.x = i
        release(v)
      }

      const stats = getStats()
      // Should only create 1 vector and reuse it
      expect(stats.created).toBe(1)
      expect(stats.acquired).toBe(10)
      expect(stats.released).toBe(10)
    })
  })
})

describe('Mutable Vector Operations', () => {
  // ------------------------------------------------------------------ //
  //                         addTo()
  // ------------------------------------------------------------------ //
  describe('addTo() - mutable addition', () => {
    test('adds vector in-place', () => {
      const a = acquireWith(1, 2)
      const b = acquireWith(3, 4)

      const result = addTo(a, b)

      expect(a.x).toBe(4)
      expect(a.y).toBe(6)
      expect(result).toBe(a) // Returns same object

      release(a)
      release(b)
    })

    test('modifies first argument only', () => {
      const a = acquireWith(5, 10)
      const b = acquireWith(2, 3)

      addTo(a, b)

      expect(a.x).toBe(7)
      expect(a.y).toBe(13)
      expect(b.x).toBe(2) // b unchanged
      expect(b.y).toBe(3)

      releaseMany([a, b])
    })

    test('handles negative values', () => {
      const a = acquireWith(10, 10)
      const b = acquireWith(-3, -5)

      addTo(a, b)

      expect(a.x).toBe(7)
      expect(a.y).toBe(5)

      releaseMany([a, b])
    })

    test('adding zero vector has no effect', () => {
      const a = acquireWith(5, 10)
      const zero = acquire()

      addTo(a, zero)

      expect(a.x).toBe(5)
      expect(a.y).toBe(10)

      releaseMany([a, zero])
    })
  })

  // ------------------------------------------------------------------ //
  //                         subTo()
  // ------------------------------------------------------------------ //
  describe('subTo() - mutable subtraction', () => {
    test('subtracts vector in-place', () => {
      const a = acquireWith(5, 8)
      const b = acquireWith(3, 2)

      const result = subTo(a, b)

      expect(a.x).toBe(2)
      expect(a.y).toBe(6)
      expect(result).toBe(a)

      releaseMany([a, b])
    })

    test('modifies first argument only', () => {
      const a = acquireWith(10, 20)
      const b = acquireWith(3, 5)

      subTo(a, b)

      expect(a.x).toBe(7)
      expect(a.y).toBe(15)
      expect(b.x).toBe(3) // b unchanged
      expect(b.y).toBe(5)

      releaseMany([a, b])
    })

    test('handles negative results', () => {
      const a = acquireWith(3, 2)
      const b = acquireWith(5, 8)

      subTo(a, b)

      expect(a.x).toBe(-2)
      expect(a.y).toBe(-6)

      releaseMany([a, b])
    })

    test('subtracting same values gives zero', () => {
      const a = acquireWith(7, 11)
      const b = acquireWith(7, 11)

      subTo(a, b)

      expect(a.x).toBe(0)
      expect(a.y).toBe(0)

      releaseMany([a, b])
    })
  })

  // ------------------------------------------------------------------ //
  //                         mulTo()
  // ------------------------------------------------------------------ //
  describe('mulTo() - mutable scalar multiplication', () => {
    test('multiplies vector by scalar in-place', () => {
      const a = acquireWith(3, 4)

      const result = mulTo(a, 2)

      expect(a.x).toBe(6)
      expect(a.y).toBe(8)
      expect(result).toBe(a)

      release(a)
    })

    test('multiplying by zero gives zero vector', () => {
      const a = acquireWith(100, 200)

      mulTo(a, 0)

      expect(a.x).toBe(0)
      expect(a.y).toBe(0)

      release(a)
    })

    test('multiplying by 1 has no effect', () => {
      const a = acquireWith(5, 10)

      mulTo(a, 1)

      expect(a.x).toBe(5)
      expect(a.y).toBe(10)

      release(a)
    })

    test('handles negative scalars', () => {
      const a = acquireWith(3, 4)

      mulTo(a, -2)

      expect(a.x).toBe(-6)
      expect(a.y).toBe(-8)

      release(a)
    })

    test('handles fractional scalars', () => {
      const a = acquireWith(10, 20)

      mulTo(a, 0.5)

      expect(a.x).toBe(5)
      expect(a.y).toBe(10)

      release(a)
    })
  })

  // ------------------------------------------------------------------ //
  //                         norTo()
  // ------------------------------------------------------------------ //
  describe('norTo() - mutable normalization', () => {
    test('normalizes vector to unit length in-place', () => {
      const a = acquireWith(3, 4)

      const result = norTo(a)

      expect(len(a)).toBeCloseTo(1)
      expect(result).toBe(a)

      release(a)
    })

    test('maintains direction', () => {
      const a = acquireWith(10, 0)

      norTo(a)

      expect(a.x).toBeCloseTo(1)
      expect(a.y).toBeCloseTo(0)

      release(a)
    })

    test('zero vector normalizes to zero', () => {
      const a = acquire()

      norTo(a)

      expect(a.x).toBe(0)
      expect(a.y).toBe(0)

      release(a)
    })

    test('already normalized vector stays same', () => {
      const a = acquireWith(0.6, 0.8) // 3-4-5 normalized

      norTo(a)

      expect(a.x).toBeCloseTo(0.6)
      expect(a.y).toBeCloseTo(0.8)

      release(a)
    })

    test('normalizes negative vectors', () => {
      const a = acquireWith(-3, -4)

      norTo(a)

      expect(len(a)).toBeCloseTo(1)
      expect(a.x).toBeCloseTo(-0.6)
      expect(a.y).toBeCloseTo(-0.8)

      release(a)
    })

    test('normalizes large vectors', () => {
      const a = acquireWith(300, 400)

      norTo(a)

      expect(len(a)).toBeCloseTo(1)
      expect(a.x).toBeCloseTo(0.6)
      expect(a.y).toBeCloseTo(0.8)

      release(a)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Combined Operations
  // ------------------------------------------------------------------ //
  describe('Combined mutable operations', () => {
    test('chaining operations works correctly', () => {
      const a = acquireWith(2, 4)
      const b = acquireWith(3, 1)

      // Chain: add, then multiply, then normalize
      addTo(a, b) // a = (5, 5)
      mulTo(a, 2) // a = (10, 10)
      norTo(a) // a = normalized

      expect(len(a)).toBeCloseTo(1)
      expect(a.x).toBeCloseTo(a.y) // Should be equal (45-degree angle)

      releaseMany([a, b])
    })

    test('mutable operations reduce allocations', () => {
      clear()
      resetStats()

      // Using mutable operations
      const a = acquire()
      const b = acquireWith(1, 1)

      for (let i = 0; i < 100; i++) {
        addTo(a, b)
      }

      const stats = getStats()
      // Should only create 2 vectors total
      expect(stats.created).toBeLessThanOrEqual(2)

      releaseMany([a, b])
    })

    test('interleaved acquire/release with mutable ops', () => {
      const a = acquireWith(5, 5)
      const temp = acquire()

      temp.x = 2
      temp.y = 3
      addTo(a, temp)
      release(temp)

      expect(a.x).toBe(7)
      expect(a.y).toBe(8)

      release(a)
    })
  })
})
