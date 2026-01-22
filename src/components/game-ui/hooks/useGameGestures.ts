import { useRef } from 'react'
import { Gesture } from 'react-native-gesture-handler'
import type { Vec2 } from '../../../types/game'
import { nor, mul, v, angleOf } from '../../../utils/vectorMath'

interface GameGestureHandlers {
  onFire: () => void
  onSpecialAbility: () => void
  onSwipeUpdate: (impulse: Vec2) => void
  onSwipeEnd: () => void
}

interface GameGestureState {
  paused: boolean
  autoFire: boolean
  specialReady: boolean
}

/**
 * Custom hook to manage game gesture handling
 * Handles tap, double-tap, and swipe gestures
 */
export function useGameGestures(
  state: GameGestureState,
  handlers: GameGestureHandlers
) {
  const fireOnceRef = useRef(false)
  const fireOnceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const swipeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Double tap to activate special ability
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .runOnJS(true)
    .onStart(() => {
      if (state.paused) return
      if (state.specialReady) {
        handlers.onSpecialAbility()
      }
    })

  // Tap gesture to fire
  const tapGesture = Gesture.Tap()
    .runOnJS(true)
    .onStart(() => {
      if (state.paused) return
      if (!fireOnceRef.current && !state.autoFire) {
        handlers.onFire()
        fireOnceRef.current = true
        // Clear existing timeout to prevent memory leaks
        if (fireOnceTimeoutRef.current) {
          clearTimeout(fireOnceTimeoutRef.current)
        }
        fireOnceTimeoutRef.current = setTimeout(() => {
          fireOnceRef.current = false
        }, 200)
      }
    })

  // Swipe gesture for ship control
  const swipeGesture = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((event) => {
      if (state.paused) return

      const swipeX = event.velocityX / 1000
      const swipeY = event.velocityY / 1000
      const swipeMag = Math.sqrt(swipeX * swipeX + swipeY * swipeY)

      if (swipeMag > 0.3) {
        const normalized = nor(v(swipeX, swipeY))
        const impulse = mul(normalized, Math.min(swipeMag * 2, 3))
        handlers.onSwipeUpdate(impulse)
      }
    })
    .onEnd(() => {
      // Clear any existing timeout to prevent memory leaks
      if (swipeTimeoutRef.current) {
        clearTimeout(swipeTimeoutRef.current)
      }
      swipeTimeoutRef.current = setTimeout(() => handlers.onSwipeEnd(), 100)
    })

  const combinedGesture = Gesture.Race(
    doubleTapGesture,
    Gesture.Simultaneous(tapGesture, swipeGesture)
  )

  return { combinedGesture }
}
