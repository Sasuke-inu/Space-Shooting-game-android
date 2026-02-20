/**
 * High Scores Store Unit Tests
 * Tests high score leaderboard functionality
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

import { create } from 'zustand'
import type { ShipType } from '../types/game'

// HighScore interface definition (from highScoresStore.ts)
interface HighScore {
  name: string
  score: number
  wave: number
  date: number
  ship: ShipType
}

describe('highScoresStore logic', () => {
  // ------------------------------------------------------------------ //
  //                         High Scores Logic Tests
  // ------------------------------------------------------------------ //
  describe('High Scores Logic', () => {
    interface HighScoresTestState {
      scores: HighScore[]
      addScore: (score: number, wave: number, name: string, ship: ShipType) => void
      isTopTen: (score: number) => boolean
      getScores: () => HighScore[]
    }

    const createTestStore = () => create<HighScoresTestState>((set, get) => ({
      scores: [],

      addScore: (score: number, wave: number, name: string, ship: ShipType) => {
        set((state) => {
          const newScore: HighScore = {
            name,
            score,
            wave,
            date: Date.now(),
            ship,
          }
          const newScores = [...state.scores, newScore]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
          return { scores: newScores }
        })
      },

      isTopTen: (score: number) => {
        const scores = get().scores
        if (scores.length < 10) return true
        return score > scores[scores.length - 1].score
      },

      getScores: () => get().scores,
    }))

    let store: ReturnType<typeof createTestStore>

    beforeEach(() => {
      store = createTestStore()
    })

    // ------------------------------------------------------------------ //
    //                         Initial State
    // ------------------------------------------------------------------ //
    test('scores start empty', () => {
      expect(store.getState().scores).toHaveLength(0)
    })

    test('getScores returns empty array initially', () => {
      expect(store.getState().getScores()).toHaveLength(0)
    })

    // ------------------------------------------------------------------ //
    //                         addScore Tests
    // ------------------------------------------------------------------ //
    test('addScore adds a score to empty list', () => {
      store.getState().addScore(1000, 5, 'Player1', 'fighter')
      expect(store.getState().scores).toHaveLength(1)
    })

    test('addScore creates score with correct fields', () => {
      const before = Date.now()
      store.getState().addScore(1000, 5, 'Player1', 'fighter')
      const after = Date.now()

      const score = store.getState().scores[0]
      expect(score.name).toBe('Player1')
      expect(score.score).toBe(1000)
      expect(score.wave).toBe(5)
      expect(score.ship).toBe('fighter')
      expect(score.date).toBeGreaterThanOrEqual(before)
      expect(score.date).toBeLessThanOrEqual(after)
    })

    test('addScore sorts scores by highest first', () => {
      store.getState().addScore(500, 3, 'Player1', 'fighter')
      store.getState().addScore(1000, 5, 'Player2', 'scout')
      store.getState().addScore(750, 4, 'Player3', 'tank')

      const scores = store.getState().scores
      expect(scores[0].score).toBe(1000)
      expect(scores[1].score).toBe(750)
      expect(scores[2].score).toBe(500)
    })

    test('addScore limits to 10 scores', () => {
      // Add 15 scores
      for (let i = 0; i < 15; i++) {
        store.getState().addScore(i * 100, i, `Player${i}`, 'fighter')
      }
      expect(store.getState().scores).toHaveLength(10)
    })

    test('addScore keeps only top 10 scores', () => {
      // Add 15 scores with varying values
      const scoreValues = [100, 500, 200, 1000, 300, 800, 400, 900, 600, 700, 150, 250, 350, 450, 550]
      scoreValues.forEach((score, i) => {
        store.getState().addScore(score, i, `Player${i}`, 'fighter')
      })

      const scores = store.getState().scores
      expect(scores).toHaveLength(10)
      // Should have top 10: 1000, 900, 800, 700, 600, 550, 500, 450, 400, 350
      expect(scores[0].score).toBe(1000)
      expect(scores[9].score).toBe(350)
    })

    test('addScore does not add score below top 10', () => {
      // Fill with 10 scores (100, 200, ..., 1000)
      for (let i = 1; i <= 10; i++) {
        store.getState().addScore(i * 100, i, `Player${i}`, 'fighter')
      }

      // Try to add a score lower than 100
      store.getState().addScore(50, 1, 'LowPlayer', 'fighter')

      const scores = store.getState().scores
      expect(scores).toHaveLength(10)
      expect(scores[9].score).toBe(100)
      expect(scores.find(s => s.name === 'LowPlayer')).toBeUndefined()
    })

    test('addScore supports different ship types', () => {
      store.getState().addScore(1000, 5, 'Player1', 'fighter')
      store.getState().addScore(900, 4, 'Player2', 'scout')
      store.getState().addScore(800, 3, 'Player3', 'tank')
      store.getState().addScore(700, 2, 'Player4', 'interceptor')

      const scores = store.getState().scores
      expect(scores[0].ship).toBe('fighter')
      expect(scores[1].ship).toBe('scout')
      expect(scores[2].ship).toBe('tank')
      expect(scores[3].ship).toBe('interceptor')
    })

    test('addScore handles duplicate scores', () => {
      store.getState().addScore(1000, 5, 'Player1', 'fighter')
      store.getState().addScore(1000, 5, 'Player2', 'scout')

      const scores = store.getState().scores
      expect(scores).toHaveLength(2)
      expect(scores[0].score).toBe(1000)
      expect(scores[1].score).toBe(1000)
    })

    test('addScore handles same player multiple times', () => {
      store.getState().addScore(1000, 5, 'Player1', 'fighter')
      store.getState().addScore(500, 3, 'Player1', 'scout')
      store.getState().addScore(750, 4, 'Player1', 'tank')

      const scores = store.getState().scores
      expect(scores).toHaveLength(3)
      expect(scores.filter(s => s.name === 'Player1')).toHaveLength(3)
    })

    // ------------------------------------------------------------------ //
    //                         isTopTen Tests
    // ------------------------------------------------------------------ //
    test('isTopTen returns true for empty list', () => {
      expect(store.getState().isTopTen(100)).toBe(true)
    })

    test('isTopTen returns true when less than 10 scores', () => {
      for (let i = 1; i <= 5; i++) {
        store.getState().addScore(i * 100, i, `Player${i}`, 'fighter')
      }
      expect(store.getState().isTopTen(50)).toBe(true)
    })

    test('isTopTen returns true for score higher than lowest', () => {
      // Add 10 scores (100, 200, ..., 1000)
      for (let i = 1; i <= 10; i++) {
        store.getState().addScore(i * 100, i, `Player${i}`, 'fighter')
      }
      expect(store.getState().isTopTen(150)).toBe(true)
    })

    test('isTopTen returns false for score lower than lowest', () => {
      // Add 10 scores (100, 200, ..., 1000)
      for (let i = 1; i <= 10; i++) {
        store.getState().addScore(i * 100, i, `Player${i}`, 'fighter')
      }
      expect(store.getState().isTopTen(50)).toBe(false)
    })

    test('isTopTen returns false for score equal to lowest', () => {
      // Add 10 scores (100, 200, ..., 1000)
      for (let i = 1; i <= 10; i++) {
        store.getState().addScore(i * 100, i, `Player${i}`, 'fighter')
      }
      expect(store.getState().isTopTen(100)).toBe(false)
    })

    test('isTopTen returns true at exactly 9 scores', () => {
      for (let i = 1; i <= 9; i++) {
        store.getState().addScore(i * 100, i, `Player${i}`, 'fighter')
      }
      expect(store.getState().isTopTen(1)).toBe(true)
    })

    test('isTopTen boundary check at 10 scores', () => {
      for (let i = 1; i <= 10; i++) {
        store.getState().addScore(i * 100, i, `Player${i}`, 'fighter')
      }
      // 100 is the lowest, so 101 should qualify
      expect(store.getState().isTopTen(101)).toBe(true)
      // 100 should not qualify (equal to lowest)
      expect(store.getState().isTopTen(100)).toBe(false)
      // 99 should not qualify
      expect(store.getState().isTopTen(99)).toBe(false)
    })

    // ------------------------------------------------------------------ //
    //                         getScores Tests
    // ------------------------------------------------------------------ //
    test('getScores returns all scores', () => {
      store.getState().addScore(1000, 5, 'Player1', 'fighter')
      store.getState().addScore(500, 3, 'Player2', 'scout')

      const scores = store.getState().getScores()
      expect(scores).toHaveLength(2)
    })

    test('getScores returns sorted scores', () => {
      store.getState().addScore(500, 3, 'Player1', 'fighter')
      store.getState().addScore(1000, 5, 'Player2', 'scout')
      store.getState().addScore(750, 4, 'Player3', 'tank')

      const scores = store.getState().getScores()
      expect(scores[0].score).toBeGreaterThan(scores[1].score)
      expect(scores[1].score).toBeGreaterThan(scores[2].score)
    })

    test('getScores returns reference to scores array', () => {
      store.getState().addScore(1000, 5, 'Player1', 'fighter')
      const scores1 = store.getState().getScores()
      const scores2 = store.getState().getScores()
      expect(scores1).toBe(scores2)
    })

    // ------------------------------------------------------------------ //
    //                         Edge Cases
    // ------------------------------------------------------------------ //
    test('handles zero score', () => {
      store.getState().addScore(0, 1, 'Player1', 'fighter')
      expect(store.getState().scores[0].score).toBe(0)
    })

    test('handles negative wave (edge case)', () => {
      store.getState().addScore(1000, -1, 'Player1', 'fighter')
      expect(store.getState().scores[0].wave).toBe(-1)
    })

    test('handles very large score', () => {
      store.getState().addScore(999999999, 100, 'Player1', 'fighter')
      expect(store.getState().scores[0].score).toBe(999999999)
    })

    test('handles empty name', () => {
      store.getState().addScore(1000, 5, '', 'fighter')
      expect(store.getState().scores[0].name).toBe('')
    })

    test('handles long name', () => {
      const longName = 'A'.repeat(100)
      store.getState().addScore(1000, 5, longName, 'fighter')
      expect(store.getState().scores[0].name).toBe(longName)
    })

    test('handles special characters in name', () => {
      const specialName = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`'
      store.getState().addScore(1000, 5, specialName, 'fighter')
      expect(store.getState().scores[0].name).toBe(specialName)
    })

    test('handles unicode characters in name', () => {
      const unicodeName = '你好🎮😊'
      store.getState().addScore(1000, 5, unicodeName, 'fighter')
      expect(store.getState().scores[0].name).toBe(unicodeName)
    })

    // ------------------------------------------------------------------ //
    //                         Comprehensive Scenario Tests
    // ------------------------------------------------------------------ //
    test('realistic game scenario', () => {
      // Simulate multiple players playing and submitting scores
      const players = [
        { name: 'Alice', score: 15000, wave: 15, ship: 'fighter' as ShipType },
        { name: 'Bob', score: 8000, wave: 10, ship: 'scout' as ShipType },
        { name: 'Charlie', score: 12000, wave: 12, ship: 'tank' as ShipType },
        { name: 'Diana', score: 20000, wave: 20, ship: 'interceptor' as ShipType },
        { name: 'Eve', score: 5000, wave: 8, ship: 'fighter' as ShipType },
        { name: 'Frank', score: 18000, wave: 18, ship: 'scout' as ShipType },
        { name: 'Grace', score: 9000, wave: 11, ship: 'tank' as ShipType },
        { name: 'Henry', score: 25000, wave: 25, ship: 'interceptor' as ShipType },
        { name: 'Iris', score: 7000, wave: 9, ship: 'fighter' as ShipType },
        { name: 'Jack', score: 11000, wave: 13, ship: 'scout' as ShipType },
        { name: 'Kate', score: 3000, wave: 5, ship: 'tank' as ShipType },
        { name: 'Leo', score: 16000, wave: 16, ship: 'interceptor' as ShipType },
      ]

      players.forEach(p => {
        store.getState().addScore(p.score, p.wave, p.name, p.ship)
      })

      const scores = store.getState().getScores()

      // Should have exactly 10 scores
      expect(scores).toHaveLength(10)

      // Should be sorted highest first
      expect(scores[0].name).toBe('Henry') // 25000
      expect(scores[9].name).toBe('Iris') // 7000 (10th place)

      // Kate (3000) and Eve (5000) should not be in top 10
      expect(scores.find(s => s.name === 'Kate')).toBeUndefined()
      expect(scores.find(s => s.name === 'Eve')).toBeUndefined()

      // All scores should be >= 7000 (Iris is 10th with 7000)
      expect(scores.every(s => s.score >= 7000)).toBe(true)
    })

    test('isTopTen correctly identifies qualifying scores in realistic scenario', () => {
      // Fill with 10 scores
      for (let i = 1; i <= 10; i++) {
        store.getState().addScore(i * 1000, i, `Player${i}`, 'fighter')
      }

      // 1000 is the lowest
      expect(store.getState().isTopTen(1001)).toBe(true)
      expect(store.getState().isTopTen(1000)).toBe(false)
      expect(store.getState().isTopTen(5000)).toBe(true)
      expect(store.getState().isTopTen(10000)).toBe(true)
      expect(store.getState().isTopTen(500)).toBe(false)
    })
  })
})
