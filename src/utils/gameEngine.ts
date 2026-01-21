import { useCallback } from "react"
import type { Particle, Vec2, PowerUp, Enemy, Boss, HomingMissile, Bullet, GameState, PowerUpType, EnemyType, BossType, Asteroid } from "../types/game"
import type { ThemeColors } from "../theme/types"
import { ENEMY_STATS, BOSS_STATS, SHIP_STATS } from "../types/game"
import {
  useGameStore,
  PLAYER_ACCEL,
  PLAYER_FRICTION,
  BULLET_SPEED_PLAYER,
  BULLET_SPEED_ENEMY,
  BULLET_LIFE_PLAYER,
  BULLET_LIFE_ENEMY,
  FIRE_COOLDOWN_PLAYER,
  FIRE_COOLDOWN_RAPID,
  POWERUP_DROP_ENEMY,
  POWERUP_DROP_ASTEROID,
  BOSS_WARNING_TIME,
  COMBO_MULTIPLIERS,
  COMBO_TIMEOUT,
  POWERUP_DURATION,
  POWERUP_LIFETIME,
  ASTEROID_BASE_RADIUS,
  BOSS_WAVE_INTERVAL,
  getEnemySpawnWeights,
} from "../state/gameStore"
import {
  add,
  mul,
  wrap,
  sub,
  len,
  nor,
  fromAngle,
  angleOf,
  dist2,
  rand,
  v,
} from "./vectorMath"
import { hapticLight, hapticMedium, hapticHeavy, hapticWarning } from "./haptics"

// Performance tracking
let frameCount = 0
const PERF_LOG_INTERVAL = 60 // Log every 60 frames (~1 second at 60fps)

// ------------------------------------------------------------------ //
//                         Spatial Grid for Collision Detection
// ------------------------------------------------------------------ //

interface Entity {
  pos: Vec2
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

  queryNearby(pos: Vec2, radius: number): Entity[] {
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

let spatialGrid: SpatialGrid | null = null

export const useGameEngine = () => {
  const boom = useCallback((pos: Vec2, color: string, count = 24, speed = 120) => {
    const state = useGameStore.getState()
    const particles = state.acquireParticles(count)

    // Initialize acquired particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      p.pos.x = pos.x
      p.pos.y = pos.y
      const vel = fromAngle((i / count) * Math.PI * 2, rand(speed * 0.5, speed))
      p.vel.x = vel.x
      p.vel.y = vel.y
      p.life = rand(0.4, 0.9)
      p.color = color
      p.active = true
    }
  }, [])

  const fireOnce = useCallback(() => {
    const state = useGameStore.getState()
    if (state.player.cooldown <= 0) {
      const hasRapidFire = state.hasPowerUp('rapid_fire')
      const hasSpreadShot = state.hasPowerUp('spread_shot')
      const cooldown = hasRapidFire ? FIRE_COOLDOWN_RAPID : FIRE_COOLDOWN_PLAYER

      if (hasSpreadShot) {
        // Fire 3 bullets in a spread pattern
        const spreadAngles = [-0.2, 0, 0.2]
        spreadAngles.forEach((offset) => {
          state.addBullet({
            pos: add(state.player.pos, fromAngle(state.player.ang + offset, 18)),
            vel: add(state.player.vel, fromAngle(state.player.ang + offset, BULLET_SPEED_PLAYER)),
            life: BULLET_LIFE_PLAYER,
            friendly: true,
          })
        })
      } else {
        state.addBullet({
          pos: add(state.player.pos, fromAngle(state.player.ang, 18)),
          vel: add(state.player.vel, fromAngle(state.player.ang, BULLET_SPEED_PLAYER)),
          life: BULLET_LIFE_PLAYER,
          friendly: true,
        })
      }

      state.updatePlayer({ cooldown })
      hapticLight()
    }
  }, [])

  const updateGame = useCallback((
    dt: number,
    joystick: Vec2,
    wantsFire: boolean,
    thrusting: boolean,
    themeColors: ThemeColors
  ) => {
    // Performance tracking - start
    const perfStart = performance.now()

    const state = useGameStore.getState()

    // Apply time warp effect
    const effectiveDt = dt * state.timeWarpMultiplier

    // Batch all state updates - collect changes locally first
    const stateUpdates: Partial<GameState> = {}

    // Update time (real time always progresses)
    stateUpdates.time = state.time + dt
    const updatedSessionKillTimer = state.sessionKillTimer > 0 ? state.sessionKillTimer - dt : 0
    stateUpdates.sessionKillTimer = updatedSessionKillTimer
    stateUpdates.sessionKillsRecent = updatedSessionKillTimer <= 0 ? 0 : state.sessionKillsRecent

    // Update combo timer
    let updatedCombo = state.combo
    if (state.combo.timer > 0) {
      const newTimer = state.combo.timer - dt
      if (newTimer <= 0) {
        updatedCombo = { count: 0, multiplier: 1, timer: 0 }
      } else {
        updatedCombo = { ...state.combo, timer: newTimer }
      }
    }
    stateUpdates.combo = updatedCombo

    // Update active power-ups
    let updatedActivePowerUps = state.activePowerUps
      .map((p) => ({ ...p, duration: p.duration - dt }))
      .filter((p) => p.duration > 0)
    stateUpdates.activePowerUps = updatedActivePowerUps

    // Update screen shake
    let updatedScreenShake = state.screenShake
    if (state.screenShake) {
      const newElapsed = state.screenShake.elapsed + dt
      if (newElapsed >= state.screenShake.duration) {
        updatedScreenShake = null
      } else {
        updatedScreenShake = {
          ...state.screenShake,
          elapsed: newElapsed,
        }
      }
    }
    stateUpdates.screenShake = updatedScreenShake

    // Update special ability
    let newCooldown = state.player.specialCooldown - dt
    let specialReady = state.player.specialReady
    if (newCooldown <= 0) {
      newCooldown = 0
      specialReady = true
    }
    let updatedSpecialAbility = state.specialAbility
    if (state.specialAbility && state.specialAbility.isActive) {
      if (state.specialAbility.duration > 0) {
        updatedSpecialAbility = {
          ...state.specialAbility,
          duration: state.specialAbility.duration - dt,
          isActive: state.specialAbility.duration > dt,
        }
      } else {
        updatedSpecialAbility = { ...state.specialAbility, isActive: false }
      }
    }
    stateUpdates.specialAbility = updatedSpecialAbility

    // Check for shield power-up or shield burst ability
    const hasShield = updatedActivePowerUps.some((p) => p.type === 'shield') ||
      (updatedSpecialAbility?.type === 'shield_burst' && updatedSpecialAbility.isActive)
    const hasMagnet = updatedActivePowerUps.some((p) => p.type === 'magnet')

    // Progressive difficulty scaling (0-100% over 4 minutes)
    const difficultyProgress = Math.min(stateUpdates.time! / 240, 1.0)

    // Animation speed multiplier (increases from 1x to 2.5x)
    const animSpeedMultiplier = 1.0 + (difficultyProgress * 1.5)

    // Enemy aim accuracy (starts poor, becomes deadly)
    const aimInaccuracy = 0.5 - (difficultyProgress * 0.45)

    // Player movement
    let newVel = state.player.vel
    if (thrusting) {
      newVel = add(newVel, fromAngle(state.player.ang, PLAYER_ACCEL * dt))
    }
    newVel = mul(newVel, PLAYER_FRICTION)
    const newPos = wrap(add(state.player.pos, mul(newVel, dt)), state.w, state.h)

    const hasRapidFire = updatedActivePowerUps.some((p) => p.type === 'rapid_fire')
    const cooldownRate = hasRapidFire ? 2 : 1 // Cooldown reduces faster with rapid fire
    const newPlayerCooldown = Math.max(0, state.player.cooldown - dt * cooldownRate)
    const newInv = Math.max(0, state.player.inv - dt)

    // Build updated player object
    let updatedPlayer = {
      ...state.player,
      pos: newPos,
      vel: newVel,
      cooldown: newPlayerCooldown,
      inv: newInv,
      specialCooldown: newCooldown,
      specialReady,
    }

    // Track bullets to add
    let bulletsToAdd: Bullet[] = []
    let sessionShotsFired = state.sessionShotsFired
    let sessionLastShotTime = state.sessionLastShotTime

    // Fire weapon
    if (wantsFire && newPlayerCooldown <= 0) {
      const hasSpreadShot = updatedActivePowerUps.some((p) => p.type === 'spread_shot')
      const cooldown = hasRapidFire ? FIRE_COOLDOWN_RAPID : FIRE_COOLDOWN_PLAYER

      if (hasSpreadShot) {
        const spreadAngles = [-0.2, 0, 0.2]
        spreadAngles.forEach((offset) => {
          bulletsToAdd.push({
            pos: add(newPos, fromAngle(state.player.ang + offset, 18)),
            vel: add(newVel, fromAngle(state.player.ang + offset, BULLET_SPEED_PLAYER)),
            life: BULLET_LIFE_PLAYER,
            friendly: true,
          })
        })
      } else {
        bulletsToAdd.push({
          pos: add(newPos, fromAngle(state.player.ang, 18)),
          vel: add(newVel, fromAngle(state.player.ang, BULLET_SPEED_PLAYER)),
          life: BULLET_LIFE_PLAYER,
          friendly: true,
        })
      }

      updatedPlayer.cooldown = cooldown
      sessionShotsFired += bulletsToAdd.length
      sessionLastShotTime = stateUpdates.time!
      hapticLight()
    }

    // Update bullets
    let updatedBullets = [...state.bullets, ...bulletsToAdd]
      .map((b) => ({
        ...b,
        pos: wrap(add(b.pos, mul(b.vel, effectiveDt)), state.w, state.h),
        life: b.life - effectiveDt,
      }))
      .filter((b) => b.life > 0)

    // Update asteroids (with increasing animation speed)
    let updatedAsteroids = state.asteroids.map((a) => ({
      ...a,
      pos: wrap(add(a.pos, mul(a.vel, effectiveDt * animSpeedMultiplier)), state.w, state.h),
      ang: a.ang + a.spin * effectiveDt * animSpeedMultiplier,
    }))

    // Track enemy bullets to add
    const enemyBulletsToAdd: Bullet[] = []

    // Update enemies (AI with progressive difficulty and type-specific behaviors)
    // We need to collect enemy bullets separately to avoid modifying state during iteration
    const enemyUpdateContext = {
      state,
      effectiveDt,
      difficultyProgress,
      aimInaccuracy,
      animSpeedMultiplier,
      bulletsToAdd: enemyBulletsToAdd,
      time: stateUpdates.time!,
    }

    let updatedEnemies = state.enemies.map((e) => {
      // Handle stun duration
      if (e.stunDuration && e.stunDuration > 0) {
        const newStunDuration = e.stunDuration - effectiveDt
        // Stunned enemies don't move or shoot
        if (newStunDuration > 0) {
          return { ...e, stunDuration: newStunDuration }
        }
        // Stun expired, clear it and continue normal behavior
        return updateEnemyBehaviorBatched(
          { ...e, stunDuration: undefined },
          enemyUpdateContext
        )
      }
      return updateEnemyBehaviorBatched(e, enemyUpdateContext)
    })

    // Add enemy bullets to the bullets array
    updatedBullets = [...updatedBullets, ...enemyBulletsToAdd]

    // Update boss
    let updatedBoss = state.boss
    const bossBulletsToAdd: Bullet[] = []
    if (state.boss) {
      const bossUpdateResult = updateBossBehaviorBatched(
        state.boss,
        state,
        effectiveDt,
        themeColors
      )
      updatedBoss = bossUpdateResult.boss
      bossBulletsToAdd.push(...bossUpdateResult.bullets)
    }
    updatedBullets = [...updatedBullets, ...bossBulletsToAdd]

    // Handle boss warning - spawn boss after warning time has elapsed
    let shouldSpawnBoss = false
    if (state.bossWarning && !state.boss && state.bossWarningStartTime !== undefined) {
      const warningElapsed = stateUpdates.time! - state.bossWarningStartTime
      if (warningElapsed >= BOSS_WARNING_TIME) {
        shouldSpawnBoss = true
      }
    }

    // Update power-ups (lifetime countdown and magnet attraction)
    const updatedPowerUps = state.powerUps
      .map((p) => {
        let newPowerUp = { ...p, lifetime: p.lifetime - effectiveDt }

        // Magnet power-up attracts nearby power-ups
        if (hasMagnet) {
          const toPlayer = sub(newPos, p.pos)
          const distance = len(toPlayer)
          if (distance < 200 && distance > 10) {
            const pullStrength = 300 * effectiveDt
            const pullDir = nor(toPlayer)
            newPowerUp.pos = add(p.pos, mul(pullDir, pullStrength))
          }
        }

        return newPowerUp
      })
      .filter((p) => p.lifetime > 0)

    // Update homing missiles
    let updatedHomingMissiles = state.homingMissiles
    const homingMissileUpdates = { enemiesToDamage: new Map<number, number>(), bossDamage: 0 }
    if (state.homingMissiles.length > 0) {
      const result = updateHomingMissilesBatched(
        state,
        effectiveDt,
        themeColors,
        updatedEnemies,
        updatedBoss
      )
      updatedHomingMissiles = result.missiles
      homingMissileUpdates.enemiesToDamage = result.enemiesToDamage
      homingMissileUpdates.bossDamage = result.bossDamage
    }

    // Update particles using object pool
    const PARTICLE_CULL_MARGIN = 50 // Allow particles slightly off-screen before culling
    const pool = state.particlePool
    const activeParticles: Particle[] = []

    for (let i = 0; i < pool.length; i++) {
      const p = pool[i]
      if (!p.active) continue

      // Update position
      p.pos.x += p.vel.x * effectiveDt
      p.pos.y += p.vel.y * effectiveDt
      // Apply friction
      p.vel.x *= 0.98
      p.vel.y *= 0.98
      p.life -= effectiveDt

      // Check if particle should be deactivated
      if (p.life <= 0) {
        p.active = false
        continue
      }

      // Cull off-screen particles
      if (p.pos.x < -PARTICLE_CULL_MARGIN || p.pos.x > state.w + PARTICLE_CULL_MARGIN ||
          p.pos.y < -PARTICLE_CULL_MARGIN || p.pos.y > state.h + PARTICLE_CULL_MARGIN) {
        p.active = false
        continue
      }

      // Add to active particles for rendering
      activeParticles.push({
        pos: p.pos,
        vel: p.vel,
        life: p.life,
        color: p.color,
      })
    }

    // Initialize spatial grid for broad-phase collision detection
    if (!spatialGrid || spatialGrid['cols'] !== Math.ceil(state.w / 100)) {
      spatialGrid = new SpatialGrid(state.w, state.h, 100)
    } else {
      spatialGrid.clear()
    }

    // Insert asteroids into spatial grid
    updatedAsteroids.forEach((a) => {
      spatialGrid!.insert({ pos: a.pos, radius: a.radius })
    })

    // Insert enemies into spatial grid
    updatedEnemies.forEach((e) => {
      spatialGrid!.insert({ pos: e.pos, radius: 18 })
    })

    // Insert boss into spatial grid
    if (updatedBoss) {
      spatialGrid!.insert({ pos: updatedBoss.pos, radius: 50 })
    }

    // Track collision results
    let score = state.score
    let credits = state.credits
    let comboCount = updatedCombo.count
    let comboMultiplier = updatedCombo.multiplier
    let comboTimer = updatedCombo.timer
    let sessionShotsHit = state.sessionShotsHit
    let sessionDamageTaken = state.sessionDamageTaken
    let sessionKillsRecent = stateUpdates.sessionKillsRecent!
    let newSessionKillTimer = updatedSessionKillTimer
    const newPowerUpsToSpawn: Vec2[] = []
    let newScreenShake = updatedScreenShake

    // Collisions - bullets vs asteroids/enemies/boss (using spatial partitioning)
    const bulletsToRemove = new Set<number>()
    const asteroidsToRemove = new Set<number>()
    const enemiesToRemove = new Set<number>()
    const enemyDamage = new Map<number, number>()
    const enemyDeathEffects: Array<{ pos: Vec2; type: string; dropPowerUp: boolean }> = []

    updatedBullets.forEach((b, bIdx) => {
      if (!b.friendly) return // Skip enemy bullets for asteroid collision

      // Query nearby entities using spatial grid
      const nearby = spatialGrid!.queryNearby(b.pos, 60) // Max query radius for bullet collisions

      // Bullets vs asteroids
      updatedAsteroids.forEach((a, aIdx) => {
        if (!bulletsToRemove.has(bIdx) && !asteroidsToRemove.has(aIdx)) {
          // Check if asteroid is in nearby entities
          if (nearby.some(e => e.pos === a.pos)) {
            if (dist2(b.pos, a.pos) < (a.radius + 2) * (a.radius + 2)) {
              boom(b.pos, themeColors.particleHit, 12, 180)
              // Split asteroid inline
              if (a.tier > 1) {
                const newTier = (a.tier - 1) as 1 | 2
                for (let i = 0; i < 2; i++) {
                  const vel = add(a.vel, fromAngle(rand(0, Math.PI * 2), rand(30, 60)))
                  updatedAsteroids.push({
                    pos: { ...a.pos },
                    vel,
                    radius: a.radius * 0.65,
                    spin: rand(-2, 2),
                    ang: rand(0, Math.PI * 2),
                    tier: newTier,
                  })
                }
              }
              asteroidsToRemove.add(aIdx)
              bulletsToRemove.add(bIdx)

              // Increment combo
              comboCount++
              const multiplierIndex = Math.min(
                Math.floor(comboCount / 3),
                COMBO_MULTIPLIERS.length - 1
              )
              comboMultiplier = COMBO_MULTIPLIERS[multiplierIndex]
              comboTimer = COMBO_TIMEOUT

              score += Math.floor(20 * a.tier * comboMultiplier)
              credits += a.tier
              newScreenShake = { intensity: 3, duration: 100, elapsed: 0 }
              hapticMedium()

              // Chance to drop power-up from large asteroids
              if (a.tier === 3 && Math.random() < POWERUP_DROP_ASTEROID) {
                newPowerUpsToSpawn.push({ ...a.pos })
              }
              sessionShotsHit++ // Record shot hit
            }
          }
        }
      })

      // Bullets vs enemies - collect damage to apply after iteration
      updatedEnemies.forEach((e, eIdx) => {
        if (b.friendly && !bulletsToRemove.has(bIdx) && !enemiesToRemove.has(eIdx)) {
          // Check if enemy is in nearby entities
          if (nearby.some(ent => ent.pos === e.pos)) {
            if (dist2(b.pos, e.pos) < 18 * 18) {
              const damage = 25
              const newHp = e.hp - damage

              if (newHp <= 0) {
                // Enemy destroyed - mark for removal
                enemiesToRemove.add(eIdx)
                enemyDeathEffects.push({
                  pos: { ...e.pos },
                  type: e.type,
                  dropPowerUp: Math.random() < POWERUP_DROP_ENEMY,
                })
                boom(e.pos, themeColors.particleExplosion, 28, 200)

                // Increment combo
                comboCount++
                const multiplierIndex = Math.min(
                  Math.floor(comboCount / 3),
                  COMBO_MULTIPLIERS.length - 1
                )
                comboMultiplier = COMBO_MULTIPLIERS[multiplierIndex]
                comboTimer = COMBO_TIMEOUT

                // Record kill
                sessionKillsRecent++
                newSessionKillTimer = 10

                score += Math.floor(ENEMY_STATS[e.type].points * comboMultiplier)
                credits += Math.floor(ENEMY_STATS[e.type].points / 10)
                newScreenShake = { intensity: 8, duration: 200, elapsed: 0 }
                hapticHeavy()
              } else {
                // Enemy damaged - track damage to apply
                enemyDamage.set(eIdx, (enemyDamage.get(eIdx) || 0) + damage)
                boom(b.pos, themeColors.particleExplosion, 10, 160)
              }

              bulletsToRemove.add(bIdx)
              sessionShotsHit++ // Record shot hit
            }
          }
        }
      })

      // Bullets vs boss
      if (updatedBoss && b.friendly && !bulletsToRemove.has(bIdx)) {
        // Check if boss is in nearby entities
        if (nearby.some(ent => ent.pos === updatedBoss!.pos)) {
          const bossHitRadius = 50
          if (dist2(b.pos, updatedBoss.pos) < bossHitRadius * bossHitRadius) {
            // Store boss position before potentially defeating it
            const bossPos = { ...updatedBoss.pos }
            const bossDamage = 25
            const newBossHp = updatedBoss.hp - bossDamage
            const stats = BOSS_STATS[updatedBoss.type]

            // Check for phase transition
            const hpPercent = newBossHp / updatedBoss.maxHp
            let newPhase = updatedBoss.phase
            if (stats.phases >= 3 && hpPercent <= 0.33 && updatedBoss.phase < 3) {
              newPhase = 3
            } else if (stats.phases >= 2 && hpPercent <= 0.66 && updatedBoss.phase < 2) {
              newPhase = 2
            }

            updatedBoss = {
              ...updatedBoss,
              hp: newBossHp,
              phase: newPhase as 1 | 2 | 3,
            }

            bulletsToRemove.add(bIdx)
            boom(b.pos, themeColors.particleExplosion, 8, 140)
            newScreenShake = { intensity: 5, duration: 100, elapsed: 0 }

            sessionShotsHit++ // Record shot hit

            // Check boss death
            if (newBossHp <= 0) {
              boom(bossPos, themeColors.particleExplosion, 60, 300)
              const points = BOSS_STATS[updatedBoss.type].points
              score += points
              credits += Math.floor(points / 10)
              updatedBoss = null
              newScreenShake = { intensity: 20, duration: 500, elapsed: 0 }
              hapticHeavy()
            }
          }
        }
      }
    })

    // Enemy bullets vs player - use spatial grid for player query
    const playerNearby = spatialGrid.queryNearby(newPos, 100)

    updatedBullets.forEach((b, bIdx) => {
      if (!b.friendly && dist2(b.pos, newPos) < 16 * 16) {
        if (updatedPlayer.inv <= 0 && !hasShield) {
          updatedPlayer = { ...updatedPlayer, hp: updatedPlayer.hp - 18, inv: 0.6 }
          sessionDamageTaken = true
          newScreenShake = { intensity: 10, duration: 150, elapsed: 0 }
          hapticWarning()
        }
        bulletsToRemove.add(bIdx)
        boom(b.pos, themeColors.particleDamage, 8, 140)
      }
    })

    // Remove hit bullets and asteroids
    if (bulletsToRemove.size > 0) {
      updatedBullets = updatedBullets.filter((_, i) => !bulletsToRemove.has(i))
    }
    if (asteroidsToRemove.size > 0) {
      updatedAsteroids = updatedAsteroids.filter((_, i) => !asteroidsToRemove.has(i))
    }

    // Apply enemy damage and removals (deferred to avoid race conditions)
    if (enemyDamage.size > 0 || enemiesToRemove.size > 0) {
      updatedEnemies = updatedEnemies
        .map((e, idx) => {
          if (enemiesToRemove.has(idx)) return null
          const dmg = enemyDamage.get(idx)
          if (dmg) return { ...e, hp: e.hp - dmg }
          return e
        })
        .filter((e): e is Enemy => e !== null)
    }

    // Spawn power-ups from defeated enemies
    for (const effect of enemyDeathEffects) {
      if (effect.dropPowerUp) {
        newPowerUpsToSpawn.push({ ...effect.pos })
      }
    }

    // Player collisions with asteroids (using spatial partitioning)
    updatedAsteroids.forEach((a) => {
      // Check if asteroid is near player using spatial grid
      if (playerNearby.some(e => e.pos === a.pos)) {
        if (dist2(newPos, a.pos) < (a.radius + 12) * (a.radius + 12)) {
          if (updatedPlayer.inv <= 0 && !hasShield) {
            updatedPlayer = { ...updatedPlayer, hp: updatedPlayer.hp - 28, inv: 1.0 }
            sessionDamageTaken = true
            boom(newPos, themeColors.particleCollision, 18, 200)
            newScreenShake = { intensity: 12, duration: 200, elapsed: 0 }
            hapticWarning()
          }
        }
      }
    })

    // Player collisions with enemies (using spatial partitioning)
    updatedEnemies.forEach((e) => {
      // Check if enemy is near player using spatial grid
      if (playerNearby.some(ent => ent.pos === e.pos)) {
        if (dist2(newPos, e.pos) < 22 * 22) {
          if (updatedPlayer.inv <= 0 && !hasShield) {
            updatedPlayer = { ...updatedPlayer, hp: updatedPlayer.hp - 20, inv: 0.9 }
            sessionDamageTaken = true
            boom(newPos, themeColors.particleCollision, 18, 200)
            newScreenShake = { intensity: 12, duration: 200, elapsed: 0 }
            hapticWarning()
          }
        }
      }
    })

    // Player collision with boss (using spatial partitioning)
    if (updatedBoss) {
      // Check if boss is near player using spatial grid
      if (playerNearby.some(ent => ent.pos === updatedBoss!.pos)) {
        if (dist2(newPos, updatedBoss.pos) < 60 * 60) {
          if (updatedPlayer.inv <= 0 && !hasShield) {
            updatedPlayer = { ...updatedPlayer, hp: updatedPlayer.hp - 40, inv: 1.5 }
            sessionDamageTaken = true
            boom(newPos, themeColors.particleCollision, 24, 250)
            newScreenShake = { intensity: 15, duration: 300, elapsed: 0 }
            hapticWarning()
          }
        }
      }
    }

    // Player collisions with power-ups (power-ups are sparse, no need for spatial grid)
    const powerUpsCollected = new Set<number>()
    updatedPowerUps.forEach((p, pIdx) => {
      if (dist2(newPos, p.pos) < 30 * 30) {
        // Collect power-up inline
        const existingIndex = updatedActivePowerUps.findIndex((ap) => ap.type === p.type)
        if (existingIndex >= 0) {
          updatedActivePowerUps[existingIndex] = {
            type: p.type,
            duration: POWERUP_DURATION,
          }
        } else {
          updatedActivePowerUps.push({ type: p.type, duration: POWERUP_DURATION })
        }
        powerUpsCollected.add(pIdx)
        boom(p.pos, getPowerUpColor(p.type, themeColors), 16, 100)
      }
    })
    const finalPowerUps = [
      ...updatedPowerUps.filter((_, i) => !powerUpsCollected.has(i)),
      ...newPowerUpsToSpawn.map((pos) => {
        const types: PowerUpType[] = ['shield', 'rapid_fire', 'spread_shot', 'magnet']
        const powerUpType = types[Math.floor(Math.random() * types.length)]
        return {
          pos: { ...pos },
          type: powerUpType,
          lifetime: POWERUP_LIFETIME,
        }
      }),
    ]

    // Update combo based on collected changes
    updatedCombo = { count: comboCount, multiplier: comboMultiplier, timer: comboTimer }

    // Wave progression
    let wave = state.wave
    let bossWarning = state.bossWarning
    let bossWarningStartTime = state.bossWarningStartTime
    if (updatedAsteroids.length === 0 && !updatedBoss && !state.bossWarning) {
      wave++
      const isBossWave = wave % BOSS_WAVE_INTERVAL === 0
      bossWarning = isBossWave
      bossWarningStartTime = isBossWave ? stateUpdates.time : undefined
      sessionDamageTaken = false // Reset for new wave

      // Spawn asteroids
      for (let i = 0; i < 4 + wave; i++) {
        const side = Math.floor(Math.random() * 4)
        const pos = v(
          side === 0 ? 0 : side === 2 ? state.w : rand(0, state.w),
          side === 1 ? 0 : side === 3 ? state.h : rand(0, state.h)
        )
        const vel = fromAngle(rand(0, Math.PI * 2), rand(20, 50))
        updatedAsteroids.push({
          pos,
          vel,
          radius: ASTEROID_BASE_RADIUS,
          spin: rand(-1, 1),
          ang: rand(0, Math.PI * 2),
          tier: 3,
        })
      }

      // Spawn enemies on even waves
      if (wave % 2 === 0) {
        const enemyCount = Math.min(2 + Math.floor(wave / 2), 6)
        for (let i = 0; i < enemyCount; i++) {
          const weights = getEnemySpawnWeights(wave)
          const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)
          let random = Math.random() * totalWeight
          let enemyType: EnemyType = 'scout'

          for (const [t, weight] of Object.entries(weights)) {
            random -= weight
            if (random <= 0) {
              enemyType = t as EnemyType
              break
            }
          }

          const stats = ENEMY_STATS[enemyType]
          const ePos = v(rand(0, state.w), rand(0, state.h))
          const eVel = fromAngle(rand(0, Math.PI * 2), rand(10, 40))

          updatedEnemies.push({
            pos: ePos,
            vel: eVel,
            ang: rand(0, Math.PI * 2),
            cooldown: rand(0.5, 1.5),
            hp: stats.hp,
            maxHp: stats.hp,
            aiTimer: 0,
            type: enemyType,
            chargeTime: enemyType === 'sniper' ? 0 : undefined,
            bombCooldown: enemyType === 'bomber' ? 3 : undefined,
          })
        }
      }
    }

    // Apply homing missile damage
    if (homingMissileUpdates.enemiesToDamage.size > 0) {
      const deadIndices = new Set<number>()
      updatedEnemies = updatedEnemies.map((enemy, idx) => {
        const damage = homingMissileUpdates.enemiesToDamage.get(idx)
        if (!damage) return enemy

        const newHp = enemy.hp - damage
        if (newHp <= 0) {
          deadIndices.add(idx)
          score += Math.floor(ENEMY_STATS[enemy.type].points * updatedCombo.multiplier)
          sessionKillsRecent++
          newSessionKillTimer = 10
          return { ...enemy, hp: newHp }
        }
        return { ...enemy, hp: newHp }
      }).filter((_, idx) => !deadIndices.has(idx))
    }
    if (homingMissileUpdates.bossDamage > 0 && updatedBoss) {
      const newBossHp = updatedBoss.hp - homingMissileUpdates.bossDamage
      const stats = BOSS_STATS[updatedBoss.type]
      const hpPercent = newBossHp / updatedBoss.maxHp
      let newPhase = updatedBoss.phase
      if (stats.phases >= 3 && hpPercent <= 0.33 && updatedBoss.phase < 3) {
        newPhase = 3
      } else if (stats.phases >= 2 && hpPercent <= 0.66 && updatedBoss.phase < 2) {
        newPhase = 2
      }
      updatedBoss = { ...updatedBoss, hp: newBossHp, phase: newPhase as 1 | 2 | 3 }
    }

    // Spawn boss if needed
    if (shouldSpawnBoss) {
      const bossTypes: BossType[] = ['destroyer', 'carrier', 'dreadnought']
      const waveBasedIndex = Math.min(Math.floor(wave / 10), 2)
      const bossType = bossTypes[waveBasedIndex]
      const stats = BOSS_STATS[bossType]
      updatedBoss = {
        pos: v(state.w / 2, state.h / 8),
        vel: v(0, 0),
        ang: Math.PI / 2,
        hp: stats.hp,
        maxHp: stats.hp,
        type: bossType,
        phase: 1,
        cooldown: 2,
        specialCooldown: 5,
        aiTimer: 0,
        isActive: true,
      }
      bossWarning = false
      bossWarningStartTime = undefined
    }

    // Check player death
    let lives = state.lives
    let paused = state.paused
    if (updatedPlayer.hp <= 0) {
      lives--
      newScreenShake = { intensity: 15, duration: 400, elapsed: 0 }
      if (lives <= 0) {
        paused = true
        updatedActivePowerUps = []
        updatedCombo = { count: 0, multiplier: 1, timer: 0 }
        stateUpdates.timeWarpActive = false
        stateUpdates.timeWarpMultiplier = 1
      } else {
        updatedPlayer = {
          ...updatedPlayer,
          pos: v(state.w / 2, state.h / 2),
          vel: v(),
          hp: SHIP_STATS[updatedPlayer.shipType].hull,
          inv: 2,
        }
        updatedActivePowerUps = []
        updatedCombo = { count: 0, multiplier: 1, timer: 0 }
        stateUpdates.timeWarpActive = false
        stateUpdates.timeWarpMultiplier = 1
      }
    }

    // BATCH UPDATE: Apply all state changes in a single Zustand set() call
    // This dramatically reduces re-renders from potentially dozens per frame to just one
    stateUpdates.player = updatedPlayer
    stateUpdates.bullets = updatedBullets
    stateUpdates.asteroids = updatedAsteroids
    stateUpdates.enemies = updatedEnemies
    stateUpdates.particles = activeParticles
    stateUpdates.powerUps = finalPowerUps
    stateUpdates.boss = updatedBoss
    stateUpdates.homingMissiles = updatedHomingMissiles
    stateUpdates.score = score
    stateUpdates.credits = credits
    stateUpdates.lives = lives
    stateUpdates.wave = wave
    stateUpdates.paused = paused
    stateUpdates.bossWarning = bossWarning
    stateUpdates.bossWarningStartTime = bossWarningStartTime
    stateUpdates.sessionDamageTaken = sessionDamageTaken
    stateUpdates.sessionKillsRecent = sessionKillsRecent
    stateUpdates.sessionKillTimer = newSessionKillTimer
    stateUpdates.sessionShotsFired = sessionShotsFired
    stateUpdates.sessionShotsHit = sessionShotsHit
    stateUpdates.sessionLastShotTime = sessionLastShotTime
    stateUpdates.screenShake = newScreenShake

    // Apply all updates at once
    useGameStore.setState(stateUpdates)

    // Performance tracking - end
    const perfEnd = performance.now()
    const frameTime = perfEnd - perfStart

    frameCount++
    if (frameCount % PERF_LOG_INTERVAL === 0) {
      const totalEntities =
        updatedBullets.length +
        updatedAsteroids.length +
        updatedEnemies.length +
        activeParticles.length +
        finalPowerUps.length +
        updatedHomingMissiles.length +
        (updatedBoss ? 1 : 0)

      // eslint-disable-next-line no-console
      console.log('[GameEngine Performance]', {
        frameTime: `${frameTime.toFixed(2)}ms`,
        entities: {
          total: totalEntities,
          bullets: updatedBullets.length,
          asteroids: updatedAsteroids.length,
          enemies: updatedEnemies.length,
          particles: activeParticles.length,
          powerUps: finalPowerUps.length,
          homingMissiles: updatedHomingMissiles.length,
          boss: updatedBoss ? 1 : 0,
        },
        wave,
        score,
      })
    }
  }, [boom])

  return {
    updateGame,
    fireOnce,
  }
}

// ------------------------------------------------------------------ //
//                         Enemy Behavior Update (Batched)
// ------------------------------------------------------------------ //

interface EnemyUpdateContext {
  state: ReturnType<typeof useGameStore.getState>
  effectiveDt: number
  difficultyProgress: number
  aimInaccuracy: number
  animSpeedMultiplier: number
  bulletsToAdd: Bullet[]
  time: number
}

function updateEnemyBehaviorBatched(
  e: Enemy,
  context: EnemyUpdateContext
): Enemy {
  const { state, effectiveDt: dt, difficultyProgress: difficulty, aimInaccuracy, animSpeedMultiplier: animSpeed, bulletsToAdd } = context
  const stats = ENEMY_STATS[e.type]
  const toP = sub(state.player.pos, e.pos)
  const d = len(toP)
  const dir = nor(toP)

  let newEnemy = { ...e }

  switch (e.type) {
    case 'scout':
      // Fast, erratic movement
      const scoutDesired = add(dir, fromAngle(context.time * 2, 0.6))
      let scoutVel = add(e.vel, mul(nor(scoutDesired), stats.speed * dt))
      scoutVel = mul(scoutVel, 0.99)
      newEnemy.vel = scoutVel
      newEnemy.pos = wrap(add(e.pos, mul(scoutVel, dt * animSpeed)), state.w, state.h)
      newEnemy.ang = angleOf(scoutVel)

      // Fire at player
      newEnemy.cooldown = e.cooldown - dt
      if (d < 400 && newEnemy.cooldown <= 0) {
        const aim = angleOf(sub(state.player.pos, e.pos)) + rand(-aimInaccuracy * 1.5, aimInaccuracy * 1.5)
        bulletsToAdd.push({
          pos: add(e.pos, fromAngle(aim, 16)),
          vel: add(e.vel, fromAngle(aim, BULLET_SPEED_ENEMY * 0.9)),
          life: BULLET_LIFE_ENEMY * 0.8,
          friendly: false,
        })
        newEnemy.cooldown = stats.fireRate * (1 - difficulty * 0.3)
      }
      break

    case 'tank':
      // Slow, steady approach
      const tankDesired = mul(dir, 0.8)
      let tankVel = add(e.vel, mul(nor(tankDesired), stats.speed * dt))
      tankVel = mul(tankVel, 0.995)
      newEnemy.vel = tankVel
      newEnemy.pos = wrap(add(e.pos, mul(tankVel, dt * animSpeed * 0.7)), state.w, state.h)
      newEnemy.ang = angleOf(toP)

      // Heavy shots with less accuracy needed
      newEnemy.cooldown = e.cooldown - dt
      if (d < 500 && newEnemy.cooldown <= 0) {
        const aim = angleOf(sub(state.player.pos, e.pos)) + rand(-aimInaccuracy * 0.5, aimInaccuracy * 0.5)
        // Fire 2 bullets
        for (let i = -1; i <= 1; i += 2) {
          bulletsToAdd.push({
            pos: add(e.pos, fromAngle(aim + i * 0.1, 20)),
            vel: fromAngle(aim + i * 0.05, BULLET_SPEED_ENEMY * 0.7),
            life: BULLET_LIFE_ENEMY * 1.2,
            friendly: false,
          })
        }
        newEnemy.cooldown = stats.fireRate * (1 - difficulty * 0.2)
      }
      break

    case 'sniper':
      // Stay at distance, precise shots
      const preferredDist = 350
      let sniperVel = e.vel
      if (d < preferredDist - 50) {
        // Move away
        sniperVel = add(sniperVel, mul(nor(sub(e.pos, state.player.pos)), stats.speed * dt))
      } else if (d > preferredDist + 100) {
        // Move closer
        sniperVel = add(sniperVel, mul(dir, stats.speed * dt))
      }
      sniperVel = mul(sniperVel, 0.98)
      newEnemy.vel = sniperVel
      newEnemy.pos = wrap(add(e.pos, mul(sniperVel, dt * animSpeed * 0.5)), state.w, state.h)
      newEnemy.ang = angleOf(toP)

      // Charged precision shots
      newEnemy.chargeTime = (e.chargeTime || 0) + dt
      if (newEnemy.chargeTime >= 2 && d < 600) {
        const leadFactor = 0.5 + difficulty * 0.3
        const lead = add(state.player.pos, mul(state.player.vel, leadFactor))
        const aim = angleOf(sub(lead, e.pos))
        bulletsToAdd.push({
          pos: add(e.pos, fromAngle(aim, 18)),
          vel: fromAngle(aim, BULLET_SPEED_ENEMY * 1.3),
          life: BULLET_LIFE_ENEMY * 1.5,
          friendly: false,
          damage: 35,
        })
        newEnemy.chargeTime = 0
      }
      break

    case 'bomber':
      // Circles player, drops area attacks
      const circleAngle = Math.atan2(toP.y, toP.x) + Math.PI / 2
      const bomberDesired = fromAngle(circleAngle, 1)
      let bomberVel = add(e.vel, mul(bomberDesired, stats.speed * dt))
      bomberVel = mul(bomberVel, 0.995)
      newEnemy.vel = bomberVel
      newEnemy.pos = wrap(add(e.pos, mul(bomberVel, dt * animSpeed)), state.w, state.h)
      newEnemy.ang = angleOf(bomberVel)

      // Regular shots
      newEnemy.cooldown = e.cooldown - dt
      if (d < 450 && newEnemy.cooldown <= 0) {
        const aim = angleOf(sub(state.player.pos, e.pos)) + rand(-aimInaccuracy, aimInaccuracy)
        bulletsToAdd.push({
          pos: add(e.pos, fromAngle(aim, 16)),
          vel: fromAngle(aim, BULLET_SPEED_ENEMY * 0.85),
          life: BULLET_LIFE_ENEMY,
          friendly: false,
        })
        newEnemy.cooldown = stats.fireRate * (1 - difficulty * 0.25)
      }

      // Bomb attack (spread of bullets)
      newEnemy.bombCooldown = (e.bombCooldown || 3) - dt
      if (newEnemy.bombCooldown <= 0 && d < 300) {
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2
          bulletsToAdd.push({
            pos: { ...e.pos },
            vel: fromAngle(angle, BULLET_SPEED_ENEMY * 0.6),
            life: BULLET_LIFE_ENEMY * 0.7,
            friendly: false,
          })
        }
        newEnemy.bombCooldown = 4 - difficulty
      }
      break

    default:
      // Default behavior (legacy)
      const desired = add(dir, fromAngle(context.time * 0.7, 0.4 * (1 - difficulty * 0.5)))
      const accelMultiplier = 1.0 + (difficulty * 0.8)
      let eVel = add(e.vel, mul(nor(desired), 90 * dt * accelMultiplier))
      eVel = mul(eVel, 0.993)
      newEnemy.vel = eVel
      newEnemy.pos = wrap(add(e.pos, mul(eVel, dt * animSpeed)), state.w, state.h)
      newEnemy.ang = angleOf(eVel)

      newEnemy.cooldown = e.cooldown - dt
      if (d < 520 && newEnemy.cooldown <= 0) {
        const leadFactor = 0.35 + (difficulty * 0.4)
        const lead = add(state.player.pos, mul(state.player.vel, leadFactor))
        const aim = angleOf(sub(lead, e.pos)) + rand(-aimInaccuracy, aimInaccuracy)
        bulletsToAdd.push({
          pos: add(e.pos, fromAngle(aim, 16)),
          vel: add(eVel, fromAngle(aim, BULLET_SPEED_ENEMY)),
          life: BULLET_LIFE_ENEMY,
          friendly: false,
        })
        const cooldownBase = 1.4 - (difficulty * 0.6)
        newEnemy.cooldown = rand(0.5, cooldownBase)
      }
  }

  newEnemy.aiTimer = e.aiTimer + dt
  return newEnemy
}

// ------------------------------------------------------------------ //
//                         Enemy Behavior Update (Original - kept for compatibility)
// ------------------------------------------------------------------ //

function updateEnemyBehavior(
  e: Enemy,
  state: ReturnType<typeof useGameStore.getState>,
  dt: number,
  difficulty: number,
  aimInaccuracy: number,
  animSpeed: number
): Enemy {
  const stats = ENEMY_STATS[e.type]
  const toP = sub(state.player.pos, e.pos)
  const d = len(toP)
  const dir = nor(toP)

  let newEnemy = { ...e }

  switch (e.type) {
    case 'scout':
      // Fast, erratic movement
      const scoutDesired = add(dir, fromAngle(state.time * 2, 0.6))
      let scoutVel = add(e.vel, mul(nor(scoutDesired), stats.speed * dt))
      scoutVel = mul(scoutVel, 0.99)
      newEnemy.vel = scoutVel
      newEnemy.pos = wrap(add(e.pos, mul(scoutVel, dt * animSpeed)), state.w, state.h)
      newEnemy.ang = angleOf(scoutVel)

      // Fire at player
      newEnemy.cooldown = e.cooldown - dt
      if (d < 400 && newEnemy.cooldown <= 0) {
        const aim = angleOf(sub(state.player.pos, e.pos)) + rand(-aimInaccuracy * 1.5, aimInaccuracy * 1.5)
        state.addBullet({
          pos: add(e.pos, fromAngle(aim, 16)),
          vel: add(e.vel, fromAngle(aim, BULLET_SPEED_ENEMY * 0.9)),
          life: BULLET_LIFE_ENEMY * 0.8,
          friendly: false,
        })
        newEnemy.cooldown = stats.fireRate * (1 - difficulty * 0.3)
      }
      break

    case 'tank':
      // Slow, steady approach
      const tankDesired = mul(dir, 0.8)
      let tankVel = add(e.vel, mul(nor(tankDesired), stats.speed * dt))
      tankVel = mul(tankVel, 0.995)
      newEnemy.vel = tankVel
      newEnemy.pos = wrap(add(e.pos, mul(tankVel, dt * animSpeed * 0.7)), state.w, state.h)
      newEnemy.ang = angleOf(toP)

      // Heavy shots with less accuracy needed
      newEnemy.cooldown = e.cooldown - dt
      if (d < 500 && newEnemy.cooldown <= 0) {
        const aim = angleOf(sub(state.player.pos, e.pos)) + rand(-aimInaccuracy * 0.5, aimInaccuracy * 0.5)
        // Fire 2 bullets
        for (let i = -1; i <= 1; i += 2) {
          state.addBullet({
            pos: add(e.pos, fromAngle(aim + i * 0.1, 20)),
            vel: fromAngle(aim + i * 0.05, BULLET_SPEED_ENEMY * 0.7),
            life: BULLET_LIFE_ENEMY * 1.2,
            friendly: false,
          })
        }
        newEnemy.cooldown = stats.fireRate * (1 - difficulty * 0.2)
      }
      break

    case 'sniper':
      // Stay at distance, precise shots
      const preferredDist = 350
      let sniperVel = e.vel
      if (d < preferredDist - 50) {
        // Move away
        sniperVel = add(sniperVel, mul(nor(sub(e.pos, state.player.pos)), stats.speed * dt))
      } else if (d > preferredDist + 100) {
        // Move closer
        sniperVel = add(sniperVel, mul(dir, stats.speed * dt))
      }
      sniperVel = mul(sniperVel, 0.98)
      newEnemy.vel = sniperVel
      newEnemy.pos = wrap(add(e.pos, mul(sniperVel, dt * animSpeed * 0.5)), state.w, state.h)
      newEnemy.ang = angleOf(toP)

      // Charged precision shots
      newEnemy.chargeTime = (e.chargeTime || 0) + dt
      if (newEnemy.chargeTime >= 2 && d < 600) {
        const leadFactor = 0.5 + difficulty * 0.3
        const lead = add(state.player.pos, mul(state.player.vel, leadFactor))
        const aim = angleOf(sub(lead, e.pos))
        state.addBullet({
          pos: add(e.pos, fromAngle(aim, 18)),
          vel: fromAngle(aim, BULLET_SPEED_ENEMY * 1.3),
          life: BULLET_LIFE_ENEMY * 1.5,
          friendly: false,
          damage: 35,
        })
        newEnemy.chargeTime = 0
      }
      break

    case 'bomber':
      // Circles player, drops area attacks
      const circleAngle = Math.atan2(toP.y, toP.x) + Math.PI / 2
      const bomberDesired = fromAngle(circleAngle, 1)
      let bomberVel = add(e.vel, mul(bomberDesired, stats.speed * dt))
      bomberVel = mul(bomberVel, 0.995)
      newEnemy.vel = bomberVel
      newEnemy.pos = wrap(add(e.pos, mul(bomberVel, dt * animSpeed)), state.w, state.h)
      newEnemy.ang = angleOf(bomberVel)

      // Regular shots
      newEnemy.cooldown = e.cooldown - dt
      if (d < 450 && newEnemy.cooldown <= 0) {
        const aim = angleOf(sub(state.player.pos, e.pos)) + rand(-aimInaccuracy, aimInaccuracy)
        state.addBullet({
          pos: add(e.pos, fromAngle(aim, 16)),
          vel: fromAngle(aim, BULLET_SPEED_ENEMY * 0.85),
          life: BULLET_LIFE_ENEMY,
          friendly: false,
        })
        newEnemy.cooldown = stats.fireRate * (1 - difficulty * 0.25)
      }

      // Bomb attack (spread of bullets)
      newEnemy.bombCooldown = (e.bombCooldown || 3) - dt
      if (newEnemy.bombCooldown <= 0 && d < 300) {
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2
          state.addBullet({
            pos: { ...e.pos },
            vel: fromAngle(angle, BULLET_SPEED_ENEMY * 0.6),
            life: BULLET_LIFE_ENEMY * 0.7,
            friendly: false,
          })
        }
        newEnemy.bombCooldown = 4 - difficulty
      }
      break

    default:
      // Default behavior (legacy)
      const desired = add(dir, fromAngle(state.time * 0.7, 0.4 * (1 - difficulty * 0.5)))
      const accelMultiplier = 1.0 + (difficulty * 0.8)
      let eVel = add(e.vel, mul(nor(desired), 90 * dt * accelMultiplier))
      eVel = mul(eVel, 0.993)
      newEnemy.vel = eVel
      newEnemy.pos = wrap(add(e.pos, mul(eVel, dt * animSpeed)), state.w, state.h)
      newEnemy.ang = angleOf(eVel)

      newEnemy.cooldown = e.cooldown - dt
      if (d < 520 && newEnemy.cooldown <= 0) {
        const leadFactor = 0.35 + (difficulty * 0.4)
        const lead = add(state.player.pos, mul(state.player.vel, leadFactor))
        const aim = angleOf(sub(lead, e.pos)) + rand(-aimInaccuracy, aimInaccuracy)
        state.addBullet({
          pos: add(e.pos, fromAngle(aim, 16)),
          vel: add(eVel, fromAngle(aim, BULLET_SPEED_ENEMY)),
          life: BULLET_LIFE_ENEMY,
          friendly: false,
        })
        const cooldownBase = 1.4 - (difficulty * 0.6)
        newEnemy.cooldown = rand(0.5, cooldownBase)
      }
  }

  newEnemy.aiTimer = e.aiTimer + dt
  return newEnemy
}

// ------------------------------------------------------------------ //
//                         Boss Behavior Update (Batched)
// ------------------------------------------------------------------ //

function updateBossBehaviorBatched(
  boss: Boss,
  state: ReturnType<typeof useGameStore.getState>,
  dt: number,
  colors: ThemeColors
): { boss: Boss; bullets: Bullet[] } {
  const bullets: Bullet[] = []
  const stats = BOSS_STATS[boss.type]
  const toP = sub(state.player.pos, boss.pos)

  // Movement pattern based on phase
  const moveSpeed = 60 + boss.phase * 20

  // Sway movement
  const swayX = Math.sin(state.time * 0.5) * 100
  const targetX = state.w / 2 + swayX
  const targetY = 100 + Math.sin(state.time * 0.3) * 30

  // Create new velocity object instead of mutating existing one
  const newVel = {
    x: (targetX - boss.pos.x) * 0.02,
    y: (targetY - boss.pos.y) * 0.02,
  }

  const newPos = add(boss.pos, mul(newVel, dt * moveSpeed))

  // Update cooldowns
  let newCooldown = boss.cooldown - dt
  let newSpecialCooldown = boss.specialCooldown - dt

  // Regular attack pattern
  if (newCooldown <= 0) {
    const attackCount = boss.phase + 2
    const spreadAngle = Math.PI / 6

    for (let i = 0; i < attackCount; i++) {
      const angle = Math.PI / 2 + (i - (attackCount - 1) / 2) * spreadAngle
      bullets.push({
        pos: add(boss.pos, fromAngle(angle, 40)),
        vel: fromAngle(angle, BULLET_SPEED_ENEMY * 0.8),
        life: BULLET_LIFE_ENEMY * 1.5,
        friendly: false,
      })
    }

    newCooldown = 2 - boss.phase * 0.3
  }

  // Special attacks based on boss type and phase
  if (newSpecialCooldown <= 0) {
    switch (boss.type) {
      case 'destroyer':
        // Laser sweep (line of bullets)
        for (let i = 0; i < 12; i++) {
          const angle = Math.PI / 2 + (i - 5.5) * 0.15
          bullets.push({
            pos: add(boss.pos, fromAngle(angle, 50)),
            vel: fromAngle(angle, BULLET_SPEED_ENEMY),
            life: BULLET_LIFE_ENEMY * 2,
            friendly: false,
          })
        }
        break

      case 'carrier':
        // Spawn mini-enemies (limit total enemies to prevent overwhelming player)
        // Note: Enemy spawning handled separately in main update loop
        break

      case 'dreadnought':
        // Circular bullet hell
        for (let i = 0; i < 16; i++) {
          const angle = (i / 16) * Math.PI * 2
          bullets.push({
            pos: add(boss.pos, fromAngle(angle, 45)),
            vel: fromAngle(angle, BULLET_SPEED_ENEMY * 0.7),
            life: BULLET_LIFE_ENEMY * 1.8,
            friendly: false,
          })
        }
        // In phase 3, fire second ring immediately with offset angle (no setTimeout)
        if (boss.phase >= 3) {
          for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2 + Math.PI / 16
            bullets.push({
              pos: add(boss.pos, fromAngle(angle, 45)),
              vel: fromAngle(angle, BULLET_SPEED_ENEMY * 0.6),
              life: BULLET_LIFE_ENEMY * 1.8,
              friendly: false,
            })
          }
        }
        break
    }

    newSpecialCooldown = 5 - boss.phase * 0.5
  }

  return {
    boss: {
      ...boss,
      pos: newPos,
      vel: newVel,
      ang: Math.PI / 2,
      cooldown: newCooldown,
      specialCooldown: newSpecialCooldown,
      aiTimer: boss.aiTimer + dt,
    },
    bullets,
  }
}

// ------------------------------------------------------------------ //
//                         Boss Behavior Update (Original - kept for compatibility)
// ------------------------------------------------------------------ //

function updateBossBehavior(
  boss: Boss,
  state: ReturnType<typeof useGameStore.getState>,
  dt: number,
  colors: ThemeColors
) {
  const stats = BOSS_STATS[boss.type]
  const toP = sub(state.player.pos, boss.pos)

  // Movement pattern based on phase
  const moveSpeed = 60 + boss.phase * 20

  // Sway movement
  const swayX = Math.sin(state.time * 0.5) * 100
  const targetX = state.w / 2 + swayX
  const targetY = 100 + Math.sin(state.time * 0.3) * 30

  // Create new velocity object instead of mutating existing one
  const newVel = {
    x: (targetX - boss.pos.x) * 0.02,
    y: (targetY - boss.pos.y) * 0.02,
  }

  const newPos = add(boss.pos, mul(newVel, dt * moveSpeed))

  // Update cooldowns
  let newCooldown = boss.cooldown - dt
  let newSpecialCooldown = boss.specialCooldown - dt

  // Regular attack pattern
  if (newCooldown <= 0) {
    const attackCount = boss.phase + 2
    const spreadAngle = Math.PI / 6

    for (let i = 0; i < attackCount; i++) {
      const angle = Math.PI / 2 + (i - (attackCount - 1) / 2) * spreadAngle
      state.addBullet({
        pos: add(boss.pos, fromAngle(angle, 40)),
        vel: fromAngle(angle, BULLET_SPEED_ENEMY * 0.8),
        life: BULLET_LIFE_ENEMY * 1.5,
        friendly: false,
      })
    }

    newCooldown = 2 - boss.phase * 0.3
  }

  // Special attacks based on boss type and phase
  if (newSpecialCooldown <= 0) {
    switch (boss.type) {
      case 'destroyer':
        // Laser sweep (line of bullets)
        for (let i = 0; i < 12; i++) {
          const angle = Math.PI / 2 + (i - 5.5) * 0.15
          state.addBullet({
            pos: add(boss.pos, fromAngle(angle, 50)),
            vel: fromAngle(angle, BULLET_SPEED_ENEMY),
            life: BULLET_LIFE_ENEMY * 2,
            friendly: false,
          })
        }
        break

      case 'carrier':
        // Spawn mini-enemies (limit total enemies to prevent overwhelming player)
        const MAX_CARRIER_SPAWNED_ENEMIES = 12
        if (state.enemies.length < MAX_CARRIER_SPAWNED_ENEMIES) {
          const enemiesToSpawn = Math.min(2, MAX_CARRIER_SPAWNED_ENEMIES - state.enemies.length)
          for (let i = 0; i < enemiesToSpawn; i++) {
            state.spawnEnemy('scout')
          }
        }
        break

      case 'dreadnought':
        // Circular bullet hell
        for (let i = 0; i < 16; i++) {
          const angle = (i / 16) * Math.PI * 2
          state.addBullet({
            pos: add(boss.pos, fromAngle(angle, 45)),
            vel: fromAngle(angle, BULLET_SPEED_ENEMY * 0.7),
            life: BULLET_LIFE_ENEMY * 1.8,
            friendly: false,
          })
        }
        // In phase 3, fire second ring immediately with offset angle (no setTimeout)
        if (boss.phase >= 3) {
          for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2 + Math.PI / 16
            state.addBullet({
              pos: add(boss.pos, fromAngle(angle, 45)),
              vel: fromAngle(angle, BULLET_SPEED_ENEMY * 0.6),
              life: BULLET_LIFE_ENEMY * 1.8,
              friendly: false,
            })
          }
        }
        break
    }

    newSpecialCooldown = 5 - boss.phase * 0.5
  }

  state.updateBoss({
    pos: newPos,
    vel: newVel,
    ang: Math.PI / 2,
    cooldown: newCooldown,
    specialCooldown: newSpecialCooldown,
    aiTimer: boss.aiTimer + dt,
  })
}

// ------------------------------------------------------------------ //
//                         Homing Missiles Update (Batched)
// ------------------------------------------------------------------ //

function updateHomingMissilesBatched(
  state: ReturnType<typeof useGameStore.getState>,
  dt: number,
  colors: ThemeColors,
  enemies: Enemy[],
  boss: Boss | null
): {
  missiles: HomingMissile[]
  enemiesToDamage: Map<number, number>
  bossDamage: number
} {
  const missiles = state.homingMissiles
  const updatedMissiles: HomingMissile[] = []
  const enemiesToDamage: Map<number, number> = new Map()
  let bossDamage = 0

  for (const missile of missiles) {
    let newMissile = { ...missile, life: missile.life - dt }

    if (newMissile.life <= 0) continue

    // Find closest target
    let closestDist = Infinity
    let closestTarget: Vec2 | null = null
    let targetIdx: number | null = null

    enemies.forEach((e, idx) => {
      const d = dist2(missile.pos, e.pos)
      if (d < closestDist) {
        closestDist = d
        closestTarget = e.pos
        targetIdx = idx
      }
    })

    // Also consider boss
    if (boss) {
      const d = dist2(missile.pos, boss.pos)
      if (d < closestDist) {
        closestDist = d
        closestTarget = boss.pos
        targetIdx = -1 // -1 indicates boss
      }
    }

    if (closestTarget) {
      // Home towards target
      const toTarget = sub(closestTarget, missile.pos)
      const targetAngle = angleOf(toTarget)
      const currentAngle = angleOf(missile.vel)

      let angleDiff = targetAngle - currentAngle
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2

      const turnSpeed = 5 * dt
      const newAngle = currentAngle + Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnSpeed)
      const speed = len(missile.vel)

      newMissile.vel = fromAngle(newAngle, speed)
      newMissile.targetId = targetIdx
    }

    // Update position
    newMissile.pos = add(missile.pos, mul(newMissile.vel, dt))

    // Check collision with enemies
    let hit = false
    enemies.forEach((e, idx) => {
      if (dist2(newMissile.pos, e.pos) < 20 * 20) {
        enemiesToDamage.set(idx, (enemiesToDamage.get(idx) || 0) + 40)
        hit = true
      }
    })

    // Check collision with boss
    if (boss && dist2(newMissile.pos, boss.pos) < 50 * 50) {
      bossDamage += 40
      hit = true
    }

    if (!hit) {
      updatedMissiles.push(newMissile)
    } else {
      // Create explosion effect using particle pool
      const particles = state.acquireParticles(12)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.pos.x = newMissile.pos.x
        p.pos.y = newMissile.pos.y
        const vel = fromAngle((i / 12) * Math.PI * 2, rand(80, 150))
        p.vel.x = vel.x
        p.vel.y = vel.y
        p.life = rand(0.3, 0.6)
        p.color = colors.particleExplosion
        p.active = true
      }
    }
  }

  return { missiles: updatedMissiles, enemiesToDamage, bossDamage }
}

// ------------------------------------------------------------------ //
//                         Homing Missiles Update (Original - kept for compatibility)
// ------------------------------------------------------------------ //

function updateHomingMissiles(
  state: ReturnType<typeof useGameStore.getState>,
  dt: number,
  colors: ThemeColors
) {
  const missiles = state.homingMissiles
  const enemies = state.enemies
  const boss = state.boss

  const updatedMissiles: HomingMissile[] = []
  const enemiesToDamage: Map<number, number> = new Map()

  for (const missile of missiles) {
    let newMissile = { ...missile, life: missile.life - dt }

    if (newMissile.life <= 0) continue

    // Find closest target
    let closestDist = Infinity
    let closestTarget: Vec2 | null = null
    let targetIdx: number | null = null

    enemies.forEach((e, idx) => {
      const d = dist2(missile.pos, e.pos)
      if (d < closestDist) {
        closestDist = d
        closestTarget = e.pos
        targetIdx = idx
      }
    })

    // Also consider boss
    if (boss) {
      const d = dist2(missile.pos, boss.pos)
      if (d < closestDist) {
        closestDist = d
        closestTarget = boss.pos
        targetIdx = -1 // -1 indicates boss
      }
    }

    if (closestTarget) {
      // Home towards target
      const toTarget = sub(closestTarget, missile.pos)
      const targetAngle = angleOf(toTarget)
      const currentAngle = angleOf(missile.vel)

      let angleDiff = targetAngle - currentAngle
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2

      const turnSpeed = 5 * dt
      const newAngle = currentAngle + Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnSpeed)
      const speed = len(missile.vel)

      newMissile.vel = fromAngle(newAngle, speed)
      newMissile.targetId = targetIdx
    }

    // Update position
    newMissile.pos = add(missile.pos, mul(newMissile.vel, dt))

    // Check collision with enemies
    let hit = false
    enemies.forEach((e, idx) => {
      if (dist2(newMissile.pos, e.pos) < 20 * 20) {
        enemiesToDamage.set(idx, (enemiesToDamage.get(idx) || 0) + 40)
        hit = true
      }
    })

    // Check collision with boss
    if (boss && dist2(newMissile.pos, boss.pos) < 50 * 50) {
      state.damageBoss(40)
      hit = true
    }

    if (!hit) {
      updatedMissiles.push(newMissile)
    } else {
      // Create explosion effect using particle pool
      const particles = state.acquireParticles(12)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.pos.x = newMissile.pos.x
        p.pos.y = newMissile.pos.y
        const vel = fromAngle((i / 12) * Math.PI * 2, rand(80, 150))
        p.vel.x = vel.x
        p.vel.y = vel.y
        p.life = rand(0.3, 0.6)
        p.color = colors.particleExplosion
        p.active = true
      }
    }
  }

  // Apply damage to enemies using Set for proper filtering
  if (enemiesToDamage.size > 0) {
    const deadIndices = new Set<number>()

    // First pass: apply damage and identify dead enemies
    const damagedEnemies = state.enemies.map((enemy, idx) => {
      const damage = enemiesToDamage.get(idx)
      if (!damage) return enemy

      const newHp = enemy.hp - damage
      if (newHp <= 0) {
        deadIndices.add(idx)
        state.addScore(ENEMY_STATS[enemy.type].points)
        state.recordKill()
        return { ...enemy, hp: newHp }
      }
      return { ...enemy, hp: newHp }
    })

    // Second pass: filter out dead enemies
    state.updateEnemies(damagedEnemies.filter((_, idx) => !deadIndices.has(idx)))
  }

  state.updateHomingMissiles(updatedMissiles)
}

// Helper to get power-up particle color from theme
function getPowerUpColor(type: string, colors: ThemeColors): string {
  switch (type) {
    case 'shield': return colors.powerUpShield
    case 'rapid_fire': return colors.powerUpRapidFire
    case 'spread_shot': return colors.powerUpSpreadShot
    case 'magnet': return colors.powerUpMagnet
    default: return colors.particle
  }
}
