import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import secureStorage from "../utils/secureStorage"

export interface HighScore {
  name: string
  score: number
  wave: number
  date: number
  gameMode: GameMode
}

interface HighScoresState {
  scores: HighScore[]
  addScore: (score: number, wave: number, name: string, ship: ShipType) => void
  isTopTen: (score: number) => boolean
  getScores: () => HighScore[]
  backup: () => Promise<boolean>
  restore: () => Promise<boolean>
}

export const useHighScoresStore = create<HighScoresState>()(
  persist(
    (set, get) => ({
      scores: {
        campaign: [],
        endless: [],
      },

      addScore: (score: number, wave: number, name: string, gameMode: GameMode) => {
        set((state) => {
          const newScore: HighScore = {
            name,
            score,
            wave,
            date: Date.now(),
            gameMode,
          }
          const currentModeScores = state.scores[gameMode]
          const newModeScores = [...currentModeScores, newScore]
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
          return {
            scores: {
              ...state.scores,
              [gameMode]: newModeScores,
            },
          }
        })
      },

      isTopFive: (score: number, gameMode: GameMode) => {
        const scores = get().scores[gameMode]
        if (scores.length < 5) return true
        return score > scores[scores.length - 1].score
      },

      getScores: () => get().scores,

      backup: async () => {
        return await backupStore('highScores')
      },

      restore: async () => {
        return await restoreStore('highScores')
      },
    }),
    {
      name: "high-scores-storage",
      storage: createJSONStorage(() => secureStorage),
    }
  )
)
