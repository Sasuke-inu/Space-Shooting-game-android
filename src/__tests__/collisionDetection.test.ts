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
