import type { Boss } from "../../types/game"
import type { ThemeColors } from "../../theme/types"
import { BOSS_STATS } from "../../types/game"
import { useGameStore, BULLET_SPEED_ENEMY, BULLET_LIFE_ENEMY } from "../../state/gameStore"
import { add, mul, sub, fromAngle } from "../vectorMath"

export function updateBossBehavior(
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
