/**
 * Vector Math Unit Tests
 * Tests core vector operations used throughout the game engine
 */

import { v, add, sub, mul, len, nor, clamp, rand, angleOf, fromAngle, dist2, wrap } from '../utils/vectorMath'

describe('vectorMath', () => {
  // ------------------------------------------------------------------ //
  //                         v() constructor
  // ------------------------------------------------------------------ //
  describe('v() - vector constructor', () => {
    test('creates zero vector by default', () => {
      const vec = v()
      expect(vec.x).toBe(0)
      expect(vec.y).toBe(0)
    })

    test('creates vector with given values', () => {
      const vec = v(3, 4)
      expect(vec.x).toBe(3)
      expect(vec.y).toBe(4)
    })

    test('creates vector with negative values', () => {
      const vec = v(-5, -10)
      expect(vec.x).toBe(-5)
      expect(vec.y).toBe(-10)
    })
  })

  // ------------------------------------------------------------------ //
  //                         add()
  // ------------------------------------------------------------------ //
  describe('add() - vector addition', () => {
    test('adds two vectors correctly', () => {
      const a = v(1, 2)
      const b = v(3, 4)
      const result = add(a, b)
      expect(result.x).toBe(4)
      expect(result.y).toBe(6)
    })

    test('is commutative', () => {
      const a = v(5, 3)
      const b = v(2, 7)
      const result1 = add(a, b)
      const result2 = add(b, a)
      expect(result1.x).toBe(result2.x)
      expect(result1.y).toBe(result2.y)
    })

    test('adding zero vector returns same vector', () => {
      const a = v(5, 10)
      const zero = v()
      const result = add(a, zero)
      expect(result.x).toBe(5)
      expect(result.y).toBe(10)
    })

    test('handles negative values', () => {
      const a = v(10, 10)
      const b = v(-3, -5)
      const result = add(a, b)
      expect(result.x).toBe(7)
      expect(result.y).toBe(5)
    })
  })

  // ------------------------------------------------------------------ //
  //                         sub()
  // ------------------------------------------------------------------ //
  describe('sub() - vector subtraction', () => {
    test('subtracts two vectors correctly', () => {
      const a = v(5, 8)
      const b = v(3, 2)
      const result = sub(a, b)
      expect(result.x).toBe(2)
      expect(result.y).toBe(6)
    })

    test('subtracting same vector gives zero', () => {
      const a = v(7, 11)
      const result = sub(a, a)
      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
    })

    test('handles negative results', () => {
      const a = v(3, 2)
      const b = v(5, 8)
      const result = sub(a, b)
      expect(result.x).toBe(-2)
      expect(result.y).toBe(-6)
    })
  })

  // ------------------------------------------------------------------ //
  //                         mul()
  // ------------------------------------------------------------------ //
  describe('mul() - scalar multiplication', () => {
    test('multiplies vector by scalar', () => {
      const a = v(3, 4)
      const result = mul(a, 2)
      expect(result.x).toBe(6)
      expect(result.y).toBe(8)
    })

    test('multiplying by zero gives zero vector', () => {
      const a = v(100, 200)
      const result = mul(a, 0)
      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
    })

    test('multiplying by 1 gives same vector', () => {
      const a = v(5, 10)
      const result = mul(a, 1)
      expect(result.x).toBe(5)
      expect(result.y).toBe(10)
    })

    test('handles negative scalars', () => {
      const a = v(3, 4)
      const result = mul(a, -2)
      expect(result.x).toBe(-6)
      expect(result.y).toBe(-8)
    })

    test('handles fractional scalars', () => {
      const a = v(10, 20)
      const result = mul(a, 0.5)
      expect(result.x).toBe(5)
      expect(result.y).toBe(10)
    })
  })

  // ------------------------------------------------------------------ //
  //                         len()
  // ------------------------------------------------------------------ //
  describe('len() - vector length', () => {
    test('calculates length of 3-4-5 triangle', () => {
      const a = v(3, 4)
      expect(len(a)).toBe(5)
    })

    test('zero vector has zero length', () => {
      const a = v()
      expect(len(a)).toBe(0)
    })

    test('unit vectors along axes have length 1', () => {
      expect(len(v(1, 0))).toBe(1)
      expect(len(v(0, 1))).toBe(1)
      expect(len(v(-1, 0))).toBe(1)
      expect(len(v(0, -1))).toBe(1)
    })

    test('handles large values', () => {
      const a = v(300, 400)
      expect(len(a)).toBe(500)
    })
  })

  // ------------------------------------------------------------------ //
  //                         nor()
  // ------------------------------------------------------------------ //
  describe('nor() - normalize', () => {
    test('normalizes non-zero vector to unit length', () => {
      const a = v(3, 4)
      const result = nor(a)
      expect(len(result)).toBeCloseTo(1)
    })

    test('maintains direction', () => {
      const a = v(10, 0)
      const result = nor(a)
      expect(result.x).toBeCloseTo(1)
      expect(result.y).toBeCloseTo(0)
    })

    test('zero vector normalizes to zero', () => {
      const a = v()
      const result = nor(a)
      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
    })

    test('already normalized vector stays same', () => {
      const a = v(0.6, 0.8) // 3-4-5 normalized
      const result = nor(a)
      expect(result.x).toBeCloseTo(0.6)
      expect(result.y).toBeCloseTo(0.8)
    })
  })

  // ------------------------------------------------------------------ //
  //                         clamp()
  // ------------------------------------------------------------------ //
  describe('clamp() - value clamping', () => {
    test('clamps value below minimum', () => {
      expect(clamp(-5, 0, 10)).toBe(0)
    })

    test('clamps value above maximum', () => {
      expect(clamp(15, 0, 10)).toBe(10)
    })

    test('value in range stays same', () => {
      expect(clamp(5, 0, 10)).toBe(5)
    })

    test('handles edge cases at boundaries', () => {
      expect(clamp(0, 0, 10)).toBe(0)
      expect(clamp(10, 0, 10)).toBe(10)
    })

    test('works with negative ranges', () => {
      expect(clamp(0, -10, -5)).toBe(-5)
      expect(clamp(-20, -10, -5)).toBe(-10)
    })
  })

  // ------------------------------------------------------------------ //
  //                         rand()
  // ------------------------------------------------------------------ //
  describe('rand() - random in range', () => {
    test('generates values within range', () => {
      for (let i = 0; i < 100; i++) {
        const result = rand(5, 10)
        expect(result).toBeGreaterThanOrEqual(5)
        expect(result).toBeLessThan(10)
      }
    })

    test('works with negative ranges', () => {
      for (let i = 0; i < 100; i++) {
        const result = rand(-10, -5)
        expect(result).toBeGreaterThanOrEqual(-10)
        expect(result).toBeLessThan(-5)
      }
    })

    test('same min and max returns min', () => {
      const result = rand(5, 5)
      expect(result).toBe(5)
    })
  })

  // ------------------------------------------------------------------ //
  //                         angleOf()
  // ------------------------------------------------------------------ //
  describe('angleOf() - vector angle', () => {
    test('right vector (1,0) is 0 radians', () => {
      expect(angleOf(v(1, 0))).toBeCloseTo(0)
    })

    test('up vector (0,1) is PI/2 radians', () => {
      expect(angleOf(v(0, 1))).toBeCloseTo(Math.PI / 2)
    })

    test('left vector (-1,0) is PI radians', () => {
      expect(Math.abs(angleOf(v(-1, 0)))).toBeCloseTo(Math.PI)
    })

    test('down vector (0,-1) is -PI/2 radians', () => {
      expect(angleOf(v(0, -1))).toBeCloseTo(-Math.PI / 2)
    })

    test('45 degree vector', () => {
      expect(angleOf(v(1, 1))).toBeCloseTo(Math.PI / 4)
    })
  })

  // ------------------------------------------------------------------ //
  //                         fromAngle()
  // ------------------------------------------------------------------ //
  describe('fromAngle() - angle to vector', () => {
    test('0 radians gives right vector', () => {
      const result = fromAngle(0)
      expect(result.x).toBeCloseTo(1)
      expect(result.y).toBeCloseTo(0)
    })

    test('PI/2 radians gives up vector', () => {
      const result = fromAngle(Math.PI / 2)
      expect(result.x).toBeCloseTo(0)
      expect(result.y).toBeCloseTo(1)
    })

    test('PI radians gives left vector', () => {
      const result = fromAngle(Math.PI)
      expect(result.x).toBeCloseTo(-1)
      expect(result.y).toBeCloseTo(0)
    })

    test('custom magnitude', () => {
      const result = fromAngle(0, 5)
      expect(result.x).toBeCloseTo(5)
      expect(result.y).toBeCloseTo(0)
    })

    test('round trip: fromAngle(angleOf(v)) preserves direction', () => {
      const original = v(3, 4)
      const angle = angleOf(original)
      const magnitude = len(original)
      const result = fromAngle(angle, magnitude)
      expect(result.x).toBeCloseTo(original.x)
      expect(result.y).toBeCloseTo(original.y)
    })
  })

  // ------------------------------------------------------------------ //
  //                         dist2()
  // ------------------------------------------------------------------ //
  describe('dist2() - squared distance', () => {
    test('distance between same point is 0', () => {
      const a = v(5, 5)
      expect(dist2(a, a)).toBe(0)
    })

    test('calculates squared distance correctly', () => {
      const a = v(0, 0)
      const b = v(3, 4)
      expect(dist2(a, b)).toBe(25) // 3^2 + 4^2 = 25
    })

    test('is commutative', () => {
      const a = v(1, 2)
      const b = v(5, 8)
      expect(dist2(a, b)).toBe(dist2(b, a))
    })

    test('handles negative coordinates', () => {
      const a = v(-3, -4)
      const b = v(0, 0)
      expect(dist2(a, b)).toBe(25)
    })
  })

  // ------------------------------------------------------------------ //
  //                         wrap()
  // ------------------------------------------------------------------ //
  describe('wrap() - toroidal wrapping', () => {
    test('position in bounds stays same', () => {
      const p = v(50, 50)
      const result = wrap(p, 100, 100)
      expect(result.x).toBe(50)
      expect(result.y).toBe(50)
    })

    test('wraps position exceeding right edge', () => {
      const p = v(150, 50)
      const result = wrap(p, 100, 100)
      expect(result.x).toBe(50)
      expect(result.y).toBe(50)
    })

    test('wraps position exceeding bottom edge', () => {
      const p = v(50, 150)
      const result = wrap(p, 100, 100)
      expect(result.x).toBe(50)
      expect(result.y).toBe(50)
    })

    test('wraps negative x position', () => {
      const p = v(-10, 50)
      const result = wrap(p, 100, 100)
      expect(result.x).toBe(90)
      expect(result.y).toBe(50)
    })

    test('wraps negative y position', () => {
      const p = v(50, -10)
      const result = wrap(p, 100, 100)
      expect(result.x).toBe(50)
      expect(result.y).toBe(90)
    })

    test('handles multiple wraps', () => {
      const p = v(250, 350)
      const result = wrap(p, 100, 100)
      expect(result.x).toBe(50)
      expect(result.y).toBe(50)
    })

    test('edge case: exactly at boundary', () => {
      const p = v(100, 100)
      const result = wrap(p, 100, 100)
      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
    })
  })
})
