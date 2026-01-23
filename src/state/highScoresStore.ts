import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import secureStorage from "../utils/secureStorage"

export interface HighScore {
  name: string
  score: number
  wave: number
  date: number
}

interface HighScoresState {
  scores: HighScore[]
  addScore: (score: number, wave: number, name: string) => void
  isTopFive: (score: number) => boolean
  getScores: () => HighScore[]
}

export const useHighScoresStore = create<HighScoresState>()(
  persist(
    (set, get) => ({
      scores: [],

      addScore: (score: number, wave: number, name: string) => {
        set((state) => {
          const newScore: HighScore = {
            name,
            score,
            wave,
            date: Date.now(),
          }
          const newScores = [...state.scores, newScore]
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
          return { scores: newScores }
        })
      },

      isTopFive: (score: number) => {
        const scores = get().scores
        if (scores.length < 5) return true
        return score > scores[scores.length - 1].score
      },

      getScores: () => get().scores,
    }),
    {
      name: "high-scores-storage",
      storage: createJSONStorage(() => secureStorage),
    }
  )
)
