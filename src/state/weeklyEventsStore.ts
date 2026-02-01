import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import secureStorage from '../utils/secureStorage'
import { backupStore, restoreStore } from '../utils/backupManager'
import type {
  WeeklyEvent,
  EventLeaderboardEntry,
  EventLeaderboard,
  EventParticipation,
  EventModifierType,
} from '../types/weeklyEvents'
import type { ShipType } from '../types/game'

// ------------------------------------------------------------------ //
//                         Weekly Events Store
// ------------------------------------------------------------------ //

interface WeeklyEventsState {
  // Current event state
  currentEvent: WeeklyEvent | null
  lastRefreshTime: number
  rotationIndex: number

  // Leaderboards (map of eventId -> leaderboard data)
  leaderboards: Record<string, EventLeaderboard>

  // Participation tracking (map of eventId -> participation data)
  participation: Record<string, EventParticipation>

  // Recent completion tracking (for UI feedback)
  recentCompletion: string | null  // ID of recently completed event

  // Actions
  getCurrentEvent: () => WeeklyEvent | null
  submitScore: (eventId: string, score: number, wave: number, playerName: string, shipType: ShipType) => void
  getLeaderboard: (eventId: string) => EventLeaderboard | null
  checkAndRefreshEvent: () => void
  generateWeeklyEvent: () => void
  hasParticipated: (eventId: string) => boolean
  getEventReward: (eventId: string, rank: number) => number
  isTopTen: (eventId: string, score: number) => boolean
  claimEventReward: (eventId: string, playerName: string) => boolean
  clearRecentCompletion: () => void
  backup: () => Promise<boolean>
  restore: () => Promise<boolean>
}

// ------------------------------------------------------------------ //
//                    Event Rotation Schedule
// ------------------------------------------------------------------ //

/** Predefined event rotation schedule (cycles weekly) */
const EVENT_ROTATION_SCHEDULE: Array<{
  name: string
  description: string
  modifiers: EventModifierType[]
}> = [
  {
    name: 'Speed Demon',
    description: 'Everything moves at breakneck speed',
    modifiers: ['double_speed'],
  },
  {
    name: 'Survival Mode',
    description: 'No power-ups, pure skill required',
    modifiers: ['no_powerups'],
  },
  {
    name: 'Boss Rush',
    description: 'Face bosses more frequently',
    modifiers: ['rapid_bosses'],
  },
  {
    name: 'Bullet Storm',
    description: 'Dodge endless enemy fire',
    modifiers: ['bullet_hell'],
  },
  {
    name: 'One Hit Wonder',
    description: 'High risk, high reward combat',
    modifiers: ['glass_cannon'],
  },
  {
    name: 'Asteroid Field',
    description: 'Navigate massive space rocks',
    modifiers: ['big_asteroids'],
  },
  {
    name: 'Speed & Fury',
    description: 'Fast enemies in a bullet storm',
    modifiers: ['double_speed', 'bullet_hell'],
  },
  {
    name: 'Boss Gauntlet',
    description: 'Frequent bosses with no power-ups',
    modifiers: ['rapid_bosses', 'no_powerups'],
  },
  {
    name: 'Ultimate Challenge',
    description: 'Glass cannon mode in a bullet hell',
    modifiers: ['glass_cannon', 'bullet_hell'],
  },
  {
    name: 'Chaos Mode',
    description: 'Everything is harder, faster, bigger',
    modifiers: ['double_speed', 'big_asteroids', 'bullet_hell'],
  },
]

// ------------------------------------------------------------------ //
//                         Helper Functions
// ------------------------------------------------------------------ //

/** Check if it's a new week (past Monday midnight) */
const isNewWeek = (lastRefresh: number): boolean => {
  const now = new Date()
  const last = new Date(lastRefresh)

  // Get the Monday of each week
  const getMondayOfWeek = (date: Date): Date => {
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
    const monday = new Date(date)
    monday.setDate(diff)
    monday.setHours(0, 0, 0, 0)
    return monday
  }

  const currentMonday = getMondayOfWeek(now)
  const lastMonday = getMondayOfWeek(last)

  return currentMonday.getTime() !== lastMonday.getTime()
}

/** Generate event ID from week start timestamp */
const generateEventId = (weekStartTime: number): string => {
  return `event_${weekStartTime}`
}

/** Get the start of the current week (Monday midnight) */
const getWeekStartTime = (): number => {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
  const monday = new Date(now)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday.getTime()
}

/** Get the end of the current week (Sunday 11:59:59 PM) */
const getWeekEndTime = (): number => {
  const weekStart = getWeekStartTime()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)
  weekEnd.setMilliseconds(-1)
  return weekEnd.getTime()
}

// ------------------------------------------------------------------ //
//                         Store Implementation
// ------------------------------------------------------------------ //

export const useWeeklyEventsStore = create<WeeklyEventsState>()(
  persist(
    (set, get) => ({
      currentEvent: null,
      lastRefreshTime: 0,
      rotationIndex: 0,
      leaderboards: {},
      participation: {},
      recentCompletion: null,

      getCurrentEvent: () => {
        const state = get()

        // Check if event needs refresh
        if (!state.currentEvent || isNewWeek(state.lastRefreshTime)) {
          get().generateWeeklyEvent()
        }

        return state.currentEvent
      },

      submitScore: (eventId, score, wave, playerName, shipType) => {
        set((state) => {
          // Get or create leaderboard for this event
          const currentLeaderboard = state.leaderboards[eventId] || {
            eventId,
            entries: [],
            playerEntry: null,
            lastUpdated: Date.now(),
          }

          // Create new entry
          const newEntry: EventLeaderboardEntry = {
            rank: 0, // Will be calculated after sorting
            playerId: playerName, // Using playerName as ID for now (could be device ID)
            playerName,
            score,
            wave,
            shipType,
            timestamp: Date.now(),
          }

          // Update or add entry
          let entries = [...currentLeaderboard.entries]
          const existingIndex = entries.findIndex((e) => e.playerId === playerName)

          if (existingIndex !== -1) {
            // Update only if new score is better
            if (score > entries[existingIndex].score) {
              entries[existingIndex] = newEntry
            }
          } else {
            entries.push(newEntry)
          }

          // Sort by score (descending) and limit to top 10
          entries = entries
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map((entry, index) => ({
              ...entry,
              rank: index + 1,
            }))

          // Find player's entry
          const playerEntry = entries.find((e) => e.playerId === playerName) || null

          // Update participation
          const currentParticipation = state.participation[eventId] || {
            eventId,
            participated: false,
            bestScore: 0,
            bestWave: 0,
            rewardClaimed: false,
          }

          const updatedParticipation: EventParticipation = {
            ...currentParticipation,
            participated: true,
            bestScore: Math.max(currentParticipation.bestScore, score),
            bestWave: Math.max(currentParticipation.bestWave, wave),
          }

          // Award participation reward if first time playing this event
          const isFirstParticipation = !currentParticipation.participated
          if (isFirstParticipation && state.currentEvent) {
            import('./progressStore').then(({ useUpgradesStore }) => {
              useUpgradesStore.getState().addCredits(state.currentEvent!.rewards.participation)
            })
          }

          return {
            leaderboards: {
              ...state.leaderboards,
              [eventId]: {
                eventId,
                entries,
                playerEntry,
                lastUpdated: Date.now(),
              },
            },
            participation: {
              ...state.participation,
              [eventId]: updatedParticipation,
            },
            recentCompletion: isFirstParticipation ? eventId : state.recentCompletion,
          }
        })
      },

      getLeaderboard: (eventId) => {
        return get().leaderboards[eventId] || null
      },

      checkAndRefreshEvent: () => {
        const state = get()

        // If no event or new week, generate new event
        if (!state.currentEvent || isNewWeek(state.lastRefreshTime)) {
          get().generateWeeklyEvent()
        }
      },

      generateWeeklyEvent: () => {
        set((state) => {
          const weekStartTime = getWeekStartTime()
          const weekEndTime = getWeekEndTime()

          // Calculate rotation index based on weeks since epoch
          const weeksFromEpoch = Math.floor(weekStartTime / (7 * 24 * 60 * 60 * 1000))
          const rotationIndex = weeksFromEpoch % EVENT_ROTATION_SCHEDULE.length

          const eventConfig = EVENT_ROTATION_SCHEDULE[rotationIndex]
          const eventId = generateEventId(weekStartTime)

          const newEvent: WeeklyEvent = {
            id: eventId,
            name: eventConfig.name,
            description: eventConfig.description,
            modifiers: eventConfig.modifiers,
            startDate: weekStartTime,
            endDate: weekEndTime,
            rewards: {
              participation: 50,
              rank1: 500,
              rank2: 300,
              rank3: 200,
              top10: 100,
            },
          }

          return {
            currentEvent: newEvent,
            lastRefreshTime: Date.now(),
            rotationIndex,
          }
        })
      },

      hasParticipated: (eventId) => {
        return get().participation[eventId]?.participated || false
      },

      getEventReward: (eventId, rank) => {
        const event = get().currentEvent
        if (!event || event.id !== eventId) return 0

        const rewards = event.rewards

        // Calculate reward based on rank
        if (rank === 1) return rewards.participation + rewards.rank1
        if (rank === 2) return rewards.participation + rewards.rank2
        if (rank === 3) return rewards.participation + rewards.rank3
        if (rank <= 10) return rewards.participation + rewards.top10

        return rewards.participation
      },

      isTopTen: (eventId, score) => {
        const leaderboard = get().leaderboards[eventId]
        if (!leaderboard) return true
        if (leaderboard.entries.length < 10) return true
        return score > leaderboard.entries[leaderboard.entries.length - 1].score
      },

      claimEventReward: (eventId, playerName) => {
        const state = get()
        const participation = state.participation[eventId]

        // Check if player participated in this event
        if (!participation || !participation.participated) {
          return false
        }

        // Check if reward already claimed
        if (participation.rewardClaimed) {
          return false
        }

        // Get player's rank from leaderboard
        const leaderboard = state.leaderboards[eventId]
        if (!leaderboard) {
          return false
        }

        const playerEntry = leaderboard.entries.find((e) => e.playerId === playerName)
        if (!playerEntry) {
          return false
        }

        // Calculate reward based on rank (participation reward already given on first play)
        const rank = playerEntry.rank
        let bonusReward = 0

        // Find the event to get reward values
        const event = state.currentEvent?.id === eventId ? state.currentEvent : null
        if (event) {
          const rewards = event.rewards
          if (rank === 1) bonusReward = rewards.rank1
          else if (rank === 2) bonusReward = rewards.rank2
          else if (rank === 3) bonusReward = rewards.rank3
          else if (rank <= 10) bonusReward = rewards.top10
        }

        // Award bonus reward if any
        if (bonusReward > 0) {
          import('./progressStore').then(({ useUpgradesStore }) => {
            useUpgradesStore.getState().addCredits(bonusReward)
          })
        }

        // Mark reward as claimed
        set((state) => ({
          participation: {
            ...state.participation,
            [eventId]: {
              ...state.participation[eventId],
              rewardClaimed: true,
            },
          },
          recentCompletion: eventId,
        }))

        return true
      },

      clearRecentCompletion: () => set({ recentCompletion: null }),

      backup: async () => {
        return await backupStore('weeklyEvents')
      },

      restore: async () => {
        return await restoreStore('weeklyEvents')
      },
    }),
    {
      name: 'weekly-events-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
)
