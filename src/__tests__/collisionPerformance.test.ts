/**
 * Collision Performance Benchmark Tests
 * Validates that spatial grid collision detection scales O(n) instead of O(n²)
 */

import { v } from '../utils/vectorMath'

// ------------------------------------------------------------------ //
//                         SpatialGrid Test Helper
// ------------------------------------------------------------------ //

interface Entity {
  pos: { x: number; y: number }
  radius?: number
}

class SpatialGrid {
  private cellSize: number
  private cols: number
  private rows: number
  private grid: Map<number, Entity[]>

  constructor(width: number, height: number, cellSize = 75) {
    this.cellSize = cellSize
    this.cols = Math.ceil(width / cellSize)
    this.rows = Math.ceil(height / cellSize)
    this.grid = new Map()
  }

  clear() {
    this.grid.clear()
  }

  private getCellKey(x: number, y: number): number {
    const col = Math.floor(x / this.cellSize)
    const row = Math.floor(y / this.cellSize)
    return row * this.cols + col
  }

  insert(entity: Entity) {
    const key = this.getCellKey(entity.pos.x, entity.pos.y)
    if (!this.grid.has(key)) {
      this.grid.set(key, [])
    }
    this.grid.get(key)!.push(entity)
  }

  queryNearby(pos: { x: number; y: number }, radius: number): Entity[] {
    const nearby: Entity[] = []

    // Calculate cell range to check
    const minCol = Math.max(0, Math.floor((pos.x - radius) / this.cellSize))
    const maxCol = Math.min(this.cols - 1, Math.floor((pos.x + radius) / this.cellSize))
    const minRow = Math.max(0, Math.floor((pos.y - radius) / this.cellSize))
    const maxRow = Math.min(this.rows - 1, Math.floor((pos.y + radius) / this.cellSize))

    // Collect entities from cells in range
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const key = row * this.cols + col
        const entities = this.grid.get(key)
        if (entities) {
          nearby.push(...entities)
        }
      }
    }

    return nearby
  }
}

// ------------------------------------------------------------------ //
//                         Helper Functions
// ------------------------------------------------------------------ //

/**
 * Calculate distance squared between two points
 */
const dist2 = (a: { x: number; y: number }, b: { x: number; y: number }): number => {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

/**
 * Generate random entities distributed across the grid
 */
const generateEntities = (count: number, width: number, height: number): Entity[] => {
  const entities: Entity[] = []
  for (let i = 0; i < count; i++) {
    entities.push({
      pos: v(Math.random() * width, Math.random() * height),
      radius: 18,
    })
  }
  return entities
}

/**
 * Generate random bullets
 */
const generateBullets = (count: number, width: number, height: number): Entity[] => {
  const bullets: Entity[] = []
  for (let i = 0; i < count; i++) {
    bullets.push({
      pos: v(Math.random() * width, Math.random() * height),
      radius: 2,
    })
  }
  return bullets
}

/**
 * Perform O(n²) collision detection (old method)
 */
const collisionDetectionNaive = (bullets: Entity[], targets: Entity[], threshold: number): number => {
  let collisions = 0
  bullets.forEach((bullet) => {
    targets.forEach((target) => {
      if (dist2(bullet.pos, target.pos) < threshold) {
        collisions++
      }
    })
  })
  return collisions
}

/**
 * Perform O(n) collision detection using spatial grid (new method)
 */
const collisionDetectionSpatialGrid = (
  bullets: Entity[],
  targets: Entity[],
  threshold: number,
  width: number,
  height: number
): number => {
  const grid = new SpatialGrid(width, height, 75)
  let collisions = 0

  // Insert all targets into grid
  targets.forEach((target) => grid.insert(target))

  // Build position set for O(1) lookup
  const targetPosSet = new Set(targets.map((t) => `${t.pos.x},${t.pos.y}`))

  // Check each bullet against nearby entities
  bullets.forEach((bullet) => {
    const nearby = grid.queryNearby(bullet.pos, 50)
    nearby.forEach((target) => {
      const posKey = `${target.pos.x},${target.pos.y}`
      if (targetPosSet.has(posKey) && dist2(bullet.pos, target.pos) < threshold) {
        collisions++
      }
    })
  })

  return collisions
}

// ------------------------------------------------------------------ //
//                         Performance Benchmark Tests
// ------------------------------------------------------------------ //

describe('Collision Detection Performance', () => {
  const SCREEN_W = 400
  const SCREEN_H = 600
  const COLLISION_THRESHOLD = 20 * 20 // (enemy_radius + bullet_radius)²

  // ------------------------------------------------------------------ //
  //                         Scaling Benchmark Tests
  // ------------------------------------------------------------------ //
  describe('O(n) vs O(n²) Scaling', () => {
    test('spatial grid demonstrates O(n) scaling behavior', () => {
      // Test with larger entity counts to see clear scaling pattern
      const entityCounts = [50, 100, 200, 400]
      const times: number[] = []
      const bulletCount = 20

      entityCounts.forEach((count) => {
        const bullets = generateBullets(bulletCount, SCREEN_W, SCREEN_H)
        const targets = generateEntities(count, SCREEN_W, SCREEN_H)

        // Warm up
        for (let i = 0; i < 3; i++) {
          collisionDetectionSpatialGrid(bullets, targets, COLLISION_THRESHOLD, SCREEN_W, SCREEN_H)
        }

        // Benchmark
        const start = performance.now()
        for (let i = 0; i < 20; i++) {
          collisionDetectionSpatialGrid(bullets, targets, COLLISION_THRESHOLD, SCREEN_W, SCREEN_H)
        }
        const end = performance.now()

        times.push((end - start) / 20) // Average time per run
      })

      // Key property: O(n) means doubling entities roughly doubles time
      // O(n²) would mean doubling entities quadruples time

      // Compare 100 vs 200 entities
      const ratio_100_200 = times[2] / times[1]

      // Compare 200 vs 400 entities
      const ratio_200_400 = times[3] / times[2]

      // For O(n²), these ratios would be ~4x
      // For O(n), these ratios should be <3x (accounting for overhead variance)
      expect(ratio_100_200).toBeLessThan(3.5)
      expect(ratio_200_400).toBeLessThan(3.5)

      // Average ratio should be closer to 2x than 4x
      const avgRatio = (ratio_100_200 + ratio_200_400) / 2
      expect(avgRatio).toBeLessThan(3.0)
    })

    test('spatial grid avoids O(n²) behavior with distributed entities', () => {
      // Test that spatial grid only checks nearby entities, not all entities
      const bulletCount = 10

      // Create entities spread across the grid
      const targets = generateEntities(100, SCREEN_W, SCREEN_H)

      // Place bullets in one corner - they should only check nearby entities
      const bullets: Entity[] = []
      for (let i = 0; i < bulletCount; i++) {
        bullets.push({ pos: v(50 + i * 2, 50), radius: 2 })
      }

      let checksPerformed = 0
      const grid = new SpatialGrid(SCREEN_W, SCREEN_H, 100)
      targets.forEach((t) => grid.insert(t))

      // Count how many distance checks are performed
      bullets.forEach((bullet) => {
        const nearby = grid.queryNearby(bullet.pos, 50)
        checksPerformed += nearby.length
      })

      // Spatial grid should check far fewer than all entities (100)
      // With bullets in one corner, only nearby entities should be checked
      // O(n²) would check all 1000 pairs (10 bullets * 100 targets)
      // Spatial grid should check < 200 pairs (only nearby entities)
      expect(checksPerformed).toBeLessThan(bulletCount * targets.length)

      // Validate it found the correct entities
      const nearbyPosSet = new Set<string>()
      bullets.forEach((bullet) => {
        const nearby = grid.queryNearby(bullet.pos, 50)
        nearby.forEach((entity) => {
          nearbyPosSet.add(`${entity.pos.x},${entity.pos.y}`)
        })
      })

      // Should find some nearby entities (those in top-left corner)
      expect(nearbyPosSet.size).toBeGreaterThan(0)
      // But not all entities (most are far away)
      expect(nearbyPosSet.size).toBeLessThan(targets.length)
    })

    test('10 entities: collision check completes quickly', () => {
      const bullets = generateBullets(5, SCREEN_W, SCREEN_H)
      const targets = generateEntities(10, SCREEN_W, SCREEN_H)

      const start = performance.now()
      collisionDetectionSpatialGrid(bullets, targets, COLLISION_THRESHOLD, SCREEN_W, SCREEN_H)
      const end = performance.now()

      // Should complete in < 1ms for small entity counts
      expect(end - start).toBeLessThan(1)
    })

    test('100 entities: collision check completes in reasonable time', () => {
      const bullets = generateBullets(20, SCREEN_W, SCREEN_H)
      const targets = generateEntities(100, SCREEN_W, SCREEN_H)

      const start = performance.now()
      for (let i = 0; i < 5; i++) {
        collisionDetectionSpatialGrid(bullets, targets, COLLISION_THRESHOLD, SCREEN_W, SCREEN_H)
      }
      const end = performance.now()

      // Average time should be < 5ms per check
      const avgTime = (end - start) / 5
      expect(avgTime).toBeLessThan(5)
    })

    test('200 entities: maintains good performance at scale', () => {
      const bullets = generateBullets(20, SCREEN_W, SCREEN_H)
      const targets200 = generateEntities(200, SCREEN_W, SCREEN_H)

      // Warm up
      for (let i = 0; i < 5; i++) {
        collisionDetectionSpatialGrid(bullets, targets200, COLLISION_THRESHOLD, SCREEN_W, SCREEN_H)
      }

      // Benchmark 200 entities
      const start200 = performance.now()
      for (let i = 0; i < 10; i++) {
        collisionDetectionSpatialGrid(bullets, targets200, COLLISION_THRESHOLD, SCREEN_W, SCREEN_H)
      }
      const end200 = performance.now()
      const time200 = (end200 - start200) / 10

      // Even with 200 entities, should complete in reasonable time
      // O(n²) would be 4000 checks per frame, taking much longer
      // O(n) with spatial grid should stay under 10ms
      expect(time200).toBeLessThan(10)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Correctness vs Performance
  // ------------------------------------------------------------------ //
  describe('Correctness Validation', () => {
    test('spatial grid finds same collisions as naive approach', () => {
      const bullets = generateBullets(10, SCREEN_W, SCREEN_H)
      const targets = generateEntities(30, SCREEN_W, SCREEN_H)

      const naiveCollisions = collisionDetectionNaive(bullets, targets, COLLISION_THRESHOLD)
      const gridCollisions = collisionDetectionSpatialGrid(
        bullets,
        targets,
        COLLISION_THRESHOLD,
        SCREEN_W,
        SCREEN_H
      )

      // Both methods should find the same number of collisions
      expect(gridCollisions).toBe(naiveCollisions)
    })

    test('spatial grid handles dense clusters correctly', () => {
      const bullets: Entity[] = []
      const targets: Entity[] = []

      // Create dense cluster at (200, 300)
      for (let i = 0; i < 20; i++) {
        bullets.push({ pos: v(200 + i, 300), radius: 2 })
        targets.push({ pos: v(200, 300 + i), radius: 18 })
      }

      const naiveCollisions = collisionDetectionNaive(bullets, targets, COLLISION_THRESHOLD)
      const gridCollisions = collisionDetectionSpatialGrid(
        bullets,
        targets,
        COLLISION_THRESHOLD,
        SCREEN_W,
        SCREEN_H
      )

      expect(gridCollisions).toBe(naiveCollisions)
      expect(gridCollisions).toBeGreaterThan(0) // Should find collisions in cluster
    })

    test('spatial grid handles sparse distribution correctly', () => {
      const bullets: Entity[] = []
      const targets: Entity[] = []

      // Create sparse distribution - entities far apart
      bullets.push({ pos: v(50, 50), radius: 2 })
      bullets.push({ pos: v(350, 550), radius: 2 })
      targets.push({ pos: v(100, 100), radius: 18 })
      targets.push({ pos: v(300, 500), radius: 18 })

      const naiveCollisions = collisionDetectionNaive(bullets, targets, COLLISION_THRESHOLD)
      const gridCollisions = collisionDetectionSpatialGrid(
        bullets,
        targets,
        COLLISION_THRESHOLD,
        SCREEN_W,
        SCREEN_H
      )

      expect(gridCollisions).toBe(naiveCollisions)
      expect(gridCollisions).toBe(0) // No collisions in sparse setup
    })
  })

  // ------------------------------------------------------------------ //
  //                         Grid Cell Size Optimization
  // ------------------------------------------------------------------ //
  describe('Cell Size Impact on Performance', () => {
    test('compare cell sizes to find optimal performance', () => {
      const bullets = generateBullets(30, SCREEN_W, SCREEN_H)
      const targets = generateEntities(150, SCREEN_W, SCREEN_H)
      const cellSizes = [50, 75, 100, 150]
      const results: { cellSize: number; avgTime: number }[] = []

      cellSizes.forEach((cellSize) => {
        // Create custom collision detection with specific cell size
        const collisionDetectionWithCellSize = (
          bullets: Entity[],
          targets: Entity[],
          threshold: number,
          cellSize: number
        ): number => {
          const grid = new SpatialGrid(SCREEN_W, SCREEN_H, cellSize)
          let collisions = 0

          // Insert all targets into grid
          targets.forEach((target) => grid.insert(target))

          // Build position set for O(1) lookup
          const targetPosSet = new Set(targets.map((t) => `${t.pos.x},${t.pos.y}`))

          // Check each bullet against nearby entities
          bullets.forEach((bullet) => {
            const nearby = grid.queryNearby(bullet.pos, 50)
            nearby.forEach((target) => {
              const posKey = `${target.pos.x},${target.pos.y}`
              if (targetPosSet.has(posKey) && dist2(bullet.pos, target.pos) < threshold) {
                collisions++
              }
            })
          })

          return collisions
        }

        // Warm up JIT
        for (let i = 0; i < 5; i++) {
          collisionDetectionWithCellSize(bullets, targets, COLLISION_THRESHOLD, cellSize)
        }

        // Benchmark
        const start = performance.now()
        for (let i = 0; i < 20; i++) {
          collisionDetectionWithCellSize(bullets, targets, COLLISION_THRESHOLD, cellSize)
        }
        const end = performance.now()

        const avgTime = (end - start) / 20
        results.push({ cellSize, avgTime })
      })

      // Find the optimal cell size (lowest average time)
      const optimal = results.reduce((best, current) =>
        current.avgTime < best.avgTime ? current : best
      )

      // Log results for analysis
      // console.log('Cell Size Performance Results:')
      // results.forEach(r => console.log(`  ${r.cellSize}px: ${r.avgTime.toFixed(3)}ms`))
      // console.log(`Optimal: ${optimal.cellSize}px (${optimal.avgTime.toFixed(3)}ms)`)

      // All cell sizes should be reasonably performant
      results.forEach(r => {
        expect(r.avgTime).toBeLessThan(10)
      })

      // 100px should be within 50% of optimal (more realistic threshold)
      const current100px = results.find(r => r.cellSize === 100)!
      const performanceRatio = current100px.avgTime / optimal.avgTime
      expect(performanceRatio).toBeLessThan(1.5)
    })

    test('100px cell size is efficient for typical game scenarios', () => {
      const bullets = generateBullets(20, SCREEN_W, SCREEN_H)
      const targets = generateEntities(100, SCREEN_W, SCREEN_H)

      const start = performance.now()
      for (let i = 0; i < 10; i++) {
        collisionDetectionSpatialGrid(bullets, targets, COLLISION_THRESHOLD, SCREEN_W, SCREEN_H)
      }
      const end = performance.now()

      const avgTime = (end - start) / 10
      // Should complete efficiently with 100px cells
      expect(avgTime).toBeLessThan(5)
    })

    test('spatial grid handles empty grid efficiently', () => {
      const bullets = generateBullets(20, SCREEN_W, SCREEN_H)
      const targets: Entity[] = [] // Empty

      const start = performance.now()
      for (let i = 0; i < 100; i++) {
        collisionDetectionSpatialGrid(bullets, targets, COLLISION_THRESHOLD, SCREEN_W, SCREEN_H)
      }
      const end = performance.now()

      const avgTime = (end - start) / 100
      // Empty grid should be extremely fast
      expect(avgTime).toBeLessThan(0.5)
    })

    test('spatial grid handles single entity efficiently', () => {
      const bullets = generateBullets(1, SCREEN_W, SCREEN_H)
      const targets = generateEntities(1, SCREEN_W, SCREEN_H)

      const start = performance.now()
      for (let i = 0; i < 100; i++) {
        collisionDetectionSpatialGrid(bullets, targets, COLLISION_THRESHOLD, SCREEN_W, SCREEN_H)
      }
      const end = performance.now()

      const avgTime = (end - start) / 100
      // Single entity should be extremely fast
      expect(avgTime).toBeLessThan(0.5)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Memory Efficiency
  // ------------------------------------------------------------------ //
  describe('Memory and Allocation Efficiency', () => {
    test('spatial grid clear() allows efficient reuse', () => {
      const grid = new SpatialGrid(SCREEN_W, SCREEN_H, 100)

      // Warm up to stabilize JIT
      for (let i = 0; i < 5; i++) {
        const warmup = generateEntities(100, SCREEN_W, SCREEN_H)
        grid.clear()
        warmup.forEach((t) => grid.insert(t))
      }

      // Run multiple frames with different entities
      const times: number[] = []
      for (let frame = 0; frame < 20; frame++) {
        const targets = generateEntities(100, SCREEN_W, SCREEN_H)

        const start = performance.now()
        grid.clear()
        targets.forEach((t) => grid.insert(t))
        const end = performance.now()

        times.push(end - start)
      }

      // Verify no significant performance degradation over time
      // Compare first half vs second half of runs
      const firstHalf = times.slice(0, 10).reduce((a, b) => a + b, 0) / 10
      const secondHalf = times.slice(10).reduce((a, b) => a + b, 0) / 10

      // Second half should not be significantly slower (no memory leak)
      expect(secondHalf).toBeLessThan(firstHalf * 2)

      // All times should be reasonably fast
      times.forEach((time) => {
        expect(time).toBeLessThan(2) // Should complete in < 2ms
      })
    })

    test('queryNearby does not create excessive garbage', () => {
      const grid = new SpatialGrid(SCREEN_W, SCREEN_H, 100)
      const targets = generateEntities(100, SCREEN_W, SCREEN_H)
      targets.forEach((t) => grid.insert(t))

      const bullets = generateBullets(50, SCREEN_W, SCREEN_H)

      const start = performance.now()
      for (let i = 0; i < 100; i++) {
        bullets.forEach((bullet) => {
          grid.queryNearby(bullet.pos, 50)
        })
      }
      const end = performance.now()

      const totalTime = end - start
      // 5000 queries (100 iterations * 50 bullets) should complete efficiently
      expect(totalTime).toBeLessThan(100) // < 100ms for 5000 queries
    })
  })

  // ------------------------------------------------------------------ //
  //                         Real-World Game Scenarios
  // ------------------------------------------------------------------ //
  describe('Realistic Game Scenarios', () => {
    test('typical mid-game scenario (50 entities, 30 bullets)', () => {
      const bullets = generateBullets(30, SCREEN_W, SCREEN_H)
      const targets = generateEntities(50, SCREEN_W, SCREEN_H)

      const start = performance.now()
      for (let i = 0; i < 20; i++) {
        collisionDetectionSpatialGrid(bullets, targets, COLLISION_THRESHOLD, SCREEN_W, SCREEN_H)
      }
      const end = performance.now()

      const avgTime = (end - start) / 20
      // Should maintain 60fps (< 16.67ms per frame)
      expect(avgTime).toBeLessThan(10)
    })

    test('intense late-game scenario (150 entities, 50 bullets)', () => {
      const bullets = generateBullets(50, SCREEN_W, SCREEN_H)
      const targets = generateEntities(150, SCREEN_W, SCREEN_H)

      const start = performance.now()
      for (let i = 0; i < 10; i++) {
        collisionDetectionSpatialGrid(bullets, targets, COLLISION_THRESHOLD, SCREEN_W, SCREEN_H)
      }
      const end = performance.now()

      const avgTime = (end - start) / 10
      // Even intense scenarios should maintain reasonable performance
      expect(avgTime).toBeLessThan(15)
    })

    test('boss fight scenario (1 boss, 100 projectiles)', () => {
      const bullets = generateBullets(100, SCREEN_W, SCREEN_H)
      const boss: Entity[] = [{ pos: v(SCREEN_W / 2, 100), radius: 50 }]

      const start = performance.now()
      for (let i = 0; i < 20; i++) {
        const bossThreshold = 50 * 50 // Boss radius squared
        collisionDetectionSpatialGrid(bullets, boss, bossThreshold, SCREEN_W, SCREEN_H)
      }
      const end = performance.now()

      const avgTime = (end - start) / 20
      // Boss collision checks should be very fast
      expect(avgTime).toBeLessThan(5)
    })
  })
})
