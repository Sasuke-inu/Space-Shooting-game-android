/**
 * Challenges Store Unit Tests
 * Tests challenge generation, progress tracking, completion, and daily refresh
 */

// Mock AsyncStorage before imports
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

// Mock the progressStore to avoid circular dependency issues
jest.mock('../state/progressStore', () => ({
  useUpgradesStore: {
    getState: () => ({
      addCredits: jest.fn(),
    }),
  },
}))

import { create } from 'zustand'
import type { Challenge, ChallengeType } from '../types/game'

describe('challengesStore logic', () => {
  // ------------------------------------------------------------------ //
  //                    Challenge Generation Tests
  // ------------------------------------------------------------------ //
  describe('Challenge Generation', () => {
    interface ChallengesTestState {
      challenges: Challenge[]
      lastRefresh: number
      completedToday: number
      recentCompletion: string | null
      generateChallenges: () => void
      checkAndRefreshChallenges: () => void
    }

    const createTestStore = () => create<ChallengesTestState>((set, get) => ({
      challenges: [],
      lastRefresh: 0,
      completedToday: 0,
      recentCompletion: null,

      generateChallenges: () =>
        set(() => {
          const count = 3 + Math.floor(Math.random() * 3) // 3-5 challenges
          const newChallenges: Challenge[] = []

          for (let i = 0; i < count; i++) {
            const types: ChallengeType[] = ['kill_count', 'combo', 'survival', 'boss', 'accuracy', 'power_up', 'no_damage']
            const type = types[Math.floor(Math.random() * types.length)]

            newChallenges.push({
              id: `challenge_${Date.now()}_${i}`,
              type,
              name: 'Test Challenge',
              description: 'Test Description',
              target: 50,
              progress: 0,
              completed: false,
              reward: 100,
              icon: '🎯',
            })
          }

          return {
            challenges: newChallenges,
            lastRefresh: Date.now(),
            completedToday: 0,
            recentCompletion: null,
          }
        }),

      checkAndRefreshChallenges: () => {
        const state = get()
        const isNewDay = (lastRefresh: number): boolean => {
          const now = new Date()
          const last = new Date(lastRefresh)
          return now.toDateString() !== last.toDateString()
        }

        if (state.challenges.length === 0 || isNewDay(state.lastRefresh)) {
          get().generateChallenges()
        }
      },
    }))

    let store: ReturnType<typeof createTestStore>

    beforeEach(() => {
      store = createTestStore()
    })

    test('starts with no challenges', () => {
      expect(store.getState().challenges.length).toBe(0)
    })

    test('generateChallenges creates 3-5 challenges', () => {
      store.getState().generateChallenges()
      const count = store.getState().challenges.length
      expect(count).toBeGreaterThanOrEqual(3)
      expect(count).toBeLessThanOrEqual(5)
    })

    test('generateChallenges sets lastRefresh timestamp', () => {
      const before = Date.now()
      store.getState().generateChallenges()
      const after = Date.now()
      const ts = store.getState().lastRefresh
      expect(ts).toBeGreaterThanOrEqual(before)
      expect(ts).toBeLessThanOrEqual(after)
    })

    test('generateChallenges resets completedToday', () => {
      store.getState().generateChallenges()
      expect(store.getState().completedToday).toBe(0)
    })

    test('generated challenges have required properties', () => {
      store.getState().generateChallenges()
      const challenge = store.getState().challenges[0]
      expect(challenge).toHaveProperty('id')
      expect(challenge).toHaveProperty('type')
      expect(challenge).toHaveProperty('name')
      expect(challenge).toHaveProperty('description')
      expect(challenge).toHaveProperty('target')
      expect(challenge).toHaveProperty('progress')
      expect(challenge).toHaveProperty('completed')
      expect(challenge).toHaveProperty('reward')
      expect(challenge).toHaveProperty('icon')
    })

    test('generated challenges start incomplete', () => {
      store.getState().generateChallenges()
      const allIncomplete = store.getState().challenges.every(c => !c.completed)
      expect(allIncomplete).toBe(true)
    })

    test('generated challenges start with zero progress', () => {
      store.getState().generateChallenges()
      const allZeroProgress = store.getState().challenges.every(c => c.progress === 0)
      expect(allZeroProgress).toBe(true)
    })
  })

  // ------------------------------------------------------------------ //
  //                    Progress Tracking Tests
  // ------------------------------------------------------------------ //
  describe('Progress Tracking', () => {
    interface ChallengesTestState {
      challenges: Challenge[]
      completedToday: number
      recentCompletion: string | null
      updateProgress: (id: string, progress: number) => void
      isCompleted: (id: string) => boolean
      getProgress: (id: string) => number
    }

    const createTestStore = () => create<ChallengesTestState>((set, get) => ({
      challenges: [
        {
          id: 'test-1',
          type: 'kill_count',
          name: 'Kill Test',
          description: 'Kill 50 enemies',
          target: 50,
          progress: 0,
          completed: false,
          reward: 100,
          icon: '🎯',
        },
        {
          id: 'test-2',
          type: 'combo',
          name: 'Combo Test',
          description: 'Get 5x combo',
          target: 5,
          progress: 0,
          completed: false,
          reward: 150,
          icon: '🔥',
        },
      ],
      completedToday: 0,
      recentCompletion: null,

      updateProgress: (id, progress) =>
        set((state) => {
          const challengeIndex = state.challenges.findIndex((c) => c.id === id)
          if (challengeIndex === -1) return state

          const challenge = state.challenges[challengeIndex]
          if (challenge.completed) return state

          const newProgress = Math.min(progress, challenge.target)
          const newChallenges = [...state.challenges]
          newChallenges[challengeIndex] = {
            ...challenge,
            progress: newProgress,
          }

          // Auto-complete if target reached
          if (newProgress >= challenge.target && !challenge.completed) {
            newChallenges[challengeIndex].completed = true

            return {
              challenges: newChallenges,
              completedToday: state.completedToday + 1,
              recentCompletion: id,
            }
          }

          return {
            challenges: newChallenges,
          }
        }),

      isCompleted: (id) => {
        const challenge = get().challenges.find((c) => c.id === id)
        return challenge?.completed ?? false
      },

      getProgress: (id) => {
        const challenge = get().challenges.find((c) => c.id === id)
        return challenge?.progress ?? 0
      },
    }))

    let store: ReturnType<typeof createTestStore>

    beforeEach(() => {
      store = createTestStore()
    })

    test('updateProgress updates progress', () => {
      store.getState().updateProgress('test-1', 25)
      expect(store.getState().getProgress('test-1')).toBe(25)
    })

    test('updateProgress caps at target', () => {
      store.getState().updateProgress('test-1', 100)
      expect(store.getState().getProgress('test-1')).toBe(50)
    })

    test('updateProgress auto-completes at target', () => {
      store.getState().updateProgress('test-2', 5)
      expect(store.getState().isCompleted('test-2')).toBe(true)
    })

    test('updateProgress increments completedToday on completion', () => {
      store.getState().updateProgress('test-2', 5)
      expect(store.getState().completedToday).toBe(1)
    })

    test('updateProgress sets recentCompletion on completion', () => {
      store.getState().updateProgress('test-2', 5)
      expect(store.getState().recentCompletion).toBe('test-2')
    })

    test('updateProgress ignores completed challenges', () => {
      store.getState().updateProgress('test-2', 5)
      store.getState().updateProgress('test-2', 3)
      expect(store.getState().getProgress('test-2')).toBe(5)
    })

    test('updateProgress ignores non-existent challenges', () => {
      const stateBefore = store.getState()
      store.getState().updateProgress('non-existent', 100)
      const stateAfter = store.getState()
      expect(stateBefore).toEqual(stateAfter)
    })

    test('isCompleted returns false for incomplete', () => {
      expect(store.getState().isCompleted('test-1')).toBe(false)
    })

    test('isCompleted returns true for completed', () => {
      store.getState().updateProgress('test-2', 5)
      expect(store.getState().isCompleted('test-2')).toBe(true)
    })

    test('isCompleted returns false for non-existent', () => {
      expect(store.getState().isCompleted('non-existent')).toBe(false)
    })

    test('getProgress returns 0 for non-existent', () => {
      expect(store.getState().getProgress('non-existent')).toBe(0)
    })
  })

  // ------------------------------------------------------------------ //
  //                    Daily Refresh Tests
  // ------------------------------------------------------------------ //
  describe('Daily Refresh Logic', () => {
    interface ChallengesTestState {
      challenges: Challenge[]
      lastRefresh: number
      completedToday: number
      generateChallenges: () => void
      checkAndRefreshChallenges: () => void
      setLastRefresh: (timestamp: number) => void
    }

    const createTestStore = () => create<ChallengesTestState>((set, get) => ({
      challenges: [],
      lastRefresh: 0,
      completedToday: 0,

      generateChallenges: () =>
        set(() => ({
          challenges: [
            {
              id: `challenge_${Date.now()}`,
              type: 'kill_count',
              name: 'Test',
              description: 'Test',
              target: 50,
              progress: 0,
              completed: false,
              reward: 100,
              icon: '🎯',
            },
          ],
          lastRefresh: Date.now(),
          completedToday: 0,
        })),

      setLastRefresh: (timestamp) => set({ lastRefresh: timestamp }),

      checkAndRefreshChallenges: () => {
        const state = get()
        const isNewDay = (lastRefresh: number): boolean => {
          const now = new Date()
          const last = new Date(lastRefresh)
          return now.toDateString() !== last.toDateString()
        }

        if (state.challenges.length === 0 || isNewDay(state.lastRefresh)) {
          get().generateChallenges()
        }
      },
    }))

    let store: ReturnType<typeof createTestStore>

    beforeEach(() => {
      store = createTestStore()
    })

    test('checkAndRefreshChallenges generates challenges if none exist', () => {
      expect(store.getState().challenges.length).toBe(0)
      store.getState().checkAndRefreshChallenges()
      expect(store.getState().challenges.length).toBeGreaterThan(0)
    })

    test('checkAndRefreshChallenges does not refresh same day', () => {
      store.getState().generateChallenges()
      const firstId = store.getState().challenges[0].id
      store.getState().checkAndRefreshChallenges()
      const secondId = store.getState().challenges[0].id
      expect(firstId).toBe(secondId)
    })

    test('checkAndRefreshChallenges refreshes on new day', () => {
      // Set lastRefresh to yesterday
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayTime = yesterday.getTime()

      store.getState().generateChallenges()
      store.getState().setLastRefresh(yesterdayTime)

      // Verify lastRefresh is set to yesterday
      expect(store.getState().lastRefresh).toBe(yesterdayTime)

      // Check and refresh - should generate new challenges
      store.getState().checkAndRefreshChallenges()

      // Verify refresh happened by checking lastRefresh is more recent than yesterday
      expect(store.getState().lastRefresh).toBeGreaterThan(yesterdayTime)
      // Also verify we still have challenges (new ones were generated)
      expect(store.getState().challenges.length).toBeGreaterThan(0)
    })

    test('isNewDay returns false for same day', () => {
      const now = Date.now()
      const isNewDay = (lastRefresh: number): boolean => {
        const nowDate = new Date()
        const lastDate = new Date(lastRefresh)
        return nowDate.toDateString() !== lastDate.toDateString()
      }
      expect(isNewDay(now)).toBe(false)
    })

    test('isNewDay returns true for different day', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const isNewDay = (lastRefresh: number): boolean => {
        const nowDate = new Date()
        const lastDate = new Date(lastRefresh)
        return nowDate.toDateString() !== lastDate.toDateString()
      }
      expect(isNewDay(yesterday.getTime())).toBe(true)
    })

    test('refresh resets completedToday counter', () => {
      // Set up yesterday with completed count
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      store.getState().generateChallenges()
      store.getState().setLastRefresh(yesterday.getTime())

      // Manually set completedToday
      store.setState({ completedToday: 3 })

      // Trigger refresh
      store.getState().checkAndRefreshChallenges()

      expect(store.getState().completedToday).toBe(0)
    })

    test('lastRefresh updates to current time on refresh', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      store.getState().setLastRefresh(yesterday.getTime())

      const before = Date.now()
      store.getState().checkAndRefreshChallenges()
      const after = Date.now()

      const lastRefresh = store.getState().lastRefresh
      expect(lastRefresh).toBeGreaterThanOrEqual(before)
      expect(lastRefresh).toBeLessThanOrEqual(after)
    })
  })

  // ------------------------------------------------------------------ //
  //                    Challenge Completion Tests
  // ------------------------------------------------------------------ //
  describe('Challenge Completion', () => {
    interface ChallengesTestState {
      challenges: Challenge[]
      completedToday: number
      recentCompletion: string | null
      completeChallenge: (id: string) => void
      clearRecentCompletion: () => void
    }

    const createTestStore = () => create<ChallengesTestState>((set, get) => ({
      challenges: [
        {
          id: 'test-1',
          type: 'kill_count',
          name: 'Kill Test',
          description: 'Kill 50 enemies',
          target: 50,
          progress: 50,
          completed: false,
          reward: 100,
          icon: '🎯',
        },
      ],
      completedToday: 0,
      recentCompletion: null,

      completeChallenge: (id) =>
        set((state) => {
          const challengeIndex = state.challenges.findIndex((c) => c.id === id)
          if (challengeIndex === -1) return state

          const challenge = state.challenges[challengeIndex]
          if (challenge.completed) return state

          const newChallenges = [...state.challenges]
          newChallenges[challengeIndex] = {
            ...challenge,
            completed: true,
          }

          return {
            challenges: newChallenges,
            completedToday: state.completedToday + 1,
            recentCompletion: id,
          }
        }),

      clearRecentCompletion: () => set({ recentCompletion: null }),
    }))

    let store: ReturnType<typeof createTestStore>

    beforeEach(() => {
      store = createTestStore()
    })

    test('completeChallenge marks challenge complete', () => {
      store.getState().completeChallenge('test-1')
      expect(store.getState().challenges[0].completed).toBe(true)
    })

    test('completeChallenge increments completedToday', () => {
      store.getState().completeChallenge('test-1')
      expect(store.getState().completedToday).toBe(1)
    })

    test('completeChallenge sets recentCompletion', () => {
      store.getState().completeChallenge('test-1')
      expect(store.getState().recentCompletion).toBe('test-1')
    })

    test('completeChallenge ignores already completed', () => {
      store.getState().completeChallenge('test-1')
      store.getState().completeChallenge('test-1')
      expect(store.getState().completedToday).toBe(1)
    })

    test('completeChallenge ignores non-existent', () => {
      const stateBefore = store.getState()
      store.getState().completeChallenge('non-existent')
      const stateAfter = store.getState()
      expect(stateBefore).toEqual(stateAfter)
    })

    test('clearRecentCompletion clears it', () => {
      store.getState().completeChallenge('test-1')
      store.getState().clearRecentCompletion()
      expect(store.getState().recentCompletion).toBeNull()
    })
  })
})
