// ------------------------------------------------------------------ //
//                    Weekly Events Types
// ------------------------------------------------------------------ //

import type { ShipType } from './game'

/** Event modifier identifier */
export type EventModifierType =
  | 'double_speed'      // Enemy/asteroid speed 2x
  | 'no_powerups'       // Disable power-up drops
  | 'rapid_bosses'      // Boss every 3 waves instead of 5
  | 'bullet_hell'       // Enemy fire rate 3x
  | 'glass_cannon'      // Player 1 HP but 2x damage
  | 'big_asteroids'     // Asteroid size 1.5x

/** Event modifier configuration */
export interface EventModifier {
  type: EventModifierType
  name: string
  description: string
  icon: string  // Emoji or icon identifier
  /** Multipliers applied to game mechanics */
  effects: {
    enemySpeed?: number
    asteroidSpeed?: number
    enemyFireRate?: number
    playerDamage?: number
    playerMaxHp?: number
    asteroidSize?: number
    bossInterval?: number
    powerUpDropRate?: number
  }
}

/** Predefined event modifiers */
export const EVENT_MODIFIERS: Record<EventModifierType, EventModifier> = {
  double_speed: {
    type: 'double_speed',
    name: 'Double Speed',
    description: 'Enemies and asteroids move twice as fast',
    icon: '⚡',
    effects: {
      enemySpeed: 2.0,
      asteroidSpeed: 2.0,
    },
  },
  no_powerups: {
    type: 'no_powerups',
    name: 'No Power-Ups',
    description: 'Power-ups do not drop',
    icon: '🚫',
    effects: {
      powerUpDropRate: 0,
    },
  },
  rapid_bosses: {
    type: 'rapid_bosses',
    name: 'Rapid Bosses',
    description: 'Boss appears every 3 waves',
    icon: '👹',
    effects: {
      bossInterval: 3,
    },
  },
  bullet_hell: {
    type: 'bullet_hell',
    name: 'Bullet Hell',
    description: 'Enemies fire 3x faster',
    icon: '💥',
    effects: {
      enemyFireRate: 3.0,
    },
  },
  glass_cannon: {
    type: 'glass_cannon',
    name: 'Glass Cannon',
    description: 'You have only 1 HP but deal 2x damage',
    icon: '💎',
    effects: {
      playerMaxHp: 1,
      playerDamage: 2.0,
    },
  },
  big_asteroids: {
    type: 'big_asteroids',
    name: 'Big Asteroids',
    description: 'Asteroids are 1.5x larger',
    icon: '🌑',
    effects: {
      asteroidSize: 1.5,
    },
  },
}

// ------------------------------------------------------------------ //
//                    Weekly Event Configuration
// ------------------------------------------------------------------ //

/** Weekly event configuration */
export interface WeeklyEvent {
  id: string
  name: string
  description: string
  modifiers: EventModifierType[]
  startDate: number  // Unix timestamp (ms)
  endDate: number    // Unix timestamp (ms)
  rewards: {
    participation: number  // Base credits for playing
    rank1: number         // Bonus for 1st place
    rank2: number         // Bonus for 2nd place
    rank3: number         // Bonus for 3rd place
    top10: number         // Bonus for top 10
  }
}

/** Event leaderboard entry */
export interface EventLeaderboardEntry {
  rank: number
  playerId: string      // Unique player identifier
  playerName: string
  score: number
  wave: number
  shipType: ShipType
  timestamp: number     // Unix timestamp (ms)
}

// ------------------------------------------------------------------ //
//                    Event State Types
// ------------------------------------------------------------------ //

/** Current event state */
export interface EventState {
  currentEvent: WeeklyEvent | null
  lastRefreshTime: number  // Unix timestamp (ms)
  rotationIndex: number    // Index in rotation schedule
}

/** Event participation tracking */
export interface EventParticipation {
  eventId: string
  participated: boolean
  bestScore: number
  bestWave: number
  rewardClaimed: boolean
}

/** Event leaderboard data */
export interface EventLeaderboard {
  eventId: string
  entries: EventLeaderboardEntry[]
  playerEntry: EventLeaderboardEntry | null  // Player's entry if ranked
  lastUpdated: number  // Unix timestamp (ms)
}
