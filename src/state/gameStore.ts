import { create } from "zustand"
import type {
  GameState,
  Asteroid,
  Enemy,
  EnemyType,
  Particle,
  Bullet,
  PowerUp,
  PowerUpType,
  ActivePowerUp,
  ComboState,
  ScreenShake,
  Boss,
  BossType,
  ShipType,
  AbilityType,
  SpecialAbility,
  HomingMissile,
  WeaponUpgrades,
} from "../types/game"
import { ENEMY_STATS, BOSS_STATS, SHIP_STATS, ABILITY_STATS } from "../types/game"
import { v, add, fromAngle, rand } from "../utils/vectorMath"

// ------------------------------------------------------------------ //
//                Gameplay tuning (feel free to tweak)
// ------------------------------------------------------------------ //
export const MAX_DT = 0.033
export const PLAYER_ACCEL = 180
export const PLAYER_TURN_SPEED = 5.5
export const PLAYER_FRICTION = 0.996
export const PLAYER_INV_TIME_HIT = 1.0
export const PLAYER_INV_TIME_SPAWN = 1.2

export const BULLET_SPEED_PLAYER = 420
export const BULLET_SPEED_ENEMY = 360
export const BULLET_LIFE_PLAYER = 0.8
export const BULLET_LIFE_ENEMY = 1.0
export const FIRE_COOLDOWN_PLAYER = 0.16
export const FIRE_COOLDOWN_RAPID = 0.08

export const ASTEROID_BASE_RADIUS = 48
export const STARFIELD_DOTS = 40

export const JOY_MAX_RADIUS = 60
export const JOY_DEADZONE = 0.1

export const CANVAS_DRAG_MAX_RADIUS = 100
export const SWIPE_MIN_DIST = 40
export const SWIPE_MAX_TIME = 300
export const SWIPE_IMPULSE = 260

export const TAP_MAX_DIST = 12
export const TAP_MAX_TIME = 220

// Power-up constants
export const POWERUP_LIFETIME = 10        // Seconds before despawn
export const POWERUP_DURATION = 8         // Active effect duration
export const POWERUP_DROP_ENEMY = 0.25    // 25% drop chance from enemies
export const POWERUP_DROP_ASTEROID = 0.05 // 5% drop chance from large asteroids

// Combo constants
export const COMBO_TIMEOUT = 2.0          // Seconds before combo resets
export const COMBO_MULTIPLIERS = [1, 1.5, 2, 2.5, 3]

// Boss constants
export const BOSS_WAVE_INTERVAL = 5       // Boss every 5 waves
export const BOSS_WARNING_TIME = 3        // Warning duration before boss spawns

// Particle pooling constants
export const PARTICLE_POOL_SIZE = 500

// Pooled particle with active flag
interface PooledParticle extends Particle {
  active: boolean
}

// Enemy spawn weights by wave
export const getEnemySpawnWeights = (wave: number): Record<EnemyType, number> => ({
  scout: 40,
  tank: wave >= 3 ? 20 : 0,
  sniper: wave >= 5 ? 15 : 0,
  bomber: wave >= 7 ? 15 : 0,
})

interface GameStore extends GameState {
  // Particle pool
  particlePool: PooledParticle[]
  particlePoolIndex: number  // Circular buffer index for next particle allocation
  // Actions
  setPaused: (paused: boolean) => void
  setDimensions: (w: number, h: number) => void
  updateTime: (dt: number) => void
  addScore: (points: number) => void
  addCredits: (amount: number) => void
  nextWave: () => void
  loseLife: () => void
  resetGame: () => void
  spawnAsteroids: (count: number) => void
  splitAsteroid: (asteroid: Asteroid) => void
  spawnEnemy: (type?: EnemyType) => void
  spawnEnemyWave: () => void
  addBullet: (bullet: Bullet) => void
  addParticles: (particles: Particle[]) => void
  removeBullet: (index: number) => void
  removeAsteroid: (index: number) => void
  removeEnemy: (index: number) => void
  updatePlayer: (update: Partial<GameState["player"]>) => void
  updateBullets: (bullets: Bullet[]) => void
  updateAsteroids: (asteroids: Asteroid[]) => void
  updateEnemies: (enemies: Enemy[]) => void
  updateParticles: (particles: Particle[]) => void

  // Power-up actions
  spawnPowerUp: (pos: { x: number; y: number }, type?: PowerUpType) => void
  collectPowerUp: (index: number) => void
  updatePowerUps: (powerUps: PowerUp[]) => void
  updateActivePowerUps: (dt: number) => void
  hasPowerUp: (type: PowerUpType) => boolean

  // Combo actions
  incrementCombo: () => void
  resetCombo: () => void
  updateCombo: (dt: number) => void
  getComboMultiplier: () => number

  // Screen shake actions
  triggerShake: (intensity: number, duration: number) => void
  updateShake: (dt: number) => void
  getShakeOffset: () => { x: number; y: number }

  // Boss actions
  spawnBoss: (type?: BossType) => void
  updateBoss: (update: Partial<Boss>) => void
  damageBoss: (damage: number) => void
  defeatBoss: () => void
  setBossWarning: (active: boolean) => void

  // Ship selection
  setShipType: (type: ShipType) => void

  // Special abilities
  activateSpecialAbility: () => void
  updateSpecialAbility: (dt: number) => void
  setTimeWarp: (active: boolean, multiplier?: number) => void

  // Homing missiles
  spawnHomingMissiles: (count: number) => void
  updateHomingMissiles: (missiles: HomingMissile[]) => void

  // Session tracking
  recordDamage: () => void
  recordKill: () => void
  recordShot: (hit: boolean) => void
  resetWaveTracking: () => void

  // EMP blast
  stunAllEnemies: (duration: number) => void

  // Particle pooling methods
  acquireParticles: (count: number) => PooledParticle[]
  releaseParticle: (particle: PooledParticle) => void
  updatePooledParticles: (dt: number) => void
}

const initialCombo: ComboState = {
  count: 0,
  multiplier: 1,
  timer: 0,
}

const getInitialPlayer = (w: number, h: number, shipType: ShipType = 'fighter') => ({
  pos: v(w / 2, h / 2),
  vel: v(),
  ang: -Math.PI / 2,
  cooldown: 0,
  hp: SHIP_STATS[shipType].hull,
  inv: PLAYER_INV_TIME_SPAWN,
  shipType,
  specialCooldown: 0,
  specialReady: true,
})

// Initialize particle pool with pre-allocated objects
const createParticlePool = (): PooledParticle[] => {
  const pool: PooledParticle[] = []
  for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
    pool.push({
      pos: { x: 0, y: 0 },
      vel: { x: 0, y: 0 },
      life: 0,
      color: '',
      active: false,
    })
  }
  return pool
}

export const useGameStore = create<GameStore>((set, get) => ({
  w: 800,
  h: 600,
  time: 0,
  paused: false,
  score: 0,
  credits: 0,
  lives: 3,
  wave: 1,
  player: getInitialPlayer(400, 300),
  bullets: [],
  particles: [],
  asteroids: [],
  enemies: [],

  // Boss system
  boss: null,
  bossWarning: false,
  bossWarningStartTime: undefined as number | undefined,

  // Power-ups
  powerUps: [],
  activePowerUps: [],

  // Combo
  combo: { ...initialCombo },

  // Screen effects
  screenShake: null,
  timeWarpActive: false,
  timeWarpMultiplier: 1,

  // Special abilities
  specialAbility: null,
  homingMissiles: [],

  // Session tracking
  sessionDamageTaken: false,
  sessionKillsRecent: 0,
  sessionKillTimer: 0,
  sessionShotsFired: 0,
  sessionShotsHit: 0,
  sessionLastShotTime: 0,

  // Particle pool
  particlePool: createParticlePool(),
  particlePoolIndex: 0,

  setPaused: (paused) => set({ paused }),

  setDimensions: (w, h) => set({ w, h }),

  updateTime: (dt) => set((state) => ({
    time: state.time + dt,
    sessionKillTimer: state.sessionKillTimer > 0 ? state.sessionKillTimer - dt : 0,
    sessionKillsRecent: state.sessionKillTimer <= 0 ? 0 : state.sessionKillsRecent,
  })),

  addScore: (points) =>
    set((state) => {
      const multiplier = state.combo.multiplier
      return { score: state.score + Math.floor(points * multiplier) }
    }),

  addCredits: (amount) =>
    set((state) => ({ credits: state.credits + amount })),

  nextWave: () =>
    set((state) => {
      const nextWave = state.wave + 1
      const isBossWave = nextWave % BOSS_WAVE_INTERVAL === 0
      return {
        wave: nextWave,
        bossWarning: isBossWave,
        bossWarningStartTime: isBossWave ? state.time : undefined,
        sessionDamageTaken: false, // Reset for new wave
      }
    }),

  loseLife: () =>
    set((state) => {
      const newLives = state.lives - 1
      if (newLives <= 0) {
        return {
          lives: newLives,
          paused: true,
          activePowerUps: [],
          combo: { ...initialCombo },
          timeWarpActive: false,
          timeWarpMultiplier: 1,
        }
      }
      return {
        lives: newLives,
        player: {
          ...state.player,
          pos: v(state.w / 2, state.h / 2),
          vel: v(),
          hp: SHIP_STATS[state.player.shipType].hull,
          inv: 2,
        },
        activePowerUps: [],
        combo: { ...initialCombo },
        timeWarpActive: false,
        timeWarpMultiplier: 1,
      }
    }),

  resetGame: () =>
    set((state) => {
      // Reset all particles in the pool to inactive
      for (let i = 0; i < state.particlePool.length; i++) {
        state.particlePool[i].active = false
        state.particlePool[i].life = 0
      }

      return {
        time: 0,
        paused: false,
        score: 0,
        lives: 3,
        wave: 1,
        player: getInitialPlayer(state.w, state.h, state.player.shipType),
        bullets: [],
        particles: [],
        asteroids: [],
        enemies: [],
        boss: null,
        bossWarning: false,
        bossWarningStartTime: undefined,
        powerUps: [],
        activePowerUps: [],
        combo: { ...initialCombo },
        screenShake: null,
        timeWarpActive: false,
        timeWarpMultiplier: 1,
        specialAbility: null,
        homingMissiles: [],
        sessionDamageTaken: false,
        sessionKillsRecent: 0,
        sessionKillTimer: 0,
        sessionShotsFired: 0,
        sessionShotsHit: 0,
        sessionLastShotTime: 0,
        particlePoolIndex: 0,
      }
    }),

  spawnAsteroids: (count) =>
    set((state) => {
      const newAsteroids: Asteroid[] = []
      for (let i = 0; i < count; i++) {
        const side = Math.floor(Math.random() * 4)
        const pos = v(
          side === 0 ? 0 : side === 2 ? state.w : rand(0, state.w),
          side === 1 ? 0 : side === 3 ? state.h : rand(0, state.h)
        )
        const vel = fromAngle(rand(0, Math.PI * 2), rand(20, 50))
        newAsteroids.push({
          pos,
          vel,
          radius: ASTEROID_BASE_RADIUS,
          spin: rand(-1, 1),
          ang: rand(0, Math.PI * 2),
          tier: 3,
        })
      }
      return { asteroids: [...state.asteroids, ...newAsteroids] }
    }),

  splitAsteroid: (a) =>
    set((state) => {
      if (a.tier > 1) {
        const newTier = (a.tier - 1) as 1 | 2
        const newAsteroids: Asteroid[] = []
        for (let i = 0; i < 2; i++) {
          const vel = add(a.vel, fromAngle(rand(0, Math.PI * 2), rand(30, 60)))
          newAsteroids.push({
            pos: { ...a.pos },
            vel,
            radius: a.radius * 0.65,
            spin: rand(-2, 2),
            ang: rand(0, Math.PI * 2),
            tier: newTier,
          })
        }
        return { asteroids: [...state.asteroids, ...newAsteroids] }
      }
      return state
    }),

  spawnEnemy: (type) =>
    set((state) => {
      // Select enemy type based on weights if not specified
      let enemyType: EnemyType = type ?? 'scout'
      if (!type) {
        const weights = getEnemySpawnWeights(state.wave)
        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)
        let random = Math.random() * totalWeight
        for (const [t, weight] of Object.entries(weights)) {
          random -= weight
          if (random <= 0) {
            enemyType = t as EnemyType
            break
          }
        }
      }

      const stats = ENEMY_STATS[enemyType]
      const SAFE_SPAWN_DISTANCE = 150 // Minimum distance from player

      // Generate position that's away from the player
      let pos = v(rand(0, state.w), rand(0, state.h))
      let attempts = 0
      const maxAttempts = 10

      while (attempts < maxAttempts) {
        const dx = pos.x - state.player.pos.x
        const dy = pos.y - state.player.pos.y
        const distSq = dx * dx + dy * dy

        if (distSq >= SAFE_SPAWN_DISTANCE * SAFE_SPAWN_DISTANCE) {
          break // Found safe position
        }

        // Try spawning from screen edges instead
        const side = Math.floor(Math.random() * 4)
        pos = v(
          side === 0 ? rand(0, 50) : side === 2 ? state.w - rand(0, 50) : rand(0, state.w),
          side === 1 ? rand(0, 50) : side === 3 ? state.h - rand(0, 50) : rand(0, state.h)
        )
        attempts++
      }

      const vel = fromAngle(rand(0, Math.PI * 2), rand(10, 40))

      const newEnemy: Enemy = {
        pos,
        vel,
        ang: rand(0, Math.PI * 2),
        cooldown: rand(0.5, 1.5),
        hp: stats.hp,
        maxHp: stats.hp,
        aiTimer: 0,
        type: enemyType,
        chargeTime: enemyType === 'sniper' ? 0 : undefined,
        bombCooldown: enemyType === 'bomber' ? 3 : undefined,
      }
      return { enemies: [...state.enemies, newEnemy] }
    }),

  spawnEnemyWave: () =>
    set((state) => {
      const enemyCount = Math.min(2 + Math.floor(state.wave / 2), 6)
      const newEnemies: Enemy[] = []

      for (let i = 0; i < enemyCount; i++) {
        const weights = getEnemySpawnWeights(state.wave)
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
        const pos = v(rand(0, state.w), rand(0, state.h))
        const vel = fromAngle(rand(0, Math.PI * 2), rand(10, 40))

        newEnemies.push({
          pos,
          vel,
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

      return { enemies: [...state.enemies, ...newEnemies] }
    }),

  addBullet: (bullet) =>
    set((state) => ({
      bullets: [...state.bullets, bullet],
      sessionShotsFired: bullet.friendly ? state.sessionShotsFired + 1 : state.sessionShotsFired,
      sessionLastShotTime: bullet.friendly ? state.time : state.sessionLastShotTime,
    })),

  addParticles: (particles) =>
    set((state) => ({ particles: [...state.particles, ...particles] })),

  removeBullet: (index) =>
    set((state) => ({
      bullets: state.bullets.filter((_, i) => i !== index),
    })),

  removeAsteroid: (index) =>
    set((state) => ({
      asteroids: state.asteroids.filter((_, i) => i !== index),
    })),

  removeEnemy: (index) =>
    set((state) => ({
      enemies: state.enemies.filter((_, i) => i !== index),
    })),

  updatePlayer: (update) =>
    set((state) => ({
      player: { ...state.player, ...update },
    })),

  updateBullets: (bullets) => set({ bullets }),

  updateAsteroids: (asteroids) => set({ asteroids }),

  updateEnemies: (enemies) => set({ enemies }),

  updateParticles: (particles) => set({ particles }),

  // ------------------------------------------------------------------ //
  //                         Power-up Actions
  // ------------------------------------------------------------------ //

  spawnPowerUp: (pos, type) =>
    set((state) => {
      const types: PowerUpType[] = ['shield', 'rapid_fire', 'spread_shot', 'magnet']
      const powerUpType = type ?? types[Math.floor(Math.random() * types.length)]
      const newPowerUp: PowerUp = {
        pos: { ...pos },
        type: powerUpType,
        lifetime: POWERUP_LIFETIME,
      }
      return { powerUps: [...state.powerUps, newPowerUp] }
    }),

  collectPowerUp: (index) =>
    set((state) => {
      const powerUp = state.powerUps[index]
      if (!powerUp) return state

      // Check if already have this power-up active - refresh duration
      const existingIndex = state.activePowerUps.findIndex((p) => p.type === powerUp.type)
      let newActivePowerUps: ActivePowerUp[]

      if (existingIndex >= 0) {
        newActivePowerUps = [...state.activePowerUps]
        newActivePowerUps[existingIndex] = {
          type: powerUp.type,
          duration: POWERUP_DURATION,
        }
      } else {
        newActivePowerUps = [
          ...state.activePowerUps,
          { type: powerUp.type, duration: POWERUP_DURATION },
        ]
      }

      return {
        powerUps: state.powerUps.filter((_, i) => i !== index),
        activePowerUps: newActivePowerUps,
      }
    }),

  updatePowerUps: (powerUps) => set({ powerUps }),

  updateActivePowerUps: (dt) =>
    set((state) => ({
      activePowerUps: state.activePowerUps
        .map((p) => ({ ...p, duration: p.duration - dt }))
        .filter((p) => p.duration > 0),
    })),

  hasPowerUp: (type) => {
    return get().activePowerUps.some((p) => p.type === type)
  },

  // ------------------------------------------------------------------ //
  //                         Combo Actions
  // ------------------------------------------------------------------ //

  incrementCombo: () =>
    set((state) => {
      const newCount = state.combo.count + 1
      const multiplierIndex = Math.min(
        Math.floor(newCount / 3),
        COMBO_MULTIPLIERS.length - 1
      )
      return {
        combo: {
          count: newCount,
          multiplier: COMBO_MULTIPLIERS[multiplierIndex],
          timer: COMBO_TIMEOUT,
        },
      }
    }),

  resetCombo: () => set({ combo: { ...initialCombo } }),

  updateCombo: (dt) =>
    set((state) => {
      if (state.combo.timer <= 0) return state
      const newTimer = state.combo.timer - dt
      if (newTimer <= 0) {
        return { combo: { ...initialCombo } }
      }
      return { combo: { ...state.combo, timer: newTimer } }
    }),

  getComboMultiplier: () => get().combo.multiplier,

  // ------------------------------------------------------------------ //
  //                         Screen Shake Actions
  // ------------------------------------------------------------------ //

  triggerShake: (intensity, duration) =>
    set({
      screenShake: {
        intensity,
        duration,
        elapsed: 0,
      },
    }),

  updateShake: (dt) =>
    set((state) => {
      if (!state.screenShake) return state
      const newElapsed = state.screenShake.elapsed + dt
      if (newElapsed >= state.screenShake.duration) {
        return { screenShake: null }
      }
      return {
        screenShake: {
          ...state.screenShake,
          elapsed: newElapsed,
        },
      }
    }),

  getShakeOffset: () => {
    const shake = get().screenShake
    if (!shake) return { x: 0, y: 0 }

    const progress = shake.elapsed / shake.duration
    const decay = 1 - progress
    const intensity = shake.intensity * decay

    return {
      x: (Math.random() - 0.5) * intensity * 2,
      y: (Math.random() - 0.5) * intensity * 2,
    }
  },

  // ------------------------------------------------------------------ //
  //                         Boss Actions
  // ------------------------------------------------------------------ //

  spawnBoss: (type) =>
    set((state) => {
      const bossTypes: BossType[] = ['destroyer', 'carrier', 'dreadnought']
      const waveBasedIndex = Math.min(Math.floor(state.wave / 10), 2)
      const bossType = type ?? bossTypes[waveBasedIndex]
      const stats = BOSS_STATS[bossType]

      const boss: Boss = {
        pos: v(state.w / 2, state.h / 8), // Relative Y position instead of hardcoded
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

      return { boss, bossWarning: false, bossWarningStartTime: undefined }
    }),

  updateBoss: (update) =>
    set((state) => {
      if (!state.boss) return state
      return { boss: { ...state.boss, ...update } }
    }),

  damageBoss: (damage) =>
    set((state) => {
      if (!state.boss) return state
      const newHp = state.boss.hp - damage
      const stats = BOSS_STATS[state.boss.type]

      // Check for phase transition
      const hpPercent = newHp / state.boss.maxHp
      let newPhase = state.boss.phase
      if (stats.phases >= 3 && hpPercent <= 0.33 && state.boss.phase < 3) {
        newPhase = 3
      } else if (stats.phases >= 2 && hpPercent <= 0.66 && state.boss.phase < 2) {
        newPhase = 2
      }

      return {
        boss: {
          ...state.boss,
          hp: newHp,
          phase: newPhase as 1 | 2 | 3,
        },
      }
    }),

  defeatBoss: () =>
    set((state) => {
      if (!state.boss) return state
      const points = BOSS_STATS[state.boss.type].points
      return {
        boss: null,
        score: state.score + points,
        credits: state.credits + Math.floor(points / 10),
      }
    }),

  setBossWarning: (active) => set({ bossWarning: active }),

  // ------------------------------------------------------------------ //
  //                         Ship Selection
  // ------------------------------------------------------------------ //

  setShipType: (type) =>
    set((state) => ({
      player: {
        ...state.player,
        shipType: type,
        hp: SHIP_STATS[type].hull,
      },
    })),

  // ------------------------------------------------------------------ //
  //                         Special Abilities
  // ------------------------------------------------------------------ //

  activateSpecialAbility: () =>
    set((state) => {
      if (!state.player.specialReady) return state

      const shipType = state.player.shipType
      let abilityType: AbilityType

      switch (shipType) {
        case 'fighter': abilityType = 'missile_barrage'; break
        case 'scout': abilityType = 'time_warp'; break
        case 'tank': abilityType = 'shield_burst'; break
        case 'interceptor': abilityType = 'emp_blast'; break
        default: abilityType = 'missile_barrage'
      }

      const stats = ABILITY_STATS[abilityType]

      return {
        player: {
          ...state.player,
          specialReady: false,
          specialCooldown: stats.cooldown,
        },
        specialAbility: {
          type: abilityType,
          cooldown: stats.cooldown,
          maxCooldown: stats.cooldown,
          duration: stats.duration,
          isActive: true,
        },
      }
    }),

  updateSpecialAbility: (dt) =>
    set((state) => {
      // Update player cooldown
      let newCooldown = state.player.specialCooldown - dt
      let specialReady = state.player.specialReady

      if (newCooldown <= 0) {
        newCooldown = 0
        specialReady = true
      }

      // Update active ability
      let ability = state.specialAbility
      if (ability && ability.isActive) {
        if (ability.duration > 0) {
          ability = {
            ...ability,
            duration: ability.duration - dt,
            isActive: ability.duration > dt,
          }
        } else {
          ability = { ...ability, isActive: false }
        }
      }

      return {
        player: {
          ...state.player,
          specialCooldown: newCooldown,
          specialReady,
        },
        specialAbility: ability,
      }
    }),

  setTimeWarp: (active, multiplier = 0.5) =>
    set({
      timeWarpActive: active,
      timeWarpMultiplier: active ? multiplier : 1,
    }),

  // ------------------------------------------------------------------ //
  //                         Homing Missiles
  // ------------------------------------------------------------------ //

  spawnHomingMissiles: (count) =>
    set((state) => {
      const missiles: HomingMissile[] = []
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2
        missiles.push({
          pos: { ...state.player.pos },
          vel: fromAngle(angle, 200),
          life: 3,
          targetId: null,
        })
      }
      return { homingMissiles: [...state.homingMissiles, ...missiles] }
    }),

  updateHomingMissiles: (missiles) => set({ homingMissiles: missiles }),

  // ------------------------------------------------------------------ //
  //                         Session Tracking
  // ------------------------------------------------------------------ //

  recordDamage: () => set({ sessionDamageTaken: true }),

  recordKill: () =>
    set((state) => ({
      sessionKillsRecent: state.sessionKillsRecent + 1,
      sessionKillTimer: 10, // Reset 10 second timer
      // Note: sessionShotsHit is updated when bullets hit targets, not here
    })),

  recordShot: (hit) =>
    set((state) => ({
      sessionShotsHit: hit ? state.sessionShotsHit + 1 : state.sessionShotsHit,
    })),

  resetWaveTracking: () =>
    set({
      sessionDamageTaken: false,
    }),

  // EMP blast - stun all enemies for a duration
  stunAllEnemies: (duration) =>
    set((state) => ({
      enemies: state.enemies.map((e) => ({
        ...e,
        stunDuration: Math.max(e.stunDuration || 0, duration),
      })),
    })),

  // ------------------------------------------------------------------ //
  //                         Particle Pooling
  // ------------------------------------------------------------------ //

  // Acquire particles from the pool using circular buffer
  acquireParticles: (count) => {
    const state = get()
    const pool = state.particlePool
    const maxCount = Math.min(count, PARTICLE_POOL_SIZE)
    const acquired: PooledParticle[] = []

    let currentIndex = state.particlePoolIndex

    // Allocate particles from circular buffer, automatically recycling oldest ones
    for (let i = 0; i < maxCount; i++) {
      acquired.push(pool[currentIndex])
      currentIndex = (currentIndex + 1) % PARTICLE_POOL_SIZE
    }

    // Update the pool index for next allocation
    set({ particlePoolIndex: currentIndex })

    return acquired
  },

  // Release a particle back to the pool
  releaseParticle: (particle) => {
    particle.active = false
    particle.life = 0
  },

  // Update all active pooled particles
  updatePooledParticles: (dt) => {
    const state = get()
    const pool = state.particlePool
    const activeParticles: Particle[] = []

    for (let i = 0; i < pool.length; i++) {
      const p = pool[i]
      if (!p.active) continue

      // Update position
      p.pos.x += p.vel.x * dt
      p.pos.y += p.vel.y * dt
      p.life -= dt

      // Check if particle is still alive
      if (p.life <= 0) {
        p.active = false
      } else {
        // Add to particles array for rendering (still used by GameCanvas)
        activeParticles.push({
          pos: p.pos,
          vel: p.vel,
          life: p.life,
          color: p.color,
        })
      }
    }

    set({ particles: activeParticles })
  },
}))
