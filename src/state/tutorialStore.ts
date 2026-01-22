import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ------------------------------------------------------------------ //
//                         Tutorial Store
// ------------------------------------------------------------------ //

export type TutorialStep =
  | 'movement'
  | 'shooting'
  | 'powerups'
  | 'combo'
  | 'special-abilities'

interface TutorialState {
  // State
  tutorialCompleted: boolean
  currentStep: number
  stepsCompleted: TutorialStep[]
  skipCount: number
  firstLaunch: boolean

  // Actions
  startTutorial: () => void
  nextStep: (step: TutorialStep) => void
  completeTutorial: () => void
  skipTutorial: () => void
  resetTutorial: () => void
  markFirstLaunchComplete: () => void
  isStepCompleted: (step: TutorialStep) => boolean
}

const INITIAL_TUTORIAL_STATE = {
  tutorialCompleted: false,
  currentStep: 0,
  stepsCompleted: [] as TutorialStep[],
  skipCount: 0,
  firstLaunch: true,
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      ...INITIAL_TUTORIAL_STATE,

      startTutorial: () =>
        set({
          currentStep: 0,
          stepsCompleted: [],
        }),

      nextStep: (step) =>
        set((state) => {
          const newStepsCompleted = state.stepsCompleted.includes(step)
            ? state.stepsCompleted
            : [...state.stepsCompleted, step]

          return {
            currentStep: state.currentStep + 1,
            stepsCompleted: newStepsCompleted,
          }
        }),

      completeTutorial: () =>
        set({
          tutorialCompleted: true,
          currentStep: 0,
        }),

      skipTutorial: () =>
        set((state) => ({
          tutorialCompleted: true,
          currentStep: 0,
          skipCount: state.skipCount + 1,
        })),

      resetTutorial: () =>
        set({
          tutorialCompleted: false,
          currentStep: 0,
          stepsCompleted: [],
        }),

      markFirstLaunchComplete: () => set({ firstLaunch: false }),

      isStepCompleted: (step) => get().stepsCompleted.includes(step),
    }),
    {
      name: 'space-shooter-tutorial',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
