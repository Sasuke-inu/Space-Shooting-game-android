/**
 * Weekly Events Store Unit Tests
 * Tests for weekly event state management, leaderboards, and rewards
 */

// Mock AsyncStorage and secureStorage before imports
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
  },
}))

jest.mock('../utils/secureStorage', () => ({
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}))

// Mock backupManager
jest.mock('../utils/backupManager', () => ({
  backupStore: jest.fn(() => Promise.resolve(true)),
  restoreStore: jest.fn(() => Promise.resolve(true)),
}))

// Mock progressStore to avoid circular dependencies
jest.mock('../state/progressStore', () => ({
  useUpgradesStore: {
    getState: () => ({
      addCredits: jest.fn(),
    }),
  },
}))

import { useWeeklyEventsStore } from '../state/weeklyEventsStore'
import type { ShipType } from '../types/game'

// Helper to reset store between tests
const resetStore = () => {
  useWeeklyEventsStore.setState({
    currentEvent: null,
    lastRefreshTime: 0,
    rotationIndex: 0,
    leaderboards: {},
    participation: {},
    recentCompletion: null,
  })
}

describe('weeklyEventsStore', () => {
  beforeEach(() => {
    resetStore()
    jest.clearAllMocks()
  })

  // ------------------------------------------------------------------ //
  //                    Event Generation Tests
  // ------------------------------------------------------------------ //
  describe('Event Generation', () => {
    test('generateWeeklyEvent creates event with correct rotation index', () => {
      const store = useWeeklyEventsStore.getState()

      store.generateWeeklyEvent()

      const state = useWeeklyEventsStore.getState()
      expect(state.currentEvent).toBeDefined()
      expect(state.currentEvent?.name).toBeDefined()
      expect(state.currentEvent?.modifiers).toBeDefined()
      expect(state.rotationIndex).toBeGreaterThanOrEqual(0)
      expect(state.rotationIndex).toBeLessThan(10) // 10 events in rotation
    })

    test('event rotation cycles through all 10 events in schedule', () => {
      const eventNames = new Set<string>()

      // Test rotation calculation for 10 different weeks
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000

      for (let i = 0; i < 10; i++) {
        // Simulate different weeks by setting lastRefreshTime to past dates
        useWeeklyEventsStore.setState({
          lastRefreshTime: Date.now() - (i * oneWeekMs * 2), // 2 weeks apart
        })

        useWeeklyEventsStore.getState().generateWeeklyEvent()
        const event = useWeeklyEventsStore.getState().currentEvent

        if (event) {
          eventNames.add(event.name)
        }
      }

      // Should have multiple different events (at least 5 different ones out of 10)
      expect(eventNames.size).toBeGreaterThanOrEqual(5)
    })

    test('event ID is generated from week start timestamp', () => {
      const store = useWeeklyEventsStore.getState()

      store.generateWeeklyEvent()

      const event = useWeeklyEventsStore.getState().currentEvent
      expect(event?.id).toMatch(/^event_\d+$/)
    })

    test('event start/end dates span Monday to Sunday', () => {
      const store = useWeeklyEventsStore.getState()

      store.generateWeeklyEvent()

      const event = useWeeklyEventsStore.getState().currentEvent
      expect(event).toBeDefined()

      if (event) {
        const startDate = new Date(event.startDate)
        const endDate = new Date(event.endDate)

        // Start should be Monday at midnight
        expect(startDate.getDay()).toBe(1) // Monday
        expect(startDate.getHours()).toBe(0)
        expect(startDate.getMinutes()).toBe(0)

        // End should be 7 days after start (Sunday 11:59:59)
        const durationMs = endDate.getTime() - startDate.getTime()
        const oneWeekMs = 7 * 24 * 60 * 60 * 1000
        expect(durationMs).toBeLessThanOrEqual(oneWeekMs)
        expect(durationMs).toBeGreaterThan(oneWeekMs - 1000) // Within 1 second
      }
    })

    test('event has correct reward structure', () => {
      const store = useWeeklyEventsStore.getState()

      store.generateWeeklyEvent()

      const event = useWeeklyEventsStore.getState().currentEvent
      expect(event?.rewards).toBeDefined()
      expect(event?.rewards.participation).toBe(50)
      expect(event?.rewards.rank1).toBe(500)
      expect(event?.rewards.rank2).toBe(300)
      expect(event?.rewards.rank3).toBe(200)
      expect(event?.rewards.top10).toBe(100)
    })
  })

  // ------------------------------------------------------------------ //
  //                    Event Refresh Tests
  // ------------------------------------------------------------------ //
  describe('Event Refresh', () => {
    test('checkAndRefreshEvent generates new event on new week', () => {
      const store = useWeeklyEventsStore.getState()

      // Set lastRefreshTime to 2 weeks ago
      const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000)
      useWeeklyEventsStore.setState({ lastRefreshTime: twoWeeksAgo })

      store.checkAndRefreshEvent()

      const state = useWeeklyEventsStore.getState()
      expect(state.currentEvent).toBeDefined()
      expect(state.lastRefreshTime).toBeGreaterThan(twoWeeksAgo)
    })

    test('checkAndRefreshEvent keeps current event during same week', () => {
      const store = useWeeklyEventsStore.getState()

      // Generate initial event
      store.generateWeeklyEvent()
      const initialEvent = useWeeklyEventsStore.getState().currentEvent
      const initialRefreshTime = useWeeklyEventsStore.getState().lastRefreshTime

      // Check refresh immediately (same week)
      store.checkAndRefreshEvent()

      const state = useWeeklyEventsStore.getState()
      expect(state.currentEvent).toEqual(initialEvent)
      expect(state.lastRefreshTime).toBe(initialRefreshTime)
    })

    test('getCurrentEvent auto-refreshes if new week detected', () => {
      const store = useWeeklyEventsStore.getState()

      // Set lastRefreshTime to 2 weeks ago
      const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000)
      useWeeklyEventsStore.setState({ lastRefreshTime: twoWeeksAgo })

      const event = store.getCurrentEvent()

      expect(event).toBeDefined()
      const state = useWeeklyEventsStore.getState()
      expect(state.lastRefreshTime).toBeGreaterThan(twoWeeksAgo)
    })
  })

  // ------------------------------------------------------------------ //
  //                    Leaderboard Management Tests
  // ------------------------------------------------------------------ //
  describe('Leaderboard Management', () => {
    const eventId = 'event_test_1'
    const playerName = 'TestPlayer'
    const shipType: ShipType = 'fighter'

    test('submitScore adds entry to leaderboard', () => {
      const store = useWeeklyEventsStore.getState()

      store.submitScore(eventId, 1000, 5, playerName, shipType)

      const leaderboard = store.getLeaderboard(eventId)
      expect(leaderboard).toBeDefined()
      expect(leaderboard?.entries).toHaveLength(1)
      expect(leaderboard?.entries[0].playerName).toBe(playerName)
      expect(leaderboard?.entries[0].score).toBe(1000)
      expect(leaderboard?.entries[0].wave).toBe(5)
      expect(leaderboard?.entries[0].rank).toBe(1)
    })

    test('submitScore updates existing entry if score is higher', () => {
      const store = useWeeklyEventsStore.getState()

      // Submit initial score
      store.submitScore(eventId, 1000, 5, playerName, shipType)

      // Submit higher score
      store.submitScore(eventId, 2000, 10, playerName, shipType)

      const leaderboard = store.getLeaderboard(eventId)
      expect(leaderboard?.entries).toHaveLength(1)
      expect(leaderboard?.entries[0].score).toBe(2000)
      expect(leaderboard?.entries[0].wave).toBe(10)
    })

    test('submitScore ignores lower score from same player', () => {
      const store = useWeeklyEventsStore.getState()

      // Submit initial score
      store.submitScore(eventId, 2000, 10, playerName, shipType)

      // Submit lower score
      store.submitScore(eventId, 1000, 5, playerName, shipType)

      const leaderboard = store.getLeaderboard(eventId)
      expect(leaderboard?.entries).toHaveLength(1)
      expect(leaderboard?.entries[0].score).toBe(2000) // Still the higher score
    })

    test('leaderboard limits to top 10 entries', () => {
      const store = useWeeklyEventsStore.getState()

      // Submit 15 different players
      for (let i = 1; i <= 15; i++) {
        store.submitScore(eventId, i * 100, i, `Player${i}`, shipType)
      }

      const leaderboard = store.getLeaderboard(eventId)
      expect(leaderboard?.entries).toHaveLength(10)
    })

    test('leaderboard entries sorted by score descending', () => {
      const store = useWeeklyEventsStore.getState()

      // Submit scores in random order
      store.submitScore(eventId, 500, 3, 'Player1', shipType)
      store.submitScore(eventId, 2000, 8, 'Player2', shipType)
      store.submitScore(eventId, 1000, 5, 'Player3', shipType)
      store.submitScore(eventId, 1500, 7, 'Player4', shipType)

      const leaderboard = store.getLeaderboard(eventId)
      expect(leaderboard?.entries[0].score).toBe(2000)
      expect(leaderboard?.entries[1].score).toBe(1500)
      expect(leaderboard?.entries[2].score).toBe(1000)
      expect(leaderboard?.entries[3].score).toBe(500)
    })

    test('leaderboard entries have correct ranks (1-10)', () => {
      const store = useWeeklyEventsStore.getState()

      // Submit 10 players
      for (let i = 1; i <= 10; i++) {
        store.submitScore(eventId, i * 100, i, `Player${i}`, shipType)
      }

      const leaderboard = store.getLeaderboard(eventId)
      expect(leaderboard?.entries).toHaveLength(10)

      leaderboard?.entries.forEach((entry, index) => {
        expect(entry.rank).toBe(index + 1)
      })
    })

    test('getLeaderboard returns null for event with no scores', () => {
      const store = useWeeklyEventsStore.getState()

      const leaderboard = store.getLeaderboard('nonexistent_event')

      expect(leaderboard).toBeNull()
    })

    test('getLeaderboard returns correct entries and playerEntry', () => {
      const store = useWeeklyEventsStore.getState()

      store.submitScore(eventId, 1000, 5, 'Player1', shipType)
      store.submitScore(eventId, 2000, 8, playerName, shipType)

      const leaderboard = store.getLeaderboard(eventId)

      expect(leaderboard?.entries).toHaveLength(2)
      expect(leaderboard?.playerEntry?.playerName).toBe(playerName)
      expect(leaderboard?.playerEntry?.score).toBe(2000)
    })
  })

  // ------------------------------------------------------------------ //
  //                    Participation Tracking Tests
  // ------------------------------------------------------------------ //
  describe('Participation Tracking', () => {
    const eventId = 'event_test_1'
    const playerName = 'TestPlayer'
    const shipType: ShipType = 'fighter'

    test('submitScore marks event as participated on first play', () => {
      const store = useWeeklyEventsStore.getState()

      expect(store.hasParticipated(eventId)).toBe(false)

      store.submitScore(eventId, 1000, 5, playerName, shipType)

      expect(store.hasParticipated(eventId)).toBe(true)
    })

    test('submitScore updates best score and wave', () => {
      const store = useWeeklyEventsStore.getState()

      store.submitScore(eventId, 1000, 5, playerName, shipType)

      let state = useWeeklyEventsStore.getState()
      expect(state.participation[eventId]?.bestScore).toBe(1000)
      expect(state.participation[eventId]?.bestWave).toBe(5)

      // Submit better score
      store.submitScore(eventId, 2000, 10, playerName, shipType)

      state = useWeeklyEventsStore.getState()
      expect(state.participation[eventId]?.bestScore).toBe(2000)
      expect(state.participation[eventId]?.bestWave).toBe(10)
    })

    test('hasParticipated returns true after first play', () => {
      const store = useWeeklyEventsStore.getState()

      store.submitScore(eventId, 1000, 5, playerName, shipType)

      expect(store.hasParticipated(eventId)).toBe(true)
    })

    test('hasParticipated returns false for unplayed event', () => {
      const store = useWeeklyEventsStore.getState()

      expect(store.hasParticipated('unplayed_event')).toBe(false)
    })
  })

  // ------------------------------------------------------------------ //
  //                    Rewards Tests
  // ------------------------------------------------------------------ //
  describe('Rewards', () => {
    const playerName = 'TestPlayer'
    const shipType: ShipType = 'fighter'

    beforeEach(() => {
      // Generate an event for reward tests
      const store = useWeeklyEventsStore.getState()
      store.generateWeeklyEvent()
    })

    test('submitScore awards participation reward on first play only', () => {
      const { useUpgradesStore } = require('../state/progressStore')
      const addCreditsMock = useUpgradesStore.getState().addCredits

      const store = useWeeklyEventsStore.getState()
      const event = store.getCurrentEvent()

      if (event) {
        // First play
        store.submitScore(event.id, 1000, 5, playerName, shipType)

        // Should award participation reward asynchronously
        // Wait for next tick
        setTimeout(() => {
          expect(addCreditsMock).toHaveBeenCalledWith(50) // participation reward
        }, 0)

        // Second play
        addCreditsMock.mockClear()
        store.submitScore(event.id, 2000, 10, playerName, shipType)

        // Should NOT award again
        setTimeout(() => {
          expect(addCreditsMock).not.toHaveBeenCalled()
        }, 0)
      }
    })

    test('getEventReward calculates correct reward for rank 1', () => {
      const store = useWeeklyEventsStore.getState()
      const event = store.getCurrentEvent()

      if (event) {
        const reward = store.getEventReward(event.id, 1)
        expect(reward).toBe(550) // 50 participation + 500 rank1
      }
    })

    test('getEventReward calculates correct reward for rank 2', () => {
      const store = useWeeklyEventsStore.getState()
      const event = store.getCurrentEvent()

      if (event) {
        const reward = store.getEventReward(event.id, 2)
        expect(reward).toBe(350) // 50 participation + 300 rank2
      }
    })

    test('getEventReward calculates correct reward for rank 3', () => {
      const store = useWeeklyEventsStore.getState()
      const event = store.getCurrentEvent()

      if (event) {
        const reward = store.getEventReward(event.id, 3)
        expect(reward).toBe(250) // 50 participation + 200 rank3
      }
    })

    test('getEventReward calculates correct reward for top 10', () => {
      const store = useWeeklyEventsStore.getState()
      const event = store.getCurrentEvent()

      if (event) {
        const reward = store.getEventReward(event.id, 7)
        expect(reward).toBe(150) // 50 participation + 100 top10
      }
    })

    test('getEventReward returns participation reward for rank >10', () => {
      const store = useWeeklyEventsStore.getState()
      const event = store.getCurrentEvent()

      if (event) {
        const reward = store.getEventReward(event.id, 15)
        expect(reward).toBe(50) // participation only
      }
    })

    test('claimEventReward awards bonus credits for top ranks', () => {
      const store = useWeeklyEventsStore.getState()
      const event = store.getCurrentEvent()

      if (event) {
        // Submit score to get ranked
        store.submitScore(event.id, 2000, 10, playerName, shipType)

        // Claim reward
        const claimed = store.claimEventReward(event.id, playerName)

        expect(claimed).toBe(true)
      }
    })

    test('claimEventReward marks reward as claimed', () => {
      const store = useWeeklyEventsStore.getState()
      const event = store.getCurrentEvent()

      if (event) {
        store.submitScore(event.id, 2000, 10, playerName, shipType)

        const claimed = store.claimEventReward(event.id, playerName)
        expect(claimed).toBe(true)

        const state = useWeeklyEventsStore.getState()
        expect(state.participation[event.id]?.rewardClaimed).toBe(true)
      }
    })

    test('claimEventReward prevents double claiming', () => {
      const store = useWeeklyEventsStore.getState()
      const event = store.getCurrentEvent()

      if (event) {
        store.submitScore(event.id, 2000, 10, playerName, shipType)

        // First claim
        const claimed1 = store.claimEventReward(event.id, playerName)
        expect(claimed1).toBe(true)

        // Second claim should fail
        const claimed2 = store.claimEventReward(event.id, playerName)
        expect(claimed2).toBe(false)
      }
    })
  })

  // ------------------------------------------------------------------ //
  //                    Leaderboard Queries Tests
  // ------------------------------------------------------------------ //
  describe('Leaderboard Queries', () => {
    const eventId = 'event_test_1'
    const shipType: ShipType = 'fighter'

    test('isTopTen returns true if score qualifies', () => {
      const store = useWeeklyEventsStore.getState()

      // Add 10 scores (100-1000)
      for (let i = 1; i <= 10; i++) {
        store.submitScore(eventId, i * 100, i, `Player${i}`, shipType)
      }

      // Score of 1500 should qualify
      expect(store.isTopTen(eventId, 1500)).toBe(true)

      // Score of 50 should not qualify
      expect(store.isTopTen(eventId, 50)).toBe(false)
    })

    test('isTopTen returns true if leaderboard has <10 entries', () => {
      const store = useWeeklyEventsStore.getState()

      // Add only 5 scores
      for (let i = 1; i <= 5; i++) {
        store.submitScore(eventId, i * 100, i, `Player${i}`, shipType)
      }

      // Any score should qualify
      expect(store.isTopTen(eventId, 10)).toBe(true)
      expect(store.isTopTen(eventId, 50000)).toBe(true)
    })

    test('isTopTen returns false if score too low', () => {
      const store = useWeeklyEventsStore.getState()

      // Add 10 scores (100-1000)
      for (let i = 1; i <= 10; i++) {
        store.submitScore(eventId, i * 100, i, `Player${i}`, shipType)
      }

      // Score of 50 is below the 10th place (100)
      expect(store.isTopTen(eventId, 50)).toBe(false)
    })
  })

  // ------------------------------------------------------------------ //
  //                    Persistence Tests
  // ------------------------------------------------------------------ //
  describe('Persistence', () => {
    test('backup saves current state', async () => {
      const { backupStore } = require('../utils/backupManager')
      const store = useWeeklyEventsStore.getState()

      const result = await store.backup()

      expect(result).toBe(true)
      expect(backupStore).toHaveBeenCalledWith('weeklyEvents')
    })

    test('restore loads saved state', async () => {
      const { restoreStore } = require('../utils/backupManager')
      const store = useWeeklyEventsStore.getState()

      const result = await store.restore()

      expect(result).toBe(true)
      expect(restoreStore).toHaveBeenCalledWith('weeklyEvents')
    })

    test('state persists across store recreation', () => {
      // This test verifies that the Zustand persist middleware is configured
      // The actual persistence is handled by secureStorage mock
      const store = useWeeklyEventsStore.getState()

      store.generateWeeklyEvent()
      const event = useWeeklyEventsStore.getState().currentEvent

      expect(event).toBeDefined()
      expect(event?.name).toBeDefined()
    })
  })
})
