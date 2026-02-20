import type { Enemy, Vec2 } from "../../types/game"
import { ENEMY_STATS } from "../../types/game"
import { useGameStore, BULLET_SPEED_ENEMY, BULLET_LIFE_ENEMY } from "../../state/gameStore"
import { add, mul, wrap, sub, len, nor, fromAngle, angleOf, rand } from "../vectorMath"

export function updateEnemyBehavior(
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

    case 'teleporter':
      // Moderate speed movement toward player, periodically teleports to random location
      const teleporterDesired = dir
      let teleporterVel = add(e.vel, mul(teleporterDesired, stats.speed * dt))
      teleporterVel = mul(teleporterVel, 0.99)
      newEnemy.vel = teleporterVel
      newEnemy.pos = wrap(add(e.pos, mul(teleporterVel, dt * animSpeed)), state.w, state.h)
      newEnemy.ang = angleOf(toP)

      // Teleport timer
      newEnemy.teleportTimer = (e.teleportTimer || rand(3, 5)) - dt
      if (newEnemy.teleportTimer <= 0) {
        // Teleport to random location
        newEnemy.pos = {
          x: rand(50, state.w - 50),
          y: rand(50, state.h - 50),
        }
        newEnemy.vel = { x: 0, y: 0 }
        newEnemy.teleportTimer = rand(3, 5)
      }

      // Fire at player with moderate accuracy
      newEnemy.cooldown = e.cooldown - dt
      if (d < 500 && newEnemy.cooldown <= 0) {
        const aim = angleOf(sub(state.player.pos, e.pos)) + rand(-aimInaccuracy, aimInaccuracy)
        state.addBullet({
          pos: add(e.pos, fromAngle(aim, 16)),
          vel: fromAngle(aim, BULLET_SPEED_ENEMY),
          life: BULLET_LIFE_ENEMY,
          friendly: false,
        })
        newEnemy.cooldown = stats.fireRate * (1 - difficulty * 0.25)
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
