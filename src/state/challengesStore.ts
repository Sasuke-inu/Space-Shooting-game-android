import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Challenge, ChallengeType } from '../types/game'
import { CHALLENGE_CONFIGS } from '../types/game'

// ------------------------------------------------------------------ //
//                         Challenges Store
// ------------------------------------------------------------------ //

interface ChallengesState {
  challenges: Challenge[]
  lastRefresh: number
  completedToday: number
  recentCompletion: string | null  // ID of recently completed challenge

  // Actions
  updateProgress: (id: string, progress: number) => void
  completeChallenge: (id: string) => void
  clearRecentCompletion: () => void
  checkAndRefreshChallenges: () => void
  generateChallenges: () => void
  isCompleted: (id: string) => boolean
  getProgress: (id: string) => number
}

// Helper function to generate a random challenge
const generateRandomChallenge = (index: number): Challenge => {
  const types: ChallengeType[] = ['kill_count', 'combo', 'survival', 'boss', 'accuracy', 'power_up', 'no_damage']
  const type = types[Math.floor(Math.random() * types.length)]
  const config = CHALLENGE_CONFIGS[type]

  // Generate target within min/max range
  const target = Math.floor(
    config.minTarget + Math.random() * (config.maxTarget - config.minTarget + 1)
  )

  // Calculate reward based on target
  const reward = config.baseReward + Math.floor((target - config.minTarget) * config.rewardMultiplier)

  // Challenge names and descriptions by type
  const templates: Record<ChallengeType, { name: string; description: string; icon: string }> = {
    kill_count: {
      name: 'Enemy Hunter',
      description: `Destroy ${target} enemies`,
      icon: '🎯'
    },
    combo: {
      name: 'Combo Streak',
      description: `Achieve a ${target}x combo`,
      icon: '🔥'
    },
    survival: {
      name: 'Survivor',
      description: `Reach wave ${target}`,
      icon: '🛡️'
    },
    boss: {
      name: 'Boss Battle',
      description: `Defeat ${target} boss${target > 1 ? 'es' : ''}`,
      icon: '👑'
    },
    accuracy: {
      name: 'Sharpshooter',
      description: `Achieve ${target}% accuracy`,
      icon: '🎯'
    },
    power_up: {
      name: 'Power Collector',
      description: `Collect ${target} power-ups`,
      icon: '💎'
    },
    no_damage: {
      name: 'Flawless',
      description: `Complete ${target} wave${target > 1 ? 's' : ''} without damage`,
      icon: '✨'
    },
  }

  const template = templates[type]

  return {
    id: `challenge_${Date.now()}_${index}`,
    type,
    name: template.name,
    description: template.description,
    target,
    progress: 0,
    completed: false,
    reward,
    icon: template.icon,
  }
}

// Helper function to check if it's a new day (past midnight)
const isNewDay = (lastRefresh: number): boolean => {
  const now = new Date()
  const last = new Date(lastRefresh)

  // Check if dates are different days
  return now.toDateString() !== last.toDateString()
}

export const useChallengesStore = create<ChallengesState>()(
  persist(
    (set, get) => ({
      challenges: [],
      lastRefresh: 0,
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

            // Import dynamically to avoid circular dependency
            import('./progressStore').then(({ useUpgradesStore }) => {
              useUpgradesStore.getState().addCredits(challenge.reward)
            })

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

          // Award credits
          import('./progressStore').then(({ useUpgradesStore }) => {
            useUpgradesStore.getState().addCredits(challenge.reward)
          })

          return {
            challenges: newChallenges,
            completedToday: state.completedToday + 1,
            recentCompletion: id,
          }
        }),

      clearRecentCompletion: () => set({ recentCompletion: null }),

      checkAndRefreshChallenges: () => {
        const state = get()

        // If no challenges or new day, refresh
        if (state.challenges.length === 0 || isNewDay(state.lastRefresh)) {
          get().generateChallenges()
        }
      },

      generateChallenges: () =>
        set(() => {
          // Generate 3-5 random challenges
          const count = 3 + Math.floor(Math.random() * 3) // 3-5 challenges
          const newChallenges: Challenge[] = []

          for (let i = 0; i < count; i++) {
            newChallenges.push(generateRandomChallenge(i))
          }

          return {
            challenges: newChallenges,
            lastRefresh: Date.now(),
            completedToday: 0,
            recentCompletion: null,
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
    }),
    {
      name: 'space-shooter-challenges',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
