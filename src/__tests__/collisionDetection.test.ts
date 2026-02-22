/**
 * Collision Detection Tests
 * Tests for bullet-enemy, bullet-asteroid, and player collision logic
 */

import { dist2, v, add, fromAngle } from '../utils/vectorMath'

describe('Collision Detection Logic', () => {
  // ------------------------------------------------------------------ //
  //                         Distance Squared Tests
  // ------------------------------------------------------------------ //
  describe('dist2 (distance squared)', () => {
    test('same point returns 0', () => {
      expect(dist2(v(0, 0), v(0, 0))).toBe(0)
      expect(dist2(v(100, 200), v(100, 200))).toBe(0)
    })

    test('horizontal distance', () => {
      expect(dist2(v(0, 0), v(10, 0))).toBe(100)
      expect(dist2(v(5, 0), v(15, 0))).toBe(100)
    })

    test('vertical distance', () => {
      expect(dist2(v(0, 0), v(0, 10))).toBe(100)
    })

    test('diagonal distance', () => {
      // 3-4-5 triangle: distance squared = 25
      expect(dist2(v(0, 0), v(3, 4))).toBe(25)
    })

    test('negative coordinates', () => {
      expect(dist2(v(-5, -5), v(5, 5))).toBe(200) // 10^2 + 10^2
    })
  })

  // ------------------------------------------------------------------ //
  //                         Collision Radius Tests
  // ------------------------------------------------------------------ //
  describe('Collision Radius Calculations', () => {
    const BULLET_RADIUS = 2
    const PLAYER_RADIUS = 12
    const ENEMY_RADIUS = 18
    const BOSS_RADIUS = 50
    const POWERUP_RADIUS = 30

    test('bullet-enemy collision threshold', () => {
      const threshold = (ENEMY_RADIUS + BULLET_RADIUS) ** 2
      expect(threshold).toBe(400) // 20^2

      // Just inside collision
      const pos1 = v(0, 0)
      const pos2 = v(19, 0)
      expect(dist2(pos1, pos2)).toBeLessThan(threshold)

      // Just outside collision
      const pos3 = v(21, 0)
      expect(dist2(pos1, pos3)).toBeGreaterThan(threshold)
    })

    test('bullet-boss collision threshold', () => {
      const threshold = BOSS_RADIUS ** 2
      expect(threshold).toBe(2500) // 50^2
    })

    test('player-enemy collision threshold', () => {
      const threshold = 22 ** 2 // Used in game engine
      expect(threshold).toBe(484)
    })

    test('player-boss collision threshold', () => {
      const threshold = 60 ** 2 // Used in game engine
      expect(threshold).toBe(3600)
    })

    test('player-powerup collection threshold', () => {
      const threshold = POWERUP_RADIUS ** 2
      expect(threshold).toBe(900)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Multi-Hit Detection Tests
  // ------------------------------------------------------------------ //
  describe('Multi-Hit Detection', () => {
    interface MockBullet {
      pos: { x: number; y: number }
      friendly: boolean
      removed: boolean
    }

    interface MockEnemy {
      pos: { x: number; y: number }
      hp: number
      removed: boolean
    }

    test('bullet should only hit one enemy per frame', () => {
      const bullet: MockBullet = { pos: v(100, 100), friendly: true, removed: false }
      const enemies: MockEnemy[] = [
        { pos: v(100, 100), hp: 50, removed: false }, // Same position
        { pos: v(105, 100), hp: 50, removed: false }, // 5 units away
      ]

      const COLLISION_THRESHOLD = 18 * 18
      const enemiesHit: number[] = []

      // Simulate collision detection
      enemies.forEach((e, idx) => {
        if (!bullet.removed && dist2(bullet.pos, e.pos) < COLLISION_THRESHOLD) {
          enemiesHit.push(idx)
          bullet.removed = true // Bullet should be consumed
        }
      })

      // Bullet should only hit ONE enemy
      expect(enemiesHit.length).toBe(1)
      expect(bullet.removed).toBe(true)
    })

    test('multiple bullets can hit same enemy in same frame', () => {
      const bullets: MockBullet[] = [
        { pos: v(100, 100), friendly: true, removed: false },
        { pos: v(102, 100), friendly: true, removed: false },
      ]
      const enemy: MockEnemy = { pos: v(100, 100), hp: 50, removed: false }

      const COLLISION_THRESHOLD = 18 * 18
      let totalDamage = 0

      bullets.forEach((b) => {
        if (!b.removed && !enemy.removed && dist2(b.pos, enemy.pos) < COLLISION_THRESHOLD) {
          totalDamage += 25
          b.removed = true
          if (enemy.hp - totalDamage <= 0) {
            enemy.removed = true
          }
        }
      })

      // Both bullets should hit before enemy is marked removed
      expect(totalDamage).toBe(50)
    })

    test('deferred removal prevents index desync', () => {
      const enemies: MockEnemy[] = [
        { pos: v(100, 100), hp: 10, removed: false },
        { pos: v(200, 200), hp: 50, removed: false },
        { pos: v(300, 300), hp: 30, removed: false },
      ]

      const bulletsToRemove = new Set<number>()
      const enemiesToRemove = new Set<number>()
      const enemyDamage = new Map<number, number>()

      // Simulate damage collection
      enemyDamage.set(0, 25) // Kill first enemy
      enemyDamage.set(2, 25) // Damage third enemy

      // Apply damage and determine removals
      enemies.forEach((e, idx) => {
        const dmg = enemyDamage.get(idx) || 0
        if (e.hp - dmg <= 0) {
          enemiesToRemove.add(idx)
        }
      })

      expect(enemiesToRemove.has(0)).toBe(true)
      expect(enemiesToRemove.has(2)).toBe(false) // 30 - 25 = 5 > 0

      // Filter enemies
      const remaining = enemies.filter((_, idx) => !enemiesToRemove.has(idx))
      expect(remaining.length).toBe(2)
      expect(remaining[0].pos.x).toBe(200)
      expect(remaining[1].pos.x).toBe(300)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Wrap-Around Collision Tests
  // ------------------------------------------------------------------ //
  describe('Screen Wrap Collision Edge Cases', () => {
    const SCREEN_W = 400
    const SCREEN_H = 600

    const wrap = (pos: { x: number; y: number }, w: number, h: number) => ({
      x: ((pos.x % w) + w) % w,
      y: ((pos.y % h) + h) % h,
    })

    test('entity near edge wraps correctly', () => {
      const pos = v(-5, -5)
      const wrapped = wrap(pos, SCREEN_W, SCREEN_H)
      expect(wrapped.x).toBe(395)
      expect(wrapped.y).toBe(595)
    })

    test('collision near screen edge should consider wrapping', () => {
      // Player at x=5, enemy at x=395 (visually close due to wrap)
      const player = v(5, 300)
      const enemy = v(395, 300)

      // Direct distance (ignoring wrap)
      const directDist = dist2(player, enemy)
      expect(directDist).toBe(390 * 390) // 152100 - far away

      // With wrap consideration, they're actually 10 units apart
      const wrapDist = Math.min(
        Math.abs(player.x - enemy.x),
        SCREEN_W - Math.abs(player.x - enemy.x)
      )
      expect(wrapDist).toBe(10)
    })
  })
})

describe('Bullet Behavior Tests', () => {
  // ------------------------------------------------------------------ //
  //                         Bullet Lifetime Tests
  // ------------------------------------------------------------------ //
  describe('Bullet Lifetime', () => {
    const BULLET_LIFE_PLAYER = 0.8
    const BULLET_LIFE_ENEMY = 1.0

    test('player bullet expires after lifetime', () => {
      let life = BULLET_LIFE_PLAYER
      const dt = 0.033 // ~30fps

      let frames = 0
      while (life > 0) {
        life -= dt
        frames++
      }

      // Should last about 24 frames at 30fps
      expect(frames).toBeGreaterThan(20)
      expect(frames).toBeLessThan(30)
    })

    test('enemy bullet lasts longer', () => {
      expect(BULLET_LIFE_ENEMY).toBeGreaterThan(BULLET_LIFE_PLAYER)
    })

    test('time warp affects bullet lifetime consumption', () => {
      let life = BULLET_LIFE_PLAYER
      const dt = 0.033
      const timeWarpMultiplier = 0.5 // Time slowed

      let frames = 0
      while (life > 0) {
        life -= dt * timeWarpMultiplier
        frames++
      }

      // Should last twice as long with time warp
      expect(frames).toBeGreaterThan(45)
      expect(frames).toBeLessThan(55)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Bullet Speed Tests
  // ------------------------------------------------------------------ //
  describe('Bullet Speed', () => {
    const BULLET_SPEED_PLAYER = 420
    const BULLET_SPEED_ENEMY = 360

    test('player bullets are faster', () => {
      expect(BULLET_SPEED_PLAYER).toBeGreaterThan(BULLET_SPEED_ENEMY)
    })

    test('bullet position update', () => {
      const pos = v(100, 100)
      const vel = fromAngle(0, BULLET_SPEED_PLAYER) // Moving right
      const dt = 1 // 1 second

      const newPos = add(pos, { x: vel.x * dt, y: vel.y * dt })
      expect(newPos.x).toBeCloseTo(100 + BULLET_SPEED_PLAYER)
      expect(newPos.y).toBeCloseTo(100)
    })
  })
})

// ------------------------------------------------------------------ //
//                         Spatial Grid Integration Tests
// ------------------------------------------------------------------ //
describe('Spatial Grid Collision Correctness', () => {
  interface Entity {
    pos: { x: number; y: number }
    radius?: number
  }

  class SpatialGrid {
    private cellSize: number
    private cols: number
    private rows: number
    private grid: Map<number, Entity[]>

    constructor(width: number, height: number, cellSize = 100) {
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

      const minCol = Math.max(0, Math.floor((pos.x - radius) / this.cellSize))
      const maxCol = Math.min(this.cols - 1, Math.floor((pos.x + radius) / this.cellSize))
      const minRow = Math.max(0, Math.floor((pos.y - radius) / this.cellSize))
      const maxRow = Math.min(this.rows - 1, Math.floor((pos.y + radius) / this.cellSize))

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
  //                         Grid Cell Partitioning Tests
  // ------------------------------------------------------------------ //
  describe('Grid Cell Partitioning', () => {
    test('entities in different grid cells do not collide when far apart', () => {
      const grid = new SpatialGrid(400, 600, 100)

      // Place entities in different cells far apart
      const entity1 = { pos: v(50, 50), radius: 18 }    // Cell (0,0)
      const entity2 = { pos: v(350, 550), radius: 18 }  // Cell (3,5)

      grid.insert(entity1)
      grid.insert(entity2)

      // Query near entity1 with radius 50
      const nearby1 = grid.queryNearby(entity1.pos, 50)
      const nearbyPosSet1 = new Set(nearby1.map(e => e.pos))

      // Entity2 should not be in nearby set
      expect(nearbyPosSet1.has(entity2.pos)).toBe(false)

      // Verify collision would not occur
      const collisionRadius = (18 + 18) ** 2
      let collision = false
      if (nearbyPosSet1.has(entity2.pos)) {
        if (dist2(entity1.pos, entity2.pos) < collisionRadius) {
          collision = true
        }
      }
      expect(collision).toBe(false)
    })

    test('entities in same grid cell are detected as nearby', () => {
      const grid = new SpatialGrid(400, 600, 100)

      // Place multiple entities in same cell (0,0)
      const entity1 = { pos: v(50, 50), radius: 18 }
      const entity2 = { pos: v(60, 60), radius: 18 }
      const entity3 = { pos: v(70, 70), radius: 18 }

      grid.insert(entity1)
      grid.insert(entity2)
      grid.insert(entity3)

      // Query near entity1
      const nearby = grid.queryNearby(entity1.pos, 50)
      const nearbyPosSet = new Set(nearby.map(e => e.pos))

      // All entities should be in nearby set
      expect(nearbyPosSet.has(entity1.pos)).toBe(true)
      expect(nearbyPosSet.has(entity2.pos)).toBe(true)
      expect(nearbyPosSet.has(entity3.pos)).toBe(true)
      expect(nearby.length).toBe(3)
    })

    test('entities on opposite sides of cell boundary are found with appropriate radius', () => {
      const grid = new SpatialGrid(400, 600, 100)

      // Place entities on opposite sides of cell boundary at x=100
      const entity1 = { pos: v(95, 50), radius: 18 }   // Cell (0,0)
      const entity2 = { pos: v(105, 50), radius: 18 }  // Cell (1,0)

      grid.insert(entity1)
      grid.insert(entity2)

      // Query at boundary with sufficient radius
      const nearby = grid.queryNearby(v(100, 50), 50)
      const nearbyPosSet = new Set(nearby.map(e => e.pos))

      // Both entities should be found
      expect(nearbyPosSet.has(entity1.pos)).toBe(true)
      expect(nearbyPosSet.has(entity2.pos)).toBe(true)

      // Verify actual collision detection works
      const collisionRadius = (18 + 2) ** 2 // Bullet radius = 2
      const bulletPos = v(100, 50)

      let collisions = 0
      if (nearbyPosSet.has(entity1.pos) && dist2(bulletPos, entity1.pos) < collisionRadius) {
        collisions++
      }
      if (nearbyPosSet.has(entity2.pos) && dist2(bulletPos, entity2.pos) < collisionRadius) {
        collisions++
      }

      expect(collisions).toBe(2) // Both should collide
    })

    test('entity exactly on cell corner is found by queries', () => {
      const grid = new SpatialGrid(400, 600, 100)

      const entity = { pos: v(100, 100), radius: 18 }
      grid.insert(entity)

      // Query at corner
      const nearby = grid.queryNearby(v(100, 100), 30)

      expect(nearby.length).toBe(1)
      expect(nearby[0].pos).toEqual(entity.pos)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Collision Correctness Tests
  // ------------------------------------------------------------------ //
  describe('Collision Detection Correctness', () => {
    test('spatial grid finds all collisions that brute force would find', () => {
      const grid = new SpatialGrid(400, 600, 100)

      // Create test scenario with bullets and enemies
      const bullets = [
        { pos: v(100, 100), friendly: true },
        { pos: v(200, 200), friendly: true },
        { pos: v(300, 300), friendly: true },
      ]

      const enemies = [
        { pos: v(105, 105), hp: 50 }, // Near bullet 1
        { pos: v(350, 350), hp: 50 }, // Far from all bullets
        { pos: v(205, 205), hp: 50 }, // Near bullet 2
      ]

      // Insert enemies into grid
      enemies.forEach(e => grid.insert({ pos: e.pos, radius: 18 }))

      const COLLISION_THRESHOLD = (18 + 2) ** 2 // Enemy radius + bullet radius

      // Spatial grid approach
      const spatialCollisions = new Set<string>()
      bullets.forEach((b, bIdx) => {
        const nearby = grid.queryNearby(b.pos, 50)
        const nearbyPosSet = new Set(nearby.map(ent => ent.pos))

        enemies.forEach((e, eIdx) => {
          if (nearbyPosSet.has(e.pos)) {
            if (dist2(b.pos, e.pos) < COLLISION_THRESHOLD) {
              spatialCollisions.add(`${bIdx}-${eIdx}`)
            }
          }
        })
      })

      // Brute force approach
      const bruteCollisions = new Set<string>()
      bullets.forEach((b, bIdx) => {
        enemies.forEach((e, eIdx) => {
          if (dist2(b.pos, e.pos) < COLLISION_THRESHOLD) {
            bruteCollisions.add(`${bIdx}-${eIdx}`)
          }
        })
      })

      // Results should be identical
      expect(spatialCollisions.size).toBe(bruteCollisions.size)
      spatialCollisions.forEach(collision => {
        expect(bruteCollisions.has(collision)).toBe(true)
      })
    })

    test('spatial grid produces no false positives', () => {
      const grid = new SpatialGrid(400, 600, 100)

      const bullet = { pos: v(50, 50), friendly: true }
      const enemies = [
        { pos: v(200, 200), hp: 50 }, // Far away - should NOT collide
        { pos: v(300, 300), hp: 50 }, // Far away - should NOT collide
      ]

      enemies.forEach(e => grid.insert({ pos: e.pos, radius: 18 }))

      const COLLISION_THRESHOLD = (18 + 2) ** 2

      // Query nearby
      const nearby = grid.queryNearby(bullet.pos, 50)
      const nearbyPosSet = new Set(nearby.map(ent => ent.pos))

      let collisions = 0
      enemies.forEach(e => {
        if (nearbyPosSet.has(e.pos)) {
          if (dist2(bullet.pos, e.pos) < COLLISION_THRESHOLD) {
            collisions++
          }
        }
      })

      expect(collisions).toBe(0) // No false positives
    })

    test('spatial grid handles dense clusters correctly', () => {
      const grid = new SpatialGrid(400, 600, 100)

      // Create dense cluster of enemies
      const enemies = []
      for (let i = 0; i < 10; i++) {
        enemies.push({ pos: v(200 + i * 5, 300 + i * 5), hp: 50 })
      }

      enemies.forEach(e => grid.insert({ pos: e.pos, radius: 18 }))

      // Bullet in middle of cluster
      const bullet = { pos: v(220, 320), friendly: true }

      const COLLISION_THRESHOLD = (18 + 2) ** 2

      // Spatial approach
      const nearby = grid.queryNearby(bullet.pos, 50)
      const nearbyPosSet = new Set(nearby.map(ent => ent.pos))

      let spatialHits = 0
      enemies.forEach(e => {
        if (nearbyPosSet.has(e.pos) && dist2(bullet.pos, e.pos) < COLLISION_THRESHOLD) {
          spatialHits++
        }
      })

      // Brute force approach
      let bruteHits = 0
      enemies.forEach(e => {
        if (dist2(bullet.pos, e.pos) < COLLISION_THRESHOLD) {
          bruteHits++
        }
      })

      expect(spatialHits).toBe(bruteHits)
      expect(spatialHits).toBeGreaterThan(0) // Should hit some enemies
    })

    test('spatial grid handles sparse distribution correctly', () => {
      const grid = new SpatialGrid(400, 600, 100)

      // Sparse distribution - one enemy per cell
      const enemies = [
        { pos: v(50, 50), hp: 50 },     // Cell (0,0)
        { pos: v(150, 150), hp: 50 },   // Cell (1,1)
        { pos: v(250, 250), hp: 50 },   // Cell (2,2)
        { pos: v(350, 350), hp: 50 },   // Cell (3,3)
      ]

      enemies.forEach(e => grid.insert({ pos: e.pos, radius: 18 }))

      // Bullet near first enemy
      const bullet = { pos: v(55, 55), friendly: true }

      const COLLISION_THRESHOLD = (18 + 2) ** 2

      const nearby = grid.queryNearby(bullet.pos, 50)
      const nearbyPosSet = new Set(nearby.map(ent => ent.pos))

      let hits = 0
      enemies.forEach(e => {
        if (nearbyPosSet.has(e.pos) && dist2(bullet.pos, e.pos) < COLLISION_THRESHOLD) {
          hits++
        }
      })

      expect(hits).toBe(1) // Should only hit first enemy
    })
  })

  // ------------------------------------------------------------------ //
  //                         Multi-Entity Collision Tests
  // ------------------------------------------------------------------ //
  describe('Multi-Entity Collision Detection', () => {
    test('player collision with asteroids uses spatial grid correctly', () => {
      const grid = new SpatialGrid(400, 600, 100)

      const player = { pos: v(200, 300), radius: 12 }
      const asteroids = [
        { pos: v(50, 50), radius: 30 },      // Far away
        { pos: v(210, 310), radius: 25 },    // Near player
        { pos: v(350, 550), radius: 20 },    // Far away
      ]

      asteroids.forEach(a => grid.insert({ pos: a.pos, radius: a.radius }))

      const nearby = grid.queryNearby(player.pos, 50)
      const nearbyPosSet = new Set(nearby.map(ent => ent.pos))

      let collisions = 0
      asteroids.forEach(a => {
        if (nearbyPosSet.has(a.pos)) {
          const threshold = (a.radius + player.radius) ** 2
          if (dist2(player.pos, a.pos) < threshold) {
            collisions++
          }
        }
      })

      expect(collisions).toBe(1) // Only asteroid at (210, 310)
    })

    test('bullet vs multiple entity types uses spatial grid', () => {
      const grid = new SpatialGrid(400, 600, 100)

      const bullet = { pos: v(200, 300), friendly: true }

      const asteroids = [{ pos: v(205, 305), radius: 25 }]
      const enemies = [{ pos: v(350, 350), radius: 18 }]
      const boss = { pos: v(50, 50), radius: 50 }

      // Insert all into grid
      asteroids.forEach(a => grid.insert({ pos: a.pos, radius: a.radius }))
      enemies.forEach(e => grid.insert({ pos: e.pos, radius: 18 }))
      grid.insert({ pos: boss.pos, radius: 50 })

      const nearby = grid.queryNearby(bullet.pos, 50)
      const nearbyPosSet = new Set(nearby.map(ent => ent.pos))

      // Check asteroid collision
      let asteroidHit = false
      asteroids.forEach(a => {
        if (nearbyPosSet.has(a.pos) && dist2(bullet.pos, a.pos) < (a.radius + 2) ** 2) {
          asteroidHit = true
        }
      })

      expect(asteroidHit).toBe(true) // Should hit asteroid
      expect(nearbyPosSet.has(boss.pos)).toBe(false) // Boss too far
      expect(nearbyPosSet.has(enemies[0].pos)).toBe(false) // Enemy too far
    })
  })

  // ------------------------------------------------------------------ //
  //                         Edge Case Tests
  // ------------------------------------------------------------------ //
  describe('Spatial Grid Edge Cases', () => {
    test('handles entities at grid boundaries correctly', () => {
      const grid = new SpatialGrid(400, 600, 100)

      const entities = [
        { pos: v(0, 0), radius: 18 },       // Top-left corner
        { pos: v(399, 0), radius: 18 },     // Top-right corner
        { pos: v(0, 599), radius: 18 },     // Bottom-left corner
        { pos: v(399, 599), radius: 18 },   // Bottom-right corner
      ]

      entities.forEach(e => grid.insert(e))

      // Query each corner
      const corners = [v(0, 0), v(399, 0), v(0, 599), v(399, 599)]
      corners.forEach(corner => {
        const nearby = grid.queryNearby(corner, 30)
        expect(nearby.length).toBeGreaterThan(0)
      })
    })

    test('handles empty grid queries gracefully', () => {
      const grid = new SpatialGrid(400, 600, 100)

      const nearby = grid.queryNearby(v(200, 300), 50)

      expect(nearby).toEqual([])
      expect(nearby.length).toBe(0)
    })

    test('handles query with very large radius', () => {
      const grid = new SpatialGrid(400, 600, 100)

      const entities = [
        { pos: v(50, 50), radius: 18 },
        { pos: v(350, 550), radius: 18 },
      ]

      entities.forEach(e => grid.insert(e))

      // Query with radius larger than grid
      const nearby = grid.queryNearby(v(200, 300), 1000)

      expect(nearby.length).toBe(2) // Should find all entities
    })

    test('handles wrapping coordinates if entity positions wrap', () => {
      const grid = new SpatialGrid(400, 600, 100)

      // Simulate wrapped positions (after modulo)
      const entity1 = { pos: v(5, 300), radius: 18 }    // Near left edge
      const entity2 = { pos: v(395, 300), radius: 18 }  // Near right edge

      grid.insert(entity1)
      grid.insert(entity2)

      // Query near left edge
      const nearby1 = grid.queryNearby(v(5, 300), 50)
      expect(nearby1.length).toBe(1)

      // Query near right edge
      const nearby2 = grid.queryNearby(v(395, 300), 50)
      expect(nearby2.length).toBe(1)

      // Note: Spatial grid doesn't handle wrap-around automatically
      // Game engine must handle wrapped collision separately
    })
  })
})
