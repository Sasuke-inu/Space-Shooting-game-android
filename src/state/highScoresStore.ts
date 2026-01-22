import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { GameMode } from "../types/game"

export interface HighScore {
  name: string
  score: number
  wave: number
  date: number
  survivalTime?: number // Time survived in seconds (endless mode only)
}

interface HighScoresState {
  scores: {
    classic: HighScore[]
    endless: HighScore[]
  }
  addScore: (score: number, wave: number, name: string, mode: GameMode, survivalTime?: number) => void
  isTopFive: (score: number, mode: GameMode) => boolean
  getScores: (mode: GameMode) => HighScore[]
}

export const useHighScoresStore = create<HighScoresState>()(
  persist(
    (set, get) => ({
      scores: {
        classic: [],
        endless: [],
      },

      addScore: (score: number, wave: number, name: string, mode: GameMode, survivalTime?: number) => {
        set((state) => {
          const newScore: HighScore = {
            name,
            score,
            wave,
            date: Date.now(),
            survivalTime,
          }
          const newScores = [...state.scores[mode], newScore]
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
          return {
            scores: {
              ...state.scores,
              [mode]: newScores,
            },
          }
        })
      },

      isTopFive: (score: number, mode: GameMode) => {
        const scores = get().scores[mode]
        if (scores.length < 5) return true
        return score > scores[scores.length - 1].score
      },

      getScores: (mode: GameMode) => get().scores[mode],
    }),
    {
      name: "high-scores-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
