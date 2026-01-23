/**
 * Generic object pool for reducing garbage collection pressure.
 * Useful for frequently created/destroyed objects like bullets, particles, and enemies.
 */

export type PoolFactory<T> = () => T
export type PoolReset<T> = (obj: T) => void

export interface ObjectPoolStats {
  size: number
  available: number
  inUse: number
  totalCreated: number
  totalAcquired: number
  totalReleased: number
}

/**
 * Generic object pool implementation
 */
export class ObjectPool<T> {
  private pool: T[] = []
  private factory: PoolFactory<T>
  private reset: PoolReset<T>
  private maxSize: number
  private stats = {
    totalCreated: 0,
    totalAcquired: 0,
    totalReleased: 0,
  }

  /**
   * Create a new object pool
   * @param factory Function to create new objects when pool is empty
   * @param reset Function to reset object state before reuse
   * @param initialSize Initial number of objects to pre-allocate
   * @param maxSize Maximum pool size (0 = unlimited)
   */
  constructor(
    factory: PoolFactory<T>,
    reset: PoolReset<T>,
    initialSize = 0,
    maxSize = 0
  ) {
    this.factory = factory
    this.reset = reset
    this.maxSize = maxSize

    // Pre-allocate initial objects
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory())
      this.stats.totalCreated++
    }
  }

  /**
   * Acquire an object from the pool
   * Creates a new object if pool is empty
   */
  acquire(): T {
    this.stats.totalAcquired++

    let obj: T
    if (this.pool.length > 0) {
      obj = this.pool.pop()!
    } else {
      obj = this.factory()
      this.stats.totalCreated++
    }

    return obj
  }

  /**
   * Release an object back to the pool
   * Resets the object state before returning it to the pool
   */
  release(obj: T): void {
    this.stats.totalReleased++

    // Reset object state
    this.reset(obj)

    // Only add back to pool if under max size (or unlimited)
    if (this.maxSize === 0 || this.pool.length < this.maxSize) {
      this.pool.push(obj)
    }
  }

  /**
   * Release multiple objects at once
   */
  releaseMany(objects: T[]): void {
    for (const obj of objects) {
      this.release(obj)
    }
  }

  /**
   * Clear the pool
   */
  clear(): void {
    this.pool = []
  }

  /**
   * Get the number of available objects in the pool
   */
  getAvailable(): number {
    return this.pool.length
  }

  /**
   * Get pool statistics
   */
  getStats(): ObjectPoolStats {
    return {
      size: this.pool.length,
      available: this.pool.length,
      inUse: this.stats.totalAcquired - this.stats.totalReleased,
      totalCreated: this.stats.totalCreated,
      totalAcquired: this.stats.totalAcquired,
      totalReleased: this.stats.totalReleased,
    }
  }

  /**
   * Reset pool statistics
   */
  resetStats(): void {
    this.stats = {
      totalCreated: 0,
      totalAcquired: 0,
      totalReleased: 0,
    }
  }
}

/**
 * Create a new object pool
 * Convenience function for creating object pools
 */
export function createObjectPool<T>(
  factory: PoolFactory<T>,
  reset: PoolReset<T>,
  initialSize = 0,
  maxSize = 0
): ObjectPool<T> {
  return new ObjectPool(factory, reset, initialSize, maxSize)
}
