import { useEffect, useRef } from 'react'
import { useGameStore, MAX_DT, JOY_DEADZONE } from '../../../state/gameStore'
import { len, angleOf } from '../../../utils/vectorMath'
import type { Vec2 } from '../../../types/game'
import type { ThemeColors } from '../../../theme/types'

interface GameLoopParams {
  paused: boolean
  joystickValue: Vec2
  playerAng: number
  playerVel: Vec2
  swipeImpulse: Vec2
  autoFire: boolean
  colors: ThemeColors
  updateGame: (
    dt: number,
    joystickValue: Vec2,
    shouldFire: boolean,
    thrusting: boolean,
    colors: ThemeColors
  ) => void
  fireOnce: () => void
}

/**
 * Custom hook to manage the game loop
 * Handles frame updates, player movement, and firing
 */
export function useGameLoop(params: GameLoopParams) {
  const lastTimeRef = useRef(Date.now())
  const rafRef = useRef<number | null>(null)
  const fireOnceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const swipeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (params.paused) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    const loop = () => {
      const now = Date.now()
      const dt = Math.min((now - lastTimeRef.current) / 1000, MAX_DT)
      lastTimeRef.current = now

      // Apply swipe impulse to player velocity
      if (params.swipeImpulse.x !== 0 || params.swipeImpulse.y !== 0) {
        const currentVel = params.playerVel
        const newVel = {
          x: currentVel.x + params.swipeImpulse.x * 150 * dt,
          y: currentVel.y + params.swipeImpulse.y * 150 * dt,
        }
        useGameStore.getState().updatePlayer({ vel: newVel })

        const swipeAngle = angleOf(params.swipeImpulse)
        useGameStore.getState().updatePlayer({ ang: swipeAngle })
      }

      // Calculate thrust and angle from joystick
      const joyMag = len(params.joystickValue)
      let thrusting = false
      let desiredAng = params.playerAng

      if (joyMag > JOY_DEADZONE) {
        desiredAng = angleOf(params.joystickValue)
        thrusting = true

        let da = ((desiredAng - params.playerAng + Math.PI * 3) % (Math.PI * 2)) - Math.PI
        const turnSpeed = 8
        const newAng = params.playerAng + Math.max(-1, Math.min(1, da)) * turnSpeed * dt
        useGameStore.getState().updatePlayer({ ang: newAng })
      }

      // Auto-fire support
      const shouldFire = params.autoFire && joyMag > JOY_DEADZONE

      params.updateGame(dt, params.joystickValue, shouldFire, thrusting, params.colors)

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      // Cleanup timeouts to prevent memory leaks
      if (fireOnceTimeoutRef.current) {
        clearTimeout(fireOnceTimeoutRef.current)
      }
      if (swipeTimeoutRef.current) {
        clearTimeout(swipeTimeoutRef.current)
      }
    }
  }, [
    params.paused,
    params.joystickValue,
    params.playerAng,
    params.swipeImpulse,
    params.playerVel,
    params.fireOnce,
    params.updateGame,
    params.autoFire,
    params.colors,
  ])
}
