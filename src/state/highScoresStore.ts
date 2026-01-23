import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { GameMode } from "../types/game"

export interface HighScore {
  name: string
  score: number
  wave: number
  date: number
  gameMode: GameMode
}

interface HighScoresState {
  scores: {
    campaign: HighScore[]
    endless: HighScore[]
  }
  addScore: (score: number, wave: number, name: string, gameMode: GameMode) => void
  isTopFive: (score: number, gameMode: GameMode) => boolean
  getScores: (gameMode: GameMode) => HighScore[]
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

      getScores: (gameMode: GameMode) => get().scores[gameMode],
    }),
    {
      name: "high-scores-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
