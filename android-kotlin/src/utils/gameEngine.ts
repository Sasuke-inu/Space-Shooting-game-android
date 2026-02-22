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
  WAVE_ANNOUNCEMENT_TIME,
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

    // Handle wave announcement - clear after display time has elapsed
    if (state.waveAnnouncement && state.waveAnnouncementStartTime !== undefined) {
      const announcementElapsed = state.time - state.waveAnnouncementStartTime
      if (announcementElapsed >= WAVE_ANNOUNCEMENT_TIME) {
        useGameStore.setState({ waveAnnouncement: false, waveAnnouncementStartTime: undefined })
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

// ------------------------------------------------------------------ //
//                         Enemy Behavior Update
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
//                         Boss Behavior Update
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
//                         Homing Missiles Update
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
      // Create explosion effect
      const newParticles: Particle[] = []
      for (let i = 0; i < 12; i++) {
        newParticles.push({
          pos: { ...newMissile.pos },
          vel: fromAngle((i / 12) * Math.PI * 2, rand(80, 150)),
          life: rand(0.3, 0.6),
          color: colors.particleExplosion,
        })
      }
      state.addParticles(newParticles)
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
