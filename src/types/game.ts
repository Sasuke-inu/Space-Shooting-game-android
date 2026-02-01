// ------------------------------------------------------------------ //
//                         Game Types
// ------------------------------------------------------------------ //

/** 2D vector type */
export type Vec2 = { x: number; y: number }



export interface Bullet {
  pos: Vec2
  vel: Vec2
  life: number
  friendly: boolean
  damage?: number  // For weapon upgrades
}

export interface Particle {
  pos: Vec2
  vel: Vec2
  life: number
  color: string
}

export interface Asteroid {
  pos: Vec2
  vel: Vec2
  radius: number
  spin: number
  ang: number
  tier: 1 | 2 | 3
}

// ------------------------------------------------------------------ //
//                         Game Mode Types
// ------------------------------------------------------------------ //

export type GameMode = 'campaign' | 'endless'

export const GAME_MODE_CONFIG: Record<GameMode, { name: string; description: string; hasLives: boolean }> = {
  campaign: { name: 'Campaign', description: 'Wave-based gameplay with lives', hasLives: true },
  endless: { name: 'Endless Survival', description: 'Survive as long as possible', hasLives: false },
}

// ------------------------------------------------------------------ //
//                         Enemy Types
// ------------------------------------------------------------------ //

export type EnemyType = 'scout' | 'tank' | 'sniper' | 'bomber' | 'teleporter'

export interface Enemy {
  pos: Vec2
  vel: Vec2
  ang: number
  cooldown: number
  hp: number
  maxHp: number
  aiTimer: number
  type: EnemyType
  // Type-specific properties
  chargeTime?: number    // Sniper charge time
  bombCooldown?: number  // Bomber bomb cooldown
  stunDuration?: number  // EMP stun duration remaining
  teleportTimer?: number // Teleporter teleport cooldown
}

export const ENEMY_STATS: Record<EnemyType, { hp: number; speed: number; damage: number; fireRate: number; points: number }> = {
  scout: { hp: 30, speed: 180, damage: 10, fireRate: 1.2, points: 75 },
  tank: { hp: 150, speed: 60, damage: 25, fireRate: 2.0, points: 200 },
  sniper: { hp: 50, speed: 40, damage: 35, fireRate: 3.0, points: 150 },
  bomber: { hp: 80, speed: 100, damage: 15, fireRate: 1.5, points: 125 },
  teleporter: { hp: 60, speed: 120, damage: 15, fireRate: 1.8, points: 150 },
}

// ------------------------------------------------------------------ //
//                         Boss Types
// ------------------------------------------------------------------ //

export type BossType = 'destroyer' | 'carrier' | 'dreadnought'
export type BossPhase = 1 | 2 | 3

export interface Boss {
  pos: Vec2
  vel: Vec2
  ang: number
  hp: number
  maxHp: number
  type: BossType
  phase: BossPhase
  cooldown: number
  specialCooldown: number
  aiTimer: number
  isActive: boolean
  stunDuration?: number  // EMP stun duration remaining
  chargingSpecial?: boolean
  specialChargeTime?: number
  spawnedEnemiesCount?: number
}

export const BOSS_STATS: Record<BossType, { hp: number; phases: number; points: number }> = {
  destroyer: { hp: 500, phases: 2, points: 1000 },
  carrier: { hp: 750, phases: 3, points: 1500 },
  dreadnought: { hp: 1000, phases: 3, points: 2500 },
}

// ------------------------------------------------------------------ //
//                         Ship Types
// ------------------------------------------------------------------ //

export type ShipType = 'fighter' | 'scout' | 'tank' | 'interceptor'

export interface ShipStats {
  speed: number       // Movement multiplier
  fireRate: number    // Fire rate multiplier
  damage: number      // Damage multiplier
  hull: number        // Max HP
  special: string     // Special ability name
}

export const SHIP_STATS: Record<ShipType, ShipStats> = {
  fighter: { speed: 1.0, fireRate: 1.0, damage: 1.0, hull: 100, special: 'Missile Barrage' },
  scout: { speed: 1.4, fireRate: 1.2, damage: 0.8, hull: 70, special: 'Time Warp' },
  tank: { speed: 0.7, fireRate: 0.8, damage: 1.5, hull: 150, special: 'Shield Burst' },
  interceptor: { speed: 1.2, fireRate: 1.5, damage: 0.9, hull: 80, special: 'EMP Blast' },
}

export interface Player {
  pos: Vec2
  vel: Vec2
  ang: number
  cooldown: number
  hp: number
  inv: number
  shipType: ShipType
  specialCooldown: number
  specialReady: boolean
}

// ------------------------------------------------------------------ //
//                         Ship Skins
// ------------------------------------------------------------------ //

export type SkinId = 'default' | 'stealth' | 'neon' | 'gold' | 'veteran'

export interface ShipSkin {
  id: SkinId
  name: string
  description: string
  colors: {
    primary: string     // Main ship outline color
    secondary: string   // Accent/detail color
    fill: string        // Ship fill color
    glow?: string       // Optional glow effect color
  }
  achievementRequired?: string  // Optional achievement ID required to unlock
}

export const SHIP_SKINS: Record<ShipType, Record<SkinId, ShipSkin>> = {
  fighter: {
    default: {
      id: 'default',
      name: 'Standard',
      description: 'Classic fighter colors',
      colors: { primary: '#00ffff', secondary: '#ffffff', fill: '#004444' },
    },
    stealth: {
      id: 'stealth',
      name: 'Stealth',
      description: 'Dark ops paint scheme',
      colors: { primary: '#333333', secondary: '#666666', fill: '#111111' },
    },
    neon: {
      id: 'neon',
      name: 'Neon',
      description: 'Bright cyberpunk style',
      colors: { primary: '#ff00ff', secondary: '#00ffff', fill: '#440044', glow: '#ff00ff' },
    },
    gold: {
      id: 'gold',
      name: 'Gold',
      description: 'Premium golden finish',
      colors: { primary: '#ffd700', secondary: '#ffed4e', fill: '#664400', glow: '#ffd700' },
    },
    veteran: {
      id: 'veteran',
      name: 'Veteran',
      description: 'Elite pilot colors',
      colors: { primary: '#ff4444', secondary: '#ffffff', fill: '#440000', glow: '#ff4444' },
      achievementRequired: 'survivor_20',
    },
  },
  scout: {
    default: {
      id: 'default',
      name: 'Standard',
      description: 'Standard scout colors',
      colors: { primary: '#00ff00', secondary: '#ffffff', fill: '#004400' },
    },
    stealth: {
      id: 'stealth',
      name: 'Stealth',
      description: 'Shadow runner scheme',
      colors: { primary: '#222222', secondary: '#444444', fill: '#000000' },
    },
    neon: {
      id: 'neon',
      name: 'Neon',
      description: 'High-speed racer style',
      colors: { primary: '#00ffff', secondary: '#ff00ff', fill: '#004444', glow: '#00ffff' },
    },
    gold: {
      id: 'gold',
      name: 'Gold',
      description: 'Champion runner finish',
      colors: { primary: '#ffd700', secondary: '#fff700', fill: '#554400', glow: '#ffd700' },
    },
    veteran: {
      id: 'veteran',
      name: 'Veteran',
      description: 'Speed demon colors',
      colors: { primary: '#ffaa00', secondary: '#ffffff', fill: '#553300', glow: '#ffaa00' },
      achievementRequired: 'speed_demon',
    },
  },
  tank: {
    default: {
      id: 'default',
      name: 'Standard',
      description: 'Standard tank colors',
      colors: { primary: '#ff8800', secondary: '#ffffff', fill: '#442200' },
    },
    stealth: {
      id: 'stealth',
      name: 'Stealth',
      description: 'Heavy armor black',
      colors: { primary: '#444444', secondary: '#666666', fill: '#222222' },
    },
    neon: {
      id: 'neon',
      name: 'Neon',
      description: 'Enforcer glow scheme',
      colors: { primary: '#ff0000', secondary: '#ff8800', fill: '#440000', glow: '#ff0000' },
    },
    gold: {
      id: 'gold',
      name: 'Gold',
      description: 'Fortress gold plating',
      colors: { primary: '#ffd700', secondary: '#ffaa00', fill: '#664400', glow: '#ffd700' },
    },
    veteran: {
      id: 'veteran',
      name: 'Veteran',
      description: 'Battle-hardened colors',
      colors: { primary: '#8800ff', secondary: '#ffffff', fill: '#220044', glow: '#8800ff' },
      achievementRequired: 'untouchable',
    },
  },
  interceptor: {
    default: {
      id: 'default',
      name: 'Standard',
      description: 'Standard interceptor colors',
      colors: { primary: '#4488ff', secondary: '#ffffff', fill: '#002244' },
    },
    stealth: {
      id: 'stealth',
      name: 'Stealth',
      description: 'Silent hunter scheme',
      colors: { primary: '#333333', secondary: '#555555', fill: '#111111' },
    },
    neon: {
      id: 'neon',
      name: 'Neon',
      description: 'Lightning strike style',
      colors: { primary: '#ffff00', secondary: '#00ffff', fill: '#444400', glow: '#ffff00' },
    },
    gold: {
      id: 'gold',
      name: 'Gold',
      description: 'Ace pilot finish',
      colors: { primary: '#ffd700', secondary: '#ffffff', fill: '#664400', glow: '#ffd700' },
    },
    veteran: {
      id: 'veteran',
      name: 'Veteran',
      description: 'EMP specialist colors',
      colors: { primary: '#00ffff', secondary: '#ffffff', fill: '#004444', glow: '#00ffff' },
      achievementRequired: 'boss_slayer',
    },
  },
}

export const SKIN_COSTS: Record<SkinId, number> = {
  default: 0,        // Free (starting skin)
  stealth: 500,      // Low tier
  neon: 1000,        // Mid tier
  gold: 2000,        // High tier
  veteran: 0,        // Achievement-exclusive (free but locked)
}

// ------------------------------------------------------------------ //
//                         Weapon Upgrades
// ------------------------------------------------------------------ //

export interface WeaponUpgrades {
  damage: number      // 0-5 levels, +10% each
  fireRate: number    // 0-5 levels, +15% each
  bulletSize: number  // 0-3 levels, +20% each
  multiShot: number   // 0-2 levels (0=1 bullet, 1=2, 2=3)
  piercing: boolean   // Bullets pass through enemies
}

export const UPGRADE_COSTS: Record<keyof WeaponUpgrades, number[]> = {
  damage: [100, 250, 500, 1000, 2000],
  fireRate: [150, 350, 700, 1400, 2800],
  bulletSize: [200, 500, 1000],
  multiShot: [500, 1500],
  piercing: [3000],
}

// ------------------------------------------------------------------ //
//                         Special Abilities
// ------------------------------------------------------------------ //

export type AbilityType = 'emp_blast' | 'missile_barrage' | 'time_warp' | 'shield_burst'

export interface SpecialAbility {
  type: AbilityType
  cooldown: number      // Current cooldown
  maxCooldown: number   // Max cooldown in seconds
  duration: number      // Effect duration (for time_warp, shield_burst)
  isActive: boolean
}

export const ABILITY_STATS: Record<AbilityType, { cooldown: number; duration: number; description: string }> = {
  emp_blast: { cooldown: 20, duration: 0, description: 'Stuns all enemies for 3 seconds' },
  missile_barrage: { cooldown: 15, duration: 0, description: 'Fires 8 homing missiles' },
  time_warp: { cooldown: 25, duration: 5, description: 'Slows time by 50% for 5 seconds' },
  shield_burst: { cooldown: 30, duration: 8, description: 'Invincibility for 8 seconds' },
}

// ------------------------------------------------------------------ //
//                         Achievement Types
// ------------------------------------------------------------------ //

export type AchievementId =
  | 'first_blood'
  | 'combo_master'
  | 'survivor_10'
  | 'survivor_20'
  | 'untouchable'
  | 'boss_slayer'
  | 'power_collector'
  | 'sharpshooter'
  | 'speed_demon'
  | 'pacifist'
  | 'millionaire'
  | 'fully_upgraded'

export interface Achievement {
  id: AchievementId
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: number  // Timestamp
  progress?: number    // For progressive achievements
  target?: number      // Target for progressive achievements
}

export const ACHIEVEMENTS: Record<AchievementId, Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'>> = {
  first_blood: { id: 'first_blood', name: 'First Blood', description: 'Destroy your first enemy', icon: '🎯', target: 1 },
  combo_master: { id: 'combo_master', name: 'Combo Master', description: 'Reach a 20x combo', icon: '🔥', target: 20 },
  survivor_10: { id: 'survivor_10', name: 'Survivor', description: 'Reach wave 10', icon: '🛡️', target: 10 },
  survivor_20: { id: 'survivor_20', name: 'Veteran', description: 'Reach wave 20', icon: '⭐', target: 20 },
  untouchable: { id: 'untouchable', name: 'Untouchable', description: 'Complete a wave without taking damage', icon: '👻' },
  boss_slayer: { id: 'boss_slayer', name: 'Boss Slayer', description: 'Defeat your first boss', icon: '👑', target: 1 },
  power_collector: { id: 'power_collector', name: 'Power Collector', description: 'Collect 50 power-ups', icon: '💎', target: 50 },
  sharpshooter: { id: 'sharpshooter', name: 'Sharpshooter', description: 'Achieve 80% accuracy in a game', icon: '🎯' },
  speed_demon: { id: 'speed_demon', name: 'Speed Demon', description: 'Destroy 10 enemies in 10 seconds', icon: '⚡', target: 10 },
  pacifist: { id: 'pacifist', name: 'Pacifist', description: 'Survive 60 seconds without shooting', icon: '☮️' },
  millionaire: { id: 'millionaire', name: 'Millionaire', description: 'Accumulate 1,000,000 total score', icon: '💰', target: 1000000 },
  fully_upgraded: { id: 'fully_upgraded', name: 'Fully Loaded', description: 'Max out all weapon upgrades', icon: '🚀' },
}

// ------------------------------------------------------------------ //
//                         Statistics Types
// ------------------------------------------------------------------ //

export interface ShipStatistics {
  games: number       // Games played with this ship
  bestScore: number   // Best score with this ship
  bestWave: number    // Best wave reached with this ship
}

export interface GameStatistics {
  // Lifetime stats
  totalGames: number
  totalScore: number
  totalKills: number
  totalDeaths: number
  totalTimePlayed: number  // In seconds
  totalShotsFired: number
  totalShotsHit: number
  totalPowerUpsCollected: number
  totalBossesDefeated: number

  // Best records
  highestScore: number
  highestWave: number
  highestCombo: number
  longestSurvival: number  // In seconds
  bestAccuracy: number     // Percentage

  // Enemy kills by type
  killsByEnemyType: Record<EnemyType, number>
  killsByBossType: Record<BossType, number>

  // Per-ship statistics
  perShipStats: Record<ShipType, ShipStatistics>

  // Misc
  favoriteShip: ShipType
  favoriteTheme: string
  lastPlayed: number  // Timestamp
}

// ------------------------------------------------------------------ //
//                         Power-up Types
// ------------------------------------------------------------------ //

export type PowerUpType = 'shield' | 'rapid_fire' | 'spread_shot' | 'magnet' | 'score_multiplier'

export interface PowerUp {
  pos: Vec2
  type: PowerUpType
  lifetime: number  // Despawns after this many seconds
}

export interface ActivePowerUp {
  type: PowerUpType
  duration: number  // Remaining duration in seconds
}

// ------------------------------------------------------------------ //
//                         Combo Types
// ------------------------------------------------------------------ //

export interface ComboState {
  count: number       // Current combo count
  multiplier: number  // Score multiplier (1, 1.5, 2, 2.5, 3)
  timer: number       // Time remaining before combo resets
}

// ------------------------------------------------------------------ //
//                         Screen Shake
// ------------------------------------------------------------------ //

export interface ScreenShake {
  intensity: number
  duration: number
  elapsed: number
}

// ------------------------------------------------------------------ //
//                         Ability Flash
// ------------------------------------------------------------------ //

export interface AbilityFlash {
  intensity: number
  duration: number
  elapsed: number
  abilityType: AbilityType
}

// ------------------------------------------------------------------ //
//                         Game State
// ------------------------------------------------------------------ //

export interface GameState {
  w: number
  h: number
  time: number
  paused: boolean
  gameMode: GameMode
  score: number
  credits: number  // Currency for upgrades
  lives: number
  wave: number
  player: Player
  bullets: Bullet[]
  particles: Particle[]
  asteroids: Asteroid[]
  enemies: Enemy[]

  // Boss system
  boss: Boss | null
  bossWarning: boolean  // Show warning before boss spawns
  bossWarningStartTime?: number  // Track when boss warning started

  // Power-ups
  powerUps: PowerUp[]
  activePowerUps: ActivePowerUp[]

  // Combo system
  combo: ComboState

  // Screen effects
  screenShake: ScreenShake | null
  abilityFlash: AbilityFlash | null
  timeWarpActive: boolean
  timeWarpMultiplier: number

  // Special abilities
  specialAbility: SpecialAbility | null
  homingMissiles: HomingMissile[]

  // Event mode
  eventMode: boolean
  activeEventId: string | null

  // Session tracking (for achievements)
  sessionDamageTaken: boolean  // Track if damage taken this wave
  sessionKillsRecent: number   // Kills in last 10 seconds
  sessionKillTimer: number     // Timer for speed demon achievement
  sessionShotsFired: number
  sessionShotsHit: number
  sessionLastShotTime: number  // For pacifist achievement
}

// ------------------------------------------------------------------ //
//                         Homing Missile (for special ability)
// ------------------------------------------------------------------ //

export interface HomingMissile {
  pos: Vec2
  vel: Vec2
  life: number
  targetId: number | null  // Index of target enemy
}

// ------------------------------------------------------------------ //
//                         Daily Challenge Types
// ------------------------------------------------------------------ //

export type ChallengeType = 'kill_count' | 'combo' | 'survival' | 'boss' | 'accuracy' | 'power_up' | 'no_damage'

export interface Challenge {
  id: string
  type: ChallengeType
  name: string
  description: string
  target: number           // Target value to complete (e.g., 50 enemies, 3x combo)
  progress: number         // Current progress
  completed: boolean
  reward: number           // Credits awarded on completion
  icon: string
}

export const CHALLENGE_CONFIGS: Record<ChallengeType, {
  minTarget: number
  maxTarget: number
  baseReward: number
  rewardMultiplier: number
}> = {
  kill_count: { minTarget: 30, maxTarget: 100, baseReward: 100, rewardMultiplier: 2 },
  combo: { minTarget: 3, maxTarget: 15, baseReward: 150, rewardMultiplier: 10 },
  survival: { minTarget: 5, maxTarget: 15, baseReward: 200, rewardMultiplier: 15 },
  boss: { minTarget: 1, maxTarget: 3, baseReward: 300, rewardMultiplier: 100 },
  accuracy: { minTarget: 60, maxTarget: 90, baseReward: 250, rewardMultiplier: 3 },
  power_up: { minTarget: 10, maxTarget: 30, baseReward: 100, rewardMultiplier: 5 },
  no_damage: { minTarget: 3, maxTarget: 10, baseReward: 200, rewardMultiplier: 20 },
}

export interface DailyChallengeState {
  challenges: Challenge[]
  lastRefresh: number      // Timestamp of last midnight refresh
  completedToday: number   // Count of challenges completed today
}
