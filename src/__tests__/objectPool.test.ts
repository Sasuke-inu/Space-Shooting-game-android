/**
 * Object Pool Unit Tests
 * Tests generic object pool for reducing garbage collection
 */

import { ObjectPool, createObjectPool } from '../utils/objectPool'

// Test object type
interface TestObject {
  id: number
  active: boolean
  value: string
}

describe('ObjectPool', () => {
  // ------------------------------------------------------------------ //
  //                         Basic Pool Operations
  // ------------------------------------------------------------------ //
  describe('Basic pool operations', () => {
    test('creates pool with factory and reset functions', () => {
      const factory = () => ({ id: 0, active: false, value: '' })
      const reset = (obj: TestObject) => {
        obj.active = false
        obj.value = ''
      }
      const pool = new ObjectPool(factory, reset)

      expect(pool).toBeDefined()
      expect(pool.getAvailable()).toBe(0)
    })

    test('pre-allocates initial objects', () => {
      const factory = () => ({ id: 0, active: false, value: '' })
      const reset = (obj: TestObject) => {
        obj.active = false
      }
      const pool = new ObjectPool(factory, reset, 10)

      expect(pool.getAvailable()).toBe(10)
    })

    test('acquire returns object from pool', () => {
      const factory = () => ({ id: 0, active: false, value: '' })
      const reset = (obj: TestObject) => {
        obj.active = false
      }
      const pool = new ObjectPool(factory, reset, 5)

      const obj = pool.acquire()
      expect(obj).toBeDefined()
      expect(pool.getAvailable()).toBe(4)
    })

    test('acquire creates new object when pool is empty', () => {
      const factory = () => ({ id: Math.random(), active: false, value: '' })
      const reset = (obj: TestObject) => {
        obj.active = false
      }
      const pool = new ObjectPool(factory, reset, 0)

      const obj = pool.acquire()
      expect(obj).toBeDefined()
      expect(pool.getAvailable()).toBe(0)
    })

    test('release returns object to pool', () => {
      const factory = () => ({ id: 0, active: false, value: '' })
      const reset = (obj: TestObject) => {
        obj.active = false
        obj.value = ''
      }
      const pool = new ObjectPool(factory, reset, 0)

      const obj = pool.acquire()
      expect(pool.getAvailable()).toBe(0)

      pool.release(obj)
      expect(pool.getAvailable()).toBe(1)
    })

    test('release resets object state', () => {
      const factory = () => ({ id: 0, active: false, value: '' })
      const reset = (obj: TestObject) => {
        obj.active = false
        obj.value = 'reset'
      }
      const pool = new ObjectPool(factory, reset)

      const obj = pool.acquire()
      obj.active = true
      obj.value = 'modified'

      pool.release(obj)

      const recycled = pool.acquire()
      expect(recycled.active).toBe(false)
      expect(recycled.value).toBe('reset')
    })
  })

  // ------------------------------------------------------------------ //
  //                         Pool Size Management
  // ------------------------------------------------------------------ //
  describe('Pool size management', () => {
    test('respects max pool size', () => {
      const factory = () => ({ id: 0, active: false, value: '' })
      const reset = (obj: TestObject) => {
        obj.active = false
      }
      const pool = new ObjectPool(factory, reset, 0, 5)

      // Acquire and release 10 objects
      const objects: TestObject[] = []
      for (let i = 0; i < 10; i++) {
        objects.push(pool.acquire())
      }

      objects.forEach(obj => pool.release(obj))

      // Pool should only keep up to maxSize
      expect(pool.getAvailable()).toBe(5)
    })

    test('unlimited pool size when maxSize is 0', () => {
      const factory = () => ({ id: 0, active: false, value: '' })
      const reset = (obj: TestObject) => {
        obj.active = false
      }
      const pool = new ObjectPool(factory, reset, 0, 0)

      // Acquire and release many objects
      const objects: TestObject[] = []
      for (let i = 0; i < 100; i++) {
        objects.push(pool.acquire())
      }

      objects.forEach(obj => pool.release(obj))

      // All objects should be in pool
      expect(pool.getAvailable()).toBe(100)
    })

    test('clear empties the pool', () => {
      const factory = () => ({ id: 0, active: false, value: '' })
      const reset = (obj: TestObject) => {
        obj.active = false
      }
      const pool = new ObjectPool(factory, reset, 10)

      expect(pool.getAvailable()).toBe(10)
      pool.clear()
      expect(pool.getAvailable()).toBe(0)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Batch Operations
  // ------------------------------------------------------------------ //
  describe('Batch operations', () => {
    test('releaseMany releases multiple objects at once', () => {
      const factory = () => ({ id: 0, active: false, value: '' })
      const reset = (obj: TestObject) => {
        obj.active = false
      }
      const pool = new ObjectPool(factory, reset)

      const objects: TestObject[] = []
      for (let i = 0; i < 5; i++) {
        objects.push(pool.acquire())
      }

      expect(pool.getAvailable()).toBe(0)
      pool.releaseMany(objects)
      expect(pool.getAvailable()).toBe(5)
    })

    test('releaseMany resets all objects', () => {
      const factory = () => ({ id: 0, active: false, value: '' })
      const reset = (obj: TestObject) => {
        obj.active = false
        obj.value = 'reset'
      }
      const pool = new ObjectPool(factory, reset)

      const objects: TestObject[] = []
      for (let i = 0; i < 3; i++) {
        const obj = pool.acquire()
        obj.active = true
        obj.value = `object-${i}`
        objects.push(obj)
      }

      pool.releaseMany(objects)

      // Verify all objects were reset
      for (let i = 0; i < 3; i++) {
        const obj = pool.acquire()
        expect(obj.active).toBe(false)
        expect(obj.value).toBe('reset')
      }
    })
  })

  // ------------------------------------------------------------------ //
  //                         Statistics Tracking
  // ------------------------------------------------------------------ //
  describe('Statistics tracking', () => {
    test('tracks total objects created', () => {
      const factory = () => ({ id: 0, active: false, value: '' })
      const reset = (obj: TestObject) => {
        obj.active = false
      }
      const pool = new ObjectPool(factory, reset, 5)

      const stats = pool.getStats()
      expect(stats.totalCreated).toBe(5)

      // Acquire more than initial size
      for (let i = 0; i < 10; i++) {
        pool.acquire()
      }

      const newStats = pool.getStats()
      expect(newStats.totalCreated).toBe(15)
    })

    test('tracks total acquired and released', () => {
      const factory = () => ({ id: 0, active: false, value: '' })
      const reset = (obj: TestObject) => {
        obj.active = false
      }
      const pool = new ObjectPool(factory, reset)

      const obj1 = pool.acquire()
      const obj2 = pool.acquire()
      pool.release(obj1)

      const stats = pool.getStats()
      expect(stats.totalAcquired).toBe(2)
      expect(stats.totalReleased).toBe(1)
      expect(stats.inUse).toBe(1)
    })

    test('calculates objects in use correctly', () => {
      const factory = () => ({ id: 0, active: false, value: '' })
      const reset = (obj: TestObject) => {
        obj.active = false
      }
      const pool = new ObjectPool(factory, reset, 10)

      const objects: TestObject[] = []
      for (let i = 0; i < 7; i++) {
        objects.push(pool.acquire())
      }

      let stats = pool.getStats()
      expect(stats.inUse).toBe(7)

      pool.releaseMany(objects.slice(0, 3))

      stats = pool.getStats()
      expect(stats.inUse).toBe(4)
    })

    test('resetStats clears statistics', () => {
      const factory = () => ({ id: 0, active: false, value: '' })
      const reset = (obj: TestObject) => {
        obj.active = false
      }
      const pool = new ObjectPool(factory, reset, 5)

      pool.acquire()
      pool.acquire()

      let stats = pool.getStats()
      expect(stats.totalAcquired).toBeGreaterThan(0)

      pool.resetStats()

      stats = pool.getStats()
      expect(stats.totalCreated).toBe(0)
      expect(stats.totalAcquired).toBe(0)
      expect(stats.totalReleased).toBe(0)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Convenience Function
  // ------------------------------------------------------------------ //
  describe('createObjectPool convenience function', () => {
    test('creates pool with default parameters', () => {
      const factory = () => ({ id: 0, active: false, value: '' })
      const reset = (obj: TestObject) => {
        obj.active = false
      }
      const pool = createObjectPool(factory, reset)

      expect(pool).toBeInstanceOf(ObjectPool)
      expect(pool.getAvailable()).toBe(0)
    })

    test('creates pool with custom parameters', () => {
      const factory = () => ({ id: 0, active: false, value: '' })
      const reset = (obj: TestObject) => {
        obj.active = false
      }
      const pool = createObjectPool(factory, reset, 20, 50)

      expect(pool).toBeInstanceOf(ObjectPool)
      expect(pool.getAvailable()).toBe(20)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Real-World Scenarios
  // ------------------------------------------------------------------ //
  describe('Real-world game scenarios', () => {
    test('particle pool scenario - heavy creation and destruction', () => {
      interface Particle {
        x: number
        y: number
        vx: number
        vy: number
        life: number
      }

      const factory = (): Particle => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 1,
      })

      const reset = (p: Particle) => {
        p.x = 0
        p.y = 0
        p.vx = 0
        p.vy = 0
        p.life = 1
      }

      const pool = createObjectPool(factory, reset, 100, 200)

      // Simulate explosion - acquire 50 particles
      const explosion: Particle[] = []
      for (let i = 0; i < 50; i++) {
        const p = pool.acquire()
        p.x = 100
        p.y = 100
        p.vx = Math.random() * 10 - 5
        p.vy = Math.random() * 10 - 5
        p.life = 0.5
        explosion.push(p)
      }

      expect(pool.getAvailable()).toBe(50)

      // Particles die - return to pool
      pool.releaseMany(explosion)
      expect(pool.getAvailable()).toBe(100)

      // All particles should be reset
      const reused = pool.acquire()
      expect(reused.x).toBe(0)
      expect(reused.y).toBe(0)
      expect(reused.life).toBe(1)
    })

    test('bullet pool scenario - frequent reuse', () => {
      interface Bullet {
        x: number
        y: number
        angle: number
        speed: number
        friendly: boolean
      }

      const factory = (): Bullet => ({
        x: 0,
        y: 0,
        angle: 0,
        speed: 0,
        friendly: true,
      })

      const reset = (b: Bullet) => {
        b.x = 0
        b.y = 0
        b.angle = 0
        b.speed = 0
        b.friendly = true
      }

      const pool = createObjectPool(factory, reset, 50)

      const stats = pool.getStats()
      const initialCreated = stats.totalCreated

      // Fire 100 bullets (reusing from pool)
      for (let i = 0; i < 100; i++) {
        const bullet = pool.acquire()
        bullet.x = Math.random() * 800
        bullet.y = Math.random() * 600
        bullet.speed = 500

        // Simulate bullet lifecycle
        pool.release(bullet)
      }

      const finalStats = pool.getStats()

      // Should have created far fewer objects than 100
      expect(finalStats.totalCreated).toBe(initialCreated)
      expect(finalStats.totalAcquired).toBe(100)
      expect(finalStats.totalReleased).toBe(100)
    })
  })
})
