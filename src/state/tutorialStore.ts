import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TutorialState {
  // Tutorial progress tracking
  hasCompletedTutorial: boolean;
  currentStep: number;
  canSkip: boolean;

  // Actions
  completeStep: () => void;
  skipTutorial: () => void;
  resetTutorial: () => void;
  completeTutorial: () => void;
}

const DEFAULT_TUTORIAL_STATE = {
  hasCompletedTutorial: false,
  currentStep: 0,
  canSkip: true,
};

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set) => ({
      ...DEFAULT_TUTORIAL_STATE,

      completeStep: () =>
        set((state) => ({
          currentStep: state.currentStep + 1,
        })),

      skipTutorial: () =>
        set({
          hasCompletedTutorial: true,
          currentStep: 0,
        }),

      resetTutorial: () =>
        set({
          hasCompletedTutorial: false,
          currentStep: 0,
        }),

      completeTutorial: () =>
        set({
          hasCompletedTutorial: true,
          currentStep: 0,
        }),
    }),
    {
      name: 'space-shooter-tutorial',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
