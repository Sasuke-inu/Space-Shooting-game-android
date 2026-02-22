/**
 * Vec2 object pool for reducing garbage collection pressure.
 * Provides pooled Vec2 instances to eliminate allocations in hot paths.
 */

import type { Vec2 } from "../types/game"
import { ObjectPool } from "./objectPool"

/**
 * Factory function to create new Vec2 instances
 */
const createVec2 = (): Vec2 => ({ x: 0, y: 0 })

/**
 * Reset function to clear Vec2 state before reuse
 */
const resetVec2 = (v: Vec2): void => {
  v.x = 0
  v.y = 0
}

/**
 * Global Vec2 object pool
 * Pre-allocates 100 Vec2s, no max size limit
 */
const vec2Pool = new ObjectPool<Vec2>(
  createVec2,
  resetVec2,
  100, // initialSize - pre-allocate 100 Vec2s for common operations
  0 // maxSize - unlimited pool growth
)

/**
 * Acquire a Vec2 from the pool
 * The Vec2 will be reset to (0, 0)
 *
 * @returns A pooled Vec2 instance
 *
 * @example
 * const temp = acquire()
 * temp.x = 5
 * temp.y = 10
 * // ... use temp ...
 * release(temp)
 */
export function acquire(): Vec2 {
  return vec2Pool.acquire()
}

/**
 * Acquire a Vec2 from the pool with initial values
 *
 * @param x - Initial x value
 * @param y - Initial y value
 * @returns A pooled Vec2 instance with the specified values
 *
 * @example
 * const temp = acquireWith(5, 10)
 * // ... use temp ...
 * release(temp)
 */
export function acquireWith(x: number, y: number): Vec2 {
  const v = vec2Pool.acquire()
  v.x = x
  v.y = y
  return v
}

/**
 * Release a Vec2 back to the pool
 * The Vec2 will be reset to (0, 0) and made available for reuse
 *
 * @param v - The Vec2 to release
 *
 * @example
 * const temp = acquire()
 * // ... use temp ...
 * release(temp)
 */
export function release(v: Vec2): void {
  vec2Pool.release(v)
}

/**
 * Release multiple Vec2s back to the pool at once
 *
 * @param vectors - Array of Vec2s to release
 *
 * @example
 * const temps = [acquire(), acquire(), acquire()]
 * // ... use temps ...
 * releaseMany(temps)
 */
export function releaseMany(vectors: Vec2[]): void {
  vec2Pool.releaseMany(vectors)
}

/**
 * Get Vec2 pool statistics
 * Useful for debugging and monitoring pool performance
 *
 * @returns Object containing pool size, available count, in-use count, and lifetime stats
 */
export function getStats() {
  return vec2Pool.getStats()
}

/**
 * Clear all Vec2s from the pool
 * Use with caution - typically only needed for testing
 */
export function clear(): void {
  vec2Pool.clear()
}

/**
 * Reset pool statistics
 * Useful for performance measurement
 */
export function resetStats(): void {
  vec2Pool.resetStats()
}
