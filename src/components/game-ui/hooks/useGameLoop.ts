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
 *
 * PERF: Uses refs for frequently-changing values to avoid
 * tearing down and recreating the RAF loop every frame.
 */
export function useGameLoop(params: GameLoopParams) {
  const lastTimeRef = useRef(Date.now())
  const rafRef = useRef<number | null>(null)

  // Store frequently-changing params in refs to avoid effect re-runs
  const joystickRef = useRef(params.joystickValue)
  const playerAngRef = useRef(params.playerAng)
  const playerVelRef = useRef(params.playerVel)
  const swipeImpulseRef = useRef(params.swipeImpulse)
  const autoFireRef = useRef(params.autoFire)
  const colorsRef = useRef(params.colors)
  const updateGameRef = useRef(params.updateGame)
  const fireOnceRef = useRef(params.fireOnce)

  // Update refs on every render (cheap, no effect re-run)
  joystickRef.current = params.joystickValue
  playerAngRef.current = params.playerAng
  playerVelRef.current = params.playerVel
  swipeImpulseRef.current = params.swipeImpulse
  autoFireRef.current = params.autoFire
  colorsRef.current = params.colors
  updateGameRef.current = params.updateGame
  fireOnceRef.current = params.fireOnce

  useEffect(() => {
    if (params.paused) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    lastTimeRef.current = Date.now()

    const loop = () => {
      const now = Date.now()
      const dt = Math.min((now - lastTimeRef.current) / 1000, MAX_DT)
      lastTimeRef.current = now

      const joystickValue = joystickRef.current
      const playerAng = playerAngRef.current
      const playerVel = playerVelRef.current
      const swipeImpulse = swipeImpulseRef.current

      // Apply swipe impulse to player velocity
      if (swipeImpulse.x !== 0 || swipeImpulse.y !== 0) {
        const newVel = {
          x: playerVel.x + swipeImpulse.x * 150 * dt,
          y: playerVel.y + swipeImpulse.y * 150 * dt,
        }
        useGameStore.getState().updatePlayer({ vel: newVel })

        const swipeAngle = angleOf(swipeImpulse)
        useGameStore.getState().updatePlayer({ ang: swipeAngle })
      }

      // Calculate thrust and angle from joystick
      const joyMag = len(joystickValue)
      let thrusting = false

      if (joyMag > JOY_DEADZONE) {
        const desiredAng = angleOf(joystickValue)
        thrusting = true

        let da = ((desiredAng - playerAng + Math.PI * 3) % (Math.PI * 2)) - Math.PI
        const turnSpeed = 8
        const newAng = playerAng + Math.max(-1, Math.min(1, da)) * turnSpeed * dt
        useGameStore.getState().updatePlayer({ ang: newAng })
      }

      // Auto-fire support
      const shouldFire = autoFireRef.current && joyMag > JOY_DEADZONE

      updateGameRef.current(dt, joystickValue, shouldFire, thrusting, colorsRef.current)

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [params.paused]) // Only restart loop when pause state changes
}
