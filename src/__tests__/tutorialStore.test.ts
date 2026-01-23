/**
 * Tutorial Store Unit Tests
 * Tests tutorial state management and progression
 */

// Mock AsyncStorage before imports
const mockStorage = {
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
}

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: mockStorage,
}))

import { useTutorialStore } from '../state/tutorialStore'

// Reset store before each test
beforeEach(() => {
  const store = useTutorialStore.getState()
  store.resetTutorial()
  // Reset first launch flag for tests
  useTutorialStore.setState({ firstLaunch: true, skipCount: 0 })
})

describe('tutorialStore', () => {
  // ------------------------------------------------------------------ //
  //                         Initial State
  // ------------------------------------------------------------------ //
  describe('initial state', () => {
    test('has correct initial values', () => {
      const state = useTutorialStore.getState()
      expect(state.tutorialCompleted).toBe(false)
      expect(state.currentStep).toBe(0)
      expect(state.stepsCompleted).toEqual([])
      expect(state.skipCount).toBe(0)
      expect(state.firstLaunch).toBe(true)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Tutorial Flow
  // ------------------------------------------------------------------ //
  describe('tutorial flow', () => {
    test('starts tutorial correctly', () => {
      const store = useTutorialStore.getState()
      store.startTutorial()

      const state = useTutorialStore.getState()
      expect(state.currentStep).toBe(0)
      expect(state.stepsCompleted).toEqual([])
    })

    test('advances through tutorial steps', () => {
      const store = useTutorialStore.getState()

      store.startTutorial()

      // Complete step 1: movement
      store.nextStep('movement')
      let state = useTutorialStore.getState()
      expect(state.currentStep).toBe(1)
      expect(state.stepsCompleted).toContain('movement')

      // Complete step 2: shooting
      store.nextStep('shooting')
      state = useTutorialStore.getState()
      expect(state.currentStep).toBe(2)
      expect(state.stepsCompleted).toContain('movement')
      expect(state.stepsCompleted).toContain('shooting')

      // Complete step 3: powerups
      store.nextStep('powerups')
      state = useTutorialStore.getState()
      expect(state.currentStep).toBe(3)
      expect(state.stepsCompleted).toContain('powerups')

      // Complete step 4: combo
      store.nextStep('combo')
      state = useTutorialStore.getState()
      expect(state.currentStep).toBe(4)
      expect(state.stepsCompleted).toContain('combo')

      // Complete step 5: special-abilities
      store.nextStep('special-abilities')
      state = useTutorialStore.getState()
      expect(state.currentStep).toBe(5)
      expect(state.stepsCompleted).toContain('special-abilities')
    })

    test('completes tutorial correctly', () => {
      const store = useTutorialStore.getState()
      store.completeTutorial()

      const state = useTutorialStore.getState()
      expect(state.tutorialCompleted).toBe(true)
      expect(state.currentStep).toBe(0)
    })

    test('does not add duplicate steps to stepsCompleted', () => {
      const store = useTutorialStore.getState()

      store.startTutorial()
      store.nextStep('movement')
      store.nextStep('movement') // Try to add same step again

      const state = useTutorialStore.getState()
      // Should only have one 'movement' entry
      const movementSteps = state.stepsCompleted.filter(s => s === 'movement')
      expect(movementSteps.length).toBe(1)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Skip Functionality
  // ------------------------------------------------------------------ //
  describe('skip functionality', () => {
    test('skips tutorial and marks as completed', () => {
      const store = useTutorialStore.getState()

      store.startTutorial()
      store.skipTutorial()

      const state = useTutorialStore.getState()
      expect(state.tutorialCompleted).toBe(true)
      expect(state.currentStep).toBe(0)
      expect(state.skipCount).toBe(1)
    })

    test('tracks skip count across multiple skips', () => {
      const store = useTutorialStore.getState()

      store.skipTutorial()
      let state = useTutorialStore.getState()
      expect(state.skipCount).toBe(1)

      store.resetTutorial()
      store.skipTutorial()
      state = useTutorialStore.getState()
      expect(state.skipCount).toBe(2)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Reset Functionality
  // ------------------------------------------------------------------ //
  describe('reset functionality', () => {
    test('resets tutorial to initial state', () => {
      const store = useTutorialStore.getState()

      // Complete tutorial
      store.startTutorial()
      store.nextStep('movement')
      store.nextStep('shooting')
      store.completeTutorial()

      let state = useTutorialStore.getState()
      expect(state.tutorialCompleted).toBe(true)

      // Reset tutorial
      store.resetTutorial()

      state = useTutorialStore.getState()
      expect(state.tutorialCompleted).toBe(false)
      expect(state.currentStep).toBe(0)
      expect(state.stepsCompleted).toEqual([])
    })
  })

  // ------------------------------------------------------------------ //
  //                         First Launch
  // ------------------------------------------------------------------ //
  describe('first launch', () => {
    test('tracks first launch state', () => {
      const store = useTutorialStore.getState()

      let state = useTutorialStore.getState()
      expect(state.firstLaunch).toBe(true)

      store.markFirstLaunchComplete()

      state = useTutorialStore.getState()
      expect(state.firstLaunch).toBe(false)
    })

    test('marks first launch as complete when tutorial starts', () => {
      const store = useTutorialStore.getState()

      let state = useTutorialStore.getState()
      expect(state.firstLaunch).toBe(true)

      store.markFirstLaunchComplete()

      state = useTutorialStore.getState()
      expect(state.firstLaunch).toBe(false)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Step Completion Check
  // ------------------------------------------------------------------ //
  describe('step completion check', () => {
    test('correctly checks if step is completed', () => {
      const store = useTutorialStore.getState()

      store.startTutorial()
      store.nextStep('movement')
      store.nextStep('shooting')

      expect(store.isStepCompleted('movement')).toBe(true)
      expect(store.isStepCompleted('shooting')).toBe(true)
      expect(store.isStepCompleted('powerups')).toBe(false)
      expect(store.isStepCompleted('combo')).toBe(false)
      expect(store.isStepCompleted('special-abilities')).toBe(false)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Full Tutorial Flow
  // ------------------------------------------------------------------ //
  describe('full tutorial flow', () => {
    test('completes entire tutorial successfully', () => {
      const store = useTutorialStore.getState()

      // Start tutorial (simulating first launch)
      store.startTutorial()

      let state = useTutorialStore.getState()
      expect(state.currentStep).toBe(0)
      expect(state.tutorialCompleted).toBe(false)

      // Complete all 5 steps
      const steps: Array<'movement' | 'shooting' | 'powerups' | 'combo' | 'special-abilities'> = [
        'movement',
        'shooting',
        'powerups',
        'combo',
        'special-abilities',
      ]

      steps.forEach((step, index) => {
        store.nextStep(step)
        const currentState = useTutorialStore.getState()
        expect(currentState.currentStep).toBe(index + 1)
        expect(store.isStepCompleted(step)).toBe(true)
      })

      // All steps should be completed
      state = useTutorialStore.getState()
      expect(state.stepsCompleted.length).toBe(5)

      // Complete tutorial
      store.completeTutorial()

      state = useTutorialStore.getState()
      expect(state.tutorialCompleted).toBe(true)
      expect(state.currentStep).toBe(0)

      // Mark first launch as complete
      store.markFirstLaunchComplete()

      state = useTutorialStore.getState()
      expect(state.firstLaunch).toBe(false)
    })
  })

  // ------------------------------------------------------------------ //
  //                         Replay Tutorial Flow
  // ------------------------------------------------------------------ //
  describe('replay tutorial flow', () => {
    test('allows tutorial to be replayed after completion', () => {
      const store = useTutorialStore.getState()

      // Complete tutorial first time
      store.startTutorial()
      store.nextStep('movement')
      store.nextStep('shooting')
      store.nextStep('powerups')
      store.nextStep('combo')
      store.nextStep('special-abilities')
      store.completeTutorial()
      store.markFirstLaunchComplete()

      let state = useTutorialStore.getState()
      expect(state.tutorialCompleted).toBe(true)
      expect(state.firstLaunch).toBe(false)

      // Reset and replay tutorial
      store.resetTutorial()

      state = useTutorialStore.getState()
      expect(state.tutorialCompleted).toBe(false)
      expect(state.currentStep).toBe(0)
      expect(state.stepsCompleted).toEqual([])

      // Should be able to start and complete again
      store.startTutorial()
      store.nextStep('movement')

      state = useTutorialStore.getState()
      expect(state.currentStep).toBe(1)
      expect(store.isStepCompleted('movement')).toBe(true)
    })
  })
})
