import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { ShipType } from "../types/game"

export interface HighScore {
  name: string
  score: number
  wave: number
  date: number
  ship: ShipType
}

interface HighScoresState {
  scores: HighScore[]
  addScore: (score: number, wave: number, name: string, ship: ShipType) => void
  isTopTen: (score: number) => boolean
  getScores: () => HighScore[]
}

export const useHighScoresStore = create<HighScoresState>()(
  persist(
    (set, get) => ({
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
    }),
    {
      name: "high-scores-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
