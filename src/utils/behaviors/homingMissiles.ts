import type { HomingMissile, Particle } from "../../types/game"
import type { ThemeColors } from "../../theme/types"
import { ENEMY_STATS } from "../../types/game"
import { useGameStore } from "../../state/gameStore"
import { add, mul, sub, angleOf, len, fromAngle, dist2, rand } from "../vectorMath"

export function updateHomingMissiles(
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
    let closestTarget: { x: number; y: number } | null = null
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
