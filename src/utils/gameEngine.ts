import { useCallback } from "react"
import type { Particle, Vec2, PowerUp, Enemy, Boss, HomingMissile } from "../types/game"
import type { ThemeColors } from "../theme/types"
import { ENEMY_STATS, BOSS_STATS } from "../types/game"
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
} from "./vectorMath"
import { hapticLight, hapticMedium, hapticHeavy, hapticWarning } from "./haptics"
import { updateEnemyBehavior, updateBossBehavior, updateHomingMissiles } from "./behaviors"

export const useGameEngine = () => {
  const boom = useCallback((pos: Vec2, color: string, count = 24, speed = 120) => {
    const newParticles: Particle[] = []
    for (let i = 0; i < count; i++) {
      newParticles.push({
        pos: { ...pos },
        vel: fromAngle((i / count) * Math.PI * 2, rand(speed * 0.5, speed)),
        life: rand(0.4, 0.9),
        color,
      })
    }
    useGameStore.getState().addParticles(newParticles)
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
    const state = useGameStore.getState()

    // Apply time warp effect
    const effectiveDt = dt * state.timeWarpMultiplier

    state.updateTime(dt) // Real time always progresses

    // Update combo timer
    state.updateCombo(dt)

    // Update active power-ups
    state.updateActivePowerUps(dt)

    // Update screen shake
    state.updateShake(dt)

    // Update special ability
    state.updateSpecialAbility(dt)

    // Check for shield power-up or shield burst ability
    const hasShield = state.hasPowerUp('shield') ||
      (state.specialAbility?.type === 'shield_burst' && state.specialAbility.isActive)
    const hasMagnet = state.hasPowerUp('magnet')

    // Progressive difficulty scaling (0-100% over 4 minutes)
    const difficultyProgress = Math.min(state.time / 240, 1.0)

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

    const hasRapidFire = state.hasPowerUp('rapid_fire')
    const cooldownRate = hasRapidFire ? 2 : 1 // Cooldown reduces faster with rapid fire
    const newCooldown = Math.max(0, state.player.cooldown - dt * cooldownRate)
    const newInv = Math.max(0, state.player.inv - dt)

    state.updatePlayer({
      pos: newPos,
      vel: newVel,
      cooldown: newCooldown,
      inv: newInv,
    })

    // Fire weapon
    if (wantsFire && newCooldown <= 0) {
      const currentState = useGameStore.getState()
      if (currentState.player.cooldown <= 0) {
        const hasSpreadShot = currentState.hasPowerUp('spread_shot')
        const cooldown = hasRapidFire ? FIRE_COOLDOWN_RAPID : FIRE_COOLDOWN_PLAYER

        if (hasSpreadShot) {
          const spreadAngles = [-0.2, 0, 0.2]
          spreadAngles.forEach((offset) => {
            state.addBullet({
              pos: add(currentState.player.pos, fromAngle(currentState.player.ang + offset, 18)),
              vel: add(currentState.player.vel, fromAngle(currentState.player.ang + offset, BULLET_SPEED_PLAYER)),
              life: BULLET_LIFE_PLAYER,
              friendly: true,
            })
          })
        } else {
          state.addBullet({
            pos: add(currentState.player.pos, fromAngle(currentState.player.ang, 18)),
            vel: add(currentState.player.vel, fromAngle(currentState.player.ang, BULLET_SPEED_PLAYER)),
            life: BULLET_LIFE_PLAYER,
            friendly: true,
          })
        }

        state.updatePlayer({ cooldown })
        hapticLight()
      }
    }

    // Update bullets
    const newBullets = state.bullets
      .map((b) => ({
        ...b,
        pos: wrap(add(b.pos, mul(b.vel, effectiveDt)), state.w, state.h),
        life: b.life - effectiveDt,
      }))
      .filter((b) => b.life > 0)
    state.updateBullets(newBullets)

    // Update asteroids (with increasing animation speed)
    const newAsteroids = state.asteroids.map((a) => ({
      ...a,
      pos: wrap(add(a.pos, mul(a.vel, effectiveDt * animSpeedMultiplier)), state.w, state.h),
      ang: a.ang + a.spin * effectiveDt * animSpeedMultiplier,
    }))
    state.updateAsteroids(newAsteroids)

    // Update enemies (AI with progressive difficulty and type-specific behaviors)
    const newEnemies = state.enemies.map((e) => {
      // Handle stun duration
      if (e.stunDuration && e.stunDuration > 0) {
        const newStunDuration = e.stunDuration - effectiveDt
        // Stunned enemies don't move or shoot
        if (newStunDuration > 0) {
          return { ...e, stunDuration: newStunDuration }
        }
        // Stun expired, clear it and continue normal behavior
        return updateEnemyBehavior({ ...e, stunDuration: undefined }, state, effectiveDt, difficultyProgress, aimInaccuracy, animSpeedMultiplier)
      }
      return updateEnemyBehavior(e, state, effectiveDt, difficultyProgress, aimInaccuracy, animSpeedMultiplier)
    })
    state.updateEnemies(newEnemies)

    // Update boss
    if (state.boss) {
      updateBossBehavior(state.boss, state, effectiveDt, themeColors)
    }

    // Handle boss warning - spawn boss after warning time has elapsed
    if (state.bossWarning && !state.boss && state.bossWarningStartTime !== undefined) {
      const warningElapsed = state.time - state.bossWarningStartTime
      if (warningElapsed >= BOSS_WARNING_TIME) {
        state.spawnBoss()
      }
    }

    // Update power-ups (lifetime countdown and magnet attraction)
    const updatedPowerUps = state.powerUps
      .map((p) => {
        let newPowerUp = { ...p, lifetime: p.lifetime - effectiveDt }

        // Magnet power-up attracts nearby power-ups
        if (hasMagnet) {
          const toPlayer = sub(state.player.pos, p.pos)
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
    state.updatePowerUps(updatedPowerUps)

    // Update homing missiles
    if (state.homingMissiles.length > 0) {
      updateHomingMissiles(state, effectiveDt, themeColors)
    }

    // Update particles
    const newParticles = state.particles
      .map((p) => ({
        ...p,
        pos: wrap(add(p.pos, mul(p.vel, effectiveDt)), state.w, state.h),
        vel: mul(p.vel, 0.98),
        life: p.life - effectiveDt,
      }))
      .filter((p) => p.life > 0)
    state.updateParticles(newParticles)

    // Collisions - bullets vs asteroids
    const bulletsToRemove = new Set<number>()
    const asteroidsToRemove = new Set<number>()
    const enemiesToRemove = new Set<number>()
    const enemyDamage = new Map<number, number>()
    const enemyDeathEffects: Array<{ pos: Vec2; type: string; dropPowerUp: boolean }> = []

    state.bullets.forEach((b, bIdx) => {
      if (!b.friendly) return // Skip enemy bullets for asteroid collision

      state.asteroids.forEach((a, aIdx) => {
        if (!bulletsToRemove.has(bIdx) && !asteroidsToRemove.has(aIdx)) {
          if (dist2(b.pos, a.pos) < (a.radius + 2) * (a.radius + 2)) {
            boom(b.pos, themeColors.particleHit, 12, 180)
            state.splitAsteroid(a)
            asteroidsToRemove.add(aIdx)
            bulletsToRemove.add(bIdx)
            state.incrementCombo()
            state.addScore(20 * a.tier)
            state.addCredits(a.tier)
            state.triggerShake(3, 100)
            hapticMedium()

            // Chance to drop power-up from large asteroids
            if (a.tier === 3 && Math.random() < POWERUP_DROP_ASTEROID) {
              state.spawnPowerUp(a.pos)
            }
            state.recordShot(true) // Record shot hit
          }
        }
      })

      // Bullets vs enemies - collect damage to apply after iteration
      state.enemies.forEach((e, eIdx) => {
        if (b.friendly && !bulletsToRemove.has(bIdx) && !enemiesToRemove.has(eIdx)) {
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
              state.incrementCombo()
              state.recordKill()
              state.addScore(ENEMY_STATS[e.type].points)
              state.addCredits(Math.floor(ENEMY_STATS[e.type].points / 10))
              state.triggerShake(8, 200)
              hapticHeavy()
            } else {
              // Enemy damaged - track damage to apply
              enemyDamage.set(eIdx, (enemyDamage.get(eIdx) || 0) + damage)
              boom(b.pos, themeColors.particleExplosion, 10, 160)
            }

            bulletsToRemove.add(bIdx)
            state.recordShot(true) // Record shot hit
          }
        }
      })

      // Bullets vs boss
      if (state.boss && b.friendly && !bulletsToRemove.has(bIdx)) {
        const bossHitRadius = 50
        if (dist2(b.pos, state.boss.pos) < bossHitRadius * bossHitRadius) {
          // Store boss position before potentially defeating it
          const bossPos = { ...state.boss.pos }
          state.damageBoss(25)
          bulletsToRemove.add(bIdx)
          boom(b.pos, themeColors.particleExplosion, 8, 140)
          state.triggerShake(5, 100)

          state.recordShot(true) // Record shot hit

          // Check boss death using fresh state
          const updatedState = useGameStore.getState()
          if (updatedState.boss && updatedState.boss.hp <= 0) {
            boom(bossPos, themeColors.particleExplosion, 60, 300)
            state.defeatBoss()
            state.triggerShake(20, 500)
            hapticHeavy()
          }
        }
      }
    })

    // Enemy bullets vs player
    state.bullets.forEach((b, bIdx) => {
      if (!b.friendly && dist2(b.pos, state.player.pos) < 16 * 16) {
        if (state.player.inv <= 0 && !hasShield) {
          state.updatePlayer({ hp: state.player.hp - 18, inv: 0.6 })
          state.recordDamage()
          state.triggerShake(10, 150)
          hapticWarning()
        }
        bulletsToRemove.add(bIdx)
        boom(b.pos, themeColors.particleDamage, 8, 140)
      }
    })

    // Remove hit bullets and asteroids
    if (bulletsToRemove.size > 0) {
      state.updateBullets(state.bullets.filter((_, i) => !bulletsToRemove.has(i)))
    }
    if (asteroidsToRemove.size > 0) {
      state.updateAsteroids(state.asteroids.filter((_, i) => !asteroidsToRemove.has(i)))
    }

    // Apply enemy damage and removals (deferred to avoid race conditions)
    if (enemyDamage.size > 0 || enemiesToRemove.size > 0) {
      const updatedEnemies = state.enemies
        .map((e, idx) => {
          if (enemiesToRemove.has(idx)) return null
          const dmg = enemyDamage.get(idx)
          if (dmg) return { ...e, hp: e.hp - dmg }
          return e
        })
        .filter((e): e is Enemy => e !== null)
      state.updateEnemies(updatedEnemies)
    }

    // Spawn power-ups from defeated enemies
    for (const effect of enemyDeathEffects) {
      if (effect.dropPowerUp) {
        state.spawnPowerUp(effect.pos)
      }
    }

    // Player collisions with asteroids
    state.asteroids.forEach((a) => {
      if (dist2(state.player.pos, a.pos) < (a.radius + 12) * (a.radius + 12)) {
        if (state.player.inv <= 0 && !hasShield) {
          state.updatePlayer({ hp: state.player.hp - 28, inv: 1.0 })
          state.recordDamage()
          boom(state.player.pos, themeColors.particleCollision, 18, 200)
          state.triggerShake(12, 200)
          hapticWarning()
        }
      }
    })

    // Player collisions with enemies
    state.enemies.forEach((e) => {
      if (dist2(state.player.pos, e.pos) < 22 * 22) {
        if (state.player.inv <= 0 && !hasShield) {
          state.updatePlayer({ hp: state.player.hp - 20, inv: 0.9 })
          state.recordDamage()
          boom(state.player.pos, themeColors.particleCollision, 18, 200)
          state.triggerShake(12, 200)
          hapticWarning()
        }
      }
    })

    // Player collision with boss
    if (state.boss) {
      if (dist2(state.player.pos, state.boss.pos) < 60 * 60) {
        if (state.player.inv <= 0 && !hasShield) {
          state.updatePlayer({ hp: state.player.hp - 40, inv: 1.5 })
          state.recordDamage()
          boom(state.player.pos, themeColors.particleCollision, 24, 250)
          state.triggerShake(15, 300)
          hapticWarning()
        }
      }
    }

    // Player collisions with power-ups
    state.powerUps.forEach((p, pIdx) => {
      if (dist2(state.player.pos, p.pos) < 30 * 30) {
        state.collectPowerUp(pIdx)
        boom(p.pos, getPowerUpColor(p.type, themeColors), 16, 100)
      }
    })

    // Wave progression
    if (state.asteroids.length === 0 && !state.boss && !state.bossWarning) {
      state.nextWave()
      // state.wave is now incremented, so use it directly (4 + wave = 5 asteroids on wave 1)
      state.spawnAsteroids(4 + state.wave)

      // Spawn enemies on even waves
      if (state.wave % 2 === 0) {
        state.spawnEnemyWave()
      }
    }

    // Check player death
    if (state.player.hp <= 0) {
      state.loseLife()
      state.triggerShake(15, 400)
    }
  }, [boom])

  return {
    updateGame,
    fireOnce,
  }
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
