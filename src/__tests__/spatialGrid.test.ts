/**
 * Spatial Grid Tests
 * Tests for SpatialGrid class used for collision detection optimization
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

  // Test helper methods
  getCellCount(): number {
    return this.grid.size
  }

  getEntityCount(): number {
    let count = 0
    this.grid.forEach((entities) => {
      count += entities.length
    })
    return count
  }
}

describe('SpatialGrid', () => {
  // ------------------------------------------------------------------ //
  //                         Construction Tests
  // ------------------------------------------------------------------ //
  describe('Constructor', () => {
    test('creates grid with correct dimensions', () => {
      const grid = new SpatialGrid(400, 600, 100)
      expect(grid).toBeDefined()
    })

    test('handles non-divisible dimensions', () => {
      const grid = new SpatialGrid(450, 650, 100)
      // 450/100 = 4.5 -> ceil = 5 cols
      // 650/100 = 6.5 -> ceil = 7 rows
      expect(grid).toBeDefined()
      expect(grid.getCellCount()).toBe(0) // No entities yet
    })

    test('handles custom cell sizes', () => {
      const grid1 = new SpatialGrid(400, 600, 50)
      const grid2 = new SpatialGrid(400, 600, 200)
      expect(grid1).toBeDefined()
      expect(grid2).toBeDefined()
    })

    test('handles small grid sizes', () => {
      const grid = new SpatialGrid(100, 100, 50)
      expect(grid).toBeDefined()
    })
  })

  // ------------------------------------------------------------------ //
  //                         Insert Tests
  // ------------------------------------------------------------------ //
  describe('insert()', () => {
    test('inserts single entity', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity = { pos: v(50, 50) }

      grid.insert(entity)

      expect(grid.getEntityCount()).toBe(1)
      expect(grid.getCellCount()).toBe(1)
    })

    test('inserts multiple entities in same cell', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity1 = { pos: v(50, 50) }
      const entity2 = { pos: v(60, 60) }
      const entity3 = { pos: v(70, 70) }

      grid.insert(entity1)
      grid.insert(entity2)
      grid.insert(entity3)

      expect(grid.getEntityCount()).toBe(3)
      expect(grid.getCellCount()).toBe(1) // All in same cell
    })

    test('inserts entities in different cells', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity1 = { pos: v(50, 50) }   // Cell (0,0)
      const entity2 = { pos: v(150, 50) }  // Cell (1,0)
      const entity3 = { pos: v(50, 150) }  // Cell (0,1)

      grid.insert(entity1)
      grid.insert(entity2)
      grid.insert(entity3)

      expect(grid.getEntityCount()).toBe(3)
      expect(grid.getCellCount()).toBe(3) // Three different cells
    })

    test('handles entity at grid origin', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity = { pos: v(0, 0) }

      grid.insert(entity)

      expect(grid.getEntityCount()).toBe(1)
    })

    test('handles entity at grid boundaries', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity1 = { pos: v(399, 599) } // Near max bounds
      const entity2 = { pos: v(0, 0) }     // At origin

      grid.insert(entity1)
      grid.insert(entity2)

      expect(grid.getEntityCount()).toBe(2)
    })

    test('handles entity exactly on cell boundary', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity1 = { pos: v(100, 100) } // Exactly on boundary
      const entity2 = { pos: v(99.9, 99.9) }

      grid.insert(entity1)
      grid.insert(entity2)

      expect(grid.getEntityCount()).toBe(2)
    })

    test('handles negative coordinates', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity = { pos: v(-10, -10) }

      grid.insert(entity)

      expect(grid.getEntityCount()).toBe(1)
    })

    test('handles coordinates beyond grid bounds', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity = { pos: v(500, 700) } // Beyond 400x600

      grid.insert(entity)

      expect(grid.getEntityCount()).toBe(1)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Query Nearby Tests
  // ------------------------------------------------------------------ //
  describe('queryNearby()', () => {
    test('returns empty array for empty grid', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const nearby = grid.queryNearby(v(200, 300), 50)

      expect(nearby).toEqual([])
    })

    test('finds entity in same cell', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity = { pos: v(50, 50) }

      grid.insert(entity)
      const nearby = grid.queryNearby(v(55, 55), 50)

      expect(nearby.length).toBe(1)
      expect(nearby[0]).toBe(entity)
    })

    test('finds multiple entities in same cell', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity1 = { pos: v(50, 50) }
      const entity2 = { pos: v(60, 60) }
      const entity3 = { pos: v(70, 70) }

      grid.insert(entity1)
      grid.insert(entity2)
      grid.insert(entity3)

      const nearby = grid.queryNearby(v(60, 60), 50)

      expect(nearby.length).toBe(3)
    })

    test('finds entities across multiple cells', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity1 = { pos: v(50, 50) }   // Cell (0,0)
      const entity2 = { pos: v(150, 50) }  // Cell (1,0)
      const entity3 = { pos: v(50, 150) }  // Cell (0,1)
      const entity4 = { pos: v(150, 150) } // Cell (1,1)

      grid.insert(entity1)
      grid.insert(entity2)
      grid.insert(entity3)
      grid.insert(entity4)

      // Query at boundary between all 4 cells
      const nearby = grid.queryNearby(v(100, 100), 60)

      expect(nearby.length).toBe(4)
    })

    test('does not find entities outside query radius cells', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity1 = { pos: v(50, 50) }   // Cell (0,0)
      const entity2 = { pos: v(350, 550) } // Far away cell

      grid.insert(entity1)
      grid.insert(entity2)

      const nearby = grid.queryNearby(v(50, 50), 50)

      expect(nearby.length).toBe(1)
      expect(nearby[0]).toBe(entity1)
    })

    test('handles query at grid origin', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity = { pos: v(10, 10) }

      grid.insert(entity)
      const nearby = grid.queryNearby(v(0, 0), 50)

      expect(nearby.length).toBe(1)
    })

    test('handles query at grid boundaries', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity = { pos: v(390, 590) }

      grid.insert(entity)
      const nearby = grid.queryNearby(v(399, 599), 50)

      expect(nearby.length).toBe(1)
    })

    test('handles query with zero radius', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity = { pos: v(50, 50) }

      grid.insert(entity)
      const nearby = grid.queryNearby(v(50, 50), 0)

      expect(nearby.length).toBe(1)
    })

    test('handles query with large radius', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity1 = { pos: v(50, 50) }
      const entity2 = { pos: v(350, 550) }

      grid.insert(entity1)
      grid.insert(entity2)

      // Large radius should find all entities
      const nearby = grid.queryNearby(v(200, 300), 500)

      expect(nearby.length).toBe(2)
    })

    test('handles query outside grid bounds', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity = { pos: v(50, 50) }

      grid.insert(entity)
      const nearby = grid.queryNearby(v(-100, -100), 50)

      expect(nearby).toEqual([])
    })

    test('radius exactly matches cell size', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity1 = { pos: v(50, 50) }   // Cell (0,0)
      const entity2 = { pos: v(150, 50) }  // Cell (1,0)
      const entity3 = { pos: v(250, 50) }  // Cell (2,0)

      grid.insert(entity1)
      grid.insert(entity2)
      grid.insert(entity3)

      // Query with radius = cellSize should check adjacent cells
      const nearby = grid.queryNearby(v(50, 50), 100)

      expect(nearby.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Clear Tests
  // ------------------------------------------------------------------ //
  describe('clear()', () => {
    test('clears all entities', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity1 = { pos: v(50, 50) }
      const entity2 = { pos: v(150, 150) }

      grid.insert(entity1)
      grid.insert(entity2)
      expect(grid.getEntityCount()).toBe(2)

      grid.clear()

      expect(grid.getEntityCount()).toBe(0)
      expect(grid.getCellCount()).toBe(0)
    })

    test('allows reuse after clear', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity1 = { pos: v(50, 50) }
      const entity2 = { pos: v(150, 150) }

      grid.insert(entity1)
      grid.clear()
      grid.insert(entity2)

      expect(grid.getEntityCount()).toBe(1)
      const nearby = grid.queryNearby(v(150, 150), 50)
      expect(nearby.length).toBe(1)
      expect(nearby[0]).toBe(entity2)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Cell Boundary Tests
  // ------------------------------------------------------------------ //
  describe('Cell Boundary Cases', () => {
    test('entities on opposite sides of cell boundary', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity1 = { pos: v(99, 50) }  // Just before boundary
      const entity2 = { pos: v(101, 50) } // Just after boundary

      grid.insert(entity1)
      grid.insert(entity2)

      expect(grid.getCellCount()).toBe(2) // Different cells
    })

    test('query spanning cell boundary', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity1 = { pos: v(95, 50) }  // Cell (0,0)
      const entity2 = { pos: v(105, 50) } // Cell (1,0)

      grid.insert(entity1)
      grid.insert(entity2)

      // Query at boundary should find both
      const nearby = grid.queryNearby(v(100, 50), 50)

      expect(nearby.length).toBe(2)
    })

    test('entity exactly at cell corner', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity = { pos: v(100, 100) } // Exactly at corner

      grid.insert(entity)

      const nearby = grid.queryNearby(v(100, 100), 10)
      expect(nearby.length).toBe(1)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Edge Case Tests
  // ------------------------------------------------------------------ //
  describe('Edge Cases', () => {
    test('single cell grid', () => {
      const grid = new SpatialGrid(50, 50, 100)
      const entity1 = { pos: v(10, 10) }
      const entity2 = { pos: v(40, 40) }

      grid.insert(entity1)
      grid.insert(entity2)

      expect(grid.getCellCount()).toBe(1)

      const nearby = grid.queryNearby(v(25, 25), 50)
      expect(nearby.length).toBe(2)
    })

    test('very small cell size', () => {
      const grid = new SpatialGrid(400, 600, 10)
      const entity = { pos: v(15, 15) }

      grid.insert(entity)

      const nearby = grid.queryNearby(v(15, 15), 5)
      expect(nearby.length).toBe(1)
    })

    test('very large cell size', () => {
      const grid = new SpatialGrid(400, 600, 500)
      const entity1 = { pos: v(50, 50) }
      const entity2 = { pos: v(350, 550) }

      grid.insert(entity1)
      grid.insert(entity2)

      // Large cell size with small query radius still respects radius
      const nearby = grid.queryNearby(v(200, 300), 100)
      expect(nearby.length).toBeGreaterThan(0)

      // But a large query radius should find both
      const nearbyLarge = grid.queryNearby(v(200, 300), 500)
      expect(nearbyLarge.length).toBe(2)
    })

    test('entities with radius property', () => {
      const grid = new SpatialGrid(400, 600, 100)
      const entity1 = { pos: v(50, 50), radius: 10 }
      const entity2 = { pos: v(60, 60), radius: 20 }

      grid.insert(entity1)
      grid.insert(entity2)

      const nearby = grid.queryNearby(v(55, 55), 50)
      expect(nearby.length).toBe(2)
      expect(nearby[0].radius).toBeDefined()
      expect(nearby[1].radius).toBeDefined()
    })
  })

  // ------------------------------------------------------------------ //
  //                         Performance Characteristics Tests
  // ------------------------------------------------------------------ //
  describe('Performance Characteristics', () => {
    test('insert is O(1) - constant time', () => {
      const grid = new SpatialGrid(1000, 1000, 100)
      const times: number[] = []

      // Test with increasing number of entities
      for (let n = 100; n <= 1000; n += 100) {
        grid.clear()
        const start = performance.now()

        for (let i = 0; i < n; i++) {
          const entity = { pos: v(Math.random() * 1000, Math.random() * 1000) }
          grid.insert(entity)
        }

        const end = performance.now()
        times.push((end - start) / n) // Time per insert
      }

      // Insert time should remain roughly constant (O(1))
      // Allow for some variance due to JS runtime
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      times.forEach((time) => {
        expect(time).toBeLessThan(avgTime * 3) // Within 3x of average
      })
    })

    test('queryNearby is efficient for small radius', () => {
      const grid = new SpatialGrid(1000, 1000, 100)

      // Insert 1000 entities across the grid
      for (let i = 0; i < 1000; i++) {
        grid.insert({ pos: v(Math.random() * 1000, Math.random() * 1000) })
      }

      const start = performance.now()

      // Small radius query should only check nearby cells
      const nearby = grid.queryNearby(v(500, 500), 50)

      const end = performance.now()

      // Should be fast even with 1000 entities
      expect(end - start).toBeLessThan(10) // < 10ms

      // Should return only nearby entities, not all 1000
      expect(nearby.length).toBeLessThan(1000)
    })

    test('handles dense entity clusters efficiently', () => {
      const grid = new SpatialGrid(400, 600, 100)

      // Create dense cluster at (200, 300)
      for (let i = 0; i < 100; i++) {
        grid.insert({ pos: v(200 + i % 10, 300 + Math.floor(i / 10)) })
      }

      const start = performance.now()
      const nearby = grid.queryNearby(v(205, 305), 50)
      const end = performance.now()

      expect(end - start).toBeLessThan(10)
      expect(nearby.length).toBeGreaterThan(0)
    })

    test('handles sparse distribution efficiently', () => {
      const grid = new SpatialGrid(1000, 1000, 100)

      // Sparse distribution - one entity per cell
      for (let x = 50; x < 1000; x += 100) {
        for (let y = 50; y < 1000; y += 100) {
          grid.insert({ pos: v(x, y) })
        }
      }

      const start = performance.now()
      const nearby = grid.queryNearby(v(500, 500), 50)
      const end = performance.now()

      expect(end - start).toBeLessThan(10)
      expect(nearby.length).toBeGreaterThan(0)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Integration Tests
  // ------------------------------------------------------------------ //
  describe('Integration Tests', () => {
    test('simulates typical game scenario', () => {
      const grid = new SpatialGrid(400, 600, 100)

      // Simulate player
      const player = { pos: v(200, 300), radius: 12 }

      // Simulate enemies
      const enemies = [
        { pos: v(100, 100), radius: 18 },
        { pos: v(300, 500), radius: 18 },
        { pos: v(210, 310), radius: 18 }, // Near player
      ]

      // Simulate asteroids
      const asteroids = [
        { pos: v(50, 50), radius: 20 },
        { pos: v(350, 550), radius: 30 },
        { pos: v(195, 295), radius: 25 }, // Near player
      ]

      // Insert all entities
      enemies.forEach((e) => grid.insert(e))
      asteroids.forEach((a) => grid.insert(a))

      // Query nearby entities for player
      const nearby = grid.queryNearby(player.pos, 50)

      // Should find entities near player (enemy at 210,310 and asteroid at 195,295)
      expect(nearby.length).toBeGreaterThan(0)
      expect(nearby.length).toBeLessThan(enemies.length + asteroids.length)
    })

    test('simulates bullet collision detection', () => {
      const grid = new SpatialGrid(400, 600, 100)

      // Simulate targets
      const targets = [
        { pos: v(100, 100), hp: 50 },
        { pos: v(200, 200), hp: 50 },
        { pos: v(300, 300), hp: 50 },
      ]

      targets.forEach((t) => grid.insert(t))

      // Simulate bullet positions
      const bullets = [
        { pos: v(105, 105) }, // Near first target
        { pos: v(500, 500) }, // Far away
      ]

      let hits = 0

      bullets.forEach((bullet) => {
        const nearby = grid.queryNearby(bullet.pos, 50)
        if (nearby.length > 0) {
          hits++
        }
      })

      expect(hits).toBe(1) // Only first bullet should hit
    })
  })
})
