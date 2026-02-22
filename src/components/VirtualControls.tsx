import React, { useState, useCallback, useMemo, useEffect } from "react"
import { View, StyleSheet, Pressable, Text } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated"
import type { Vec2, Player, ShipType } from "../types/game"
import type { ThemeColors } from "../theme/types"
import type { JoystickSize, JoystickPosition } from "../theme/themeStore"
import { hapticLight, hapticSelection } from "../utils/haptics"

interface VirtualControlsProps {
  onJoystickMove: (value: Vec2) => void
  colors: ThemeColors
  sensitivity?: number
  size?: JoystickSize
  position?: JoystickPosition
  invertY?: boolean
}

const JOY_DEADZONE = 0.1

// Size configurations
const SIZE_CONFIG = {
  small: { pad: 100, stick: 31, maxRadius: 43 },
  medium: { pad: 140, stick: 44, maxRadius: 60 },
  large: { pad: 180, stick: 56, maxRadius: 77 },
} as const

const VirtualControlsComponent: React.FC<VirtualControlsProps> = ({
  onJoystickMove,
  colors,
  sensitivity = 1.0,
  size = 'medium',
  position = 'center',
  invertY = false,
}) => {
  const [joystickActive, setJoystickActive] = useState(false)
  const joystickX = useSharedValue(0)
  const joystickY = useSharedValue(0)
  const joystickScale = useSharedValue(1)
  const lastHapticMagnitude = useSharedValue(0)
  const atBoundary = useSharedValue(false)

  // Get size configuration
  const sizeConfig = useMemo(() => SIZE_CONFIG[size], [size])
  const JOY_MAX_RADIUS = sizeConfig.maxRadius

  const handleJoystickMove = useCallback((value: Vec2) => {
    onJoystickMove(value)
  }, [onJoystickMove])

  const handleSetActive = useCallback((active: boolean) => {
    setJoystickActive(active)
  }, [])

  const handleTouchHaptic = useCallback(() => {
    hapticSelection()
  }, [])

  const handleMoveHaptic = useCallback(() => {
    hapticLight()
  }, [])

  const handleReleaseHaptic = useCallback(() => {
    hapticLight()
  }, [])

  const applySensitivityCurve = useCallback((magnitude: number, sens: number): number => {
    'worklet'
    if (sens < 1.0) {
      // Exponential curve for lower sensitivities (more precise control)
      // Using power > 1 dampens small movements
      const exponent = 2.0
      return Math.pow(magnitude, exponent)
    } else if (sens > 1.0) {
      // Quadratic curve for higher sensitivities (more aggressive response)
      // Using square root amplifies small movements while keeping max at 1.0
      return Math.sqrt(magnitude)
    } else {
      // Linear curve for 1.0x sensitivity
      return magnitude
    }
  }, [])

  const panGesture = useMemo(() => Gesture.Pan()
    .onStart(() => {
      'worklet'
      joystickScale.value = withSpring(1.15, { damping: 12 })
      runOnJS(handleSetActive)(true)
      runOnJS(handleTouchHaptic)()
    })
    .onUpdate((event) => {
      'worklet'
      const dx = event.translationX * sensitivity
      const dy = event.translationY * sensitivity
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist > JOY_MAX_RADIUS) {
        joystickX.value = (dx / dist) * JOY_MAX_RADIUS
        joystickY.value = (dy / dist) * JOY_MAX_RADIUS
      } else {
        joystickX.value = dx
        joystickY.value = dy
      }

      const normalizedX = joystickX.value / JOY_MAX_RADIUS
      const normalizedY = joystickY.value / JOY_MAX_RADIUS
      const magnitude = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY)

      // Trigger haptic when crossing 0.5 magnitude threshold
      const hapticThreshold = 0.5
      if ((lastHapticMagnitude.value < hapticThreshold && magnitude >= hapticThreshold) ||
          (lastHapticMagnitude.value >= hapticThreshold && magnitude < hapticThreshold)) {
        runOnJS(handleMoveHaptic)()
        lastHapticMagnitude.value = magnitude
      }

      // Trigger subtle haptic when reaching boundary (98% of max radius)
      const boundaryThreshold = 0.98
      if (magnitude >= boundaryThreshold && !atBoundary.value) {
        runOnJS(handleMoveHaptic)()
        atBoundary.value = true
      } else if (magnitude < boundaryThreshold) {
        atBoundary.value = false
      }

      // Apply dead zone
      if (magnitude < JOY_DEADZONE) {
        runOnJS(handleJoystickMove)({ x: 0, y: 0 })
      } else {
        // Remap from [deadzone, 1.0] to [0.0, 1.0]
        const remappedMagnitude = (magnitude - JOY_DEADZONE) / (1 - JOY_DEADZONE)

        // Apply sensitivity curve
        const curvedMagnitude = applySensitivityCurve(remappedMagnitude, sensitivity)

        const scale = curvedMagnitude / magnitude
        const finalY = normalizedY * scale * (invertY ? -1 : 1)
        runOnJS(handleJoystickMove)({ x: normalizedX * scale, y: finalY })
      }
    })
    .onEnd(() => {
      'worklet'
      joystickX.value = withSpring(0, { damping: 15 })
      joystickY.value = withSpring(0, { damping: 15 })
      joystickScale.value = withSpring(1)
      lastHapticMagnitude.value = 0
      atBoundary.value = false
      runOnJS(handleSetActive)(false)
      runOnJS(handleJoystickMove)({ x: 0, y: 0 })
      runOnJS(handleReleaseHaptic)()
    }), [handleJoystickMove, handleSetActive, handleTouchHaptic, handleMoveHaptic, handleReleaseHaptic, joystickX, joystickY, joystickScale, lastHapticMagnitude, atBoundary, sensitivity, applySensitivityCurve, invertY])

  const stickStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: joystickX.value },
      { translateY: joystickY.value },
      { scale: joystickScale.value },
    ],
  }))

  const dynamicStyles = useMemo(() => ({
    joystickPad: {
      width: sizeConfig.pad,
      height: sizeConfig.pad,
      borderRadius: sizeConfig.pad / 2,
      borderColor: colors.joystickBorder,
      backgroundColor: colors.joystickPad,
    },
    joystickStick: {
      width: sizeConfig.stick,
      height: sizeConfig.stick,
      borderRadius: sizeConfig.stick / 2,
      backgroundColor: colors.joystickStick,
      shadowColor: colors.joystickGlow,
    },
  }), [colors, sizeConfig])

  // Map position to justifyContent
  const containerAlignment = useMemo(() => {
    switch (position) {
      case 'left':
        return 'flex-start'
      case 'right':
        return 'flex-end'
      case 'center':
      default:
        return 'center'
    }
  }, [position])

  return (
    <View style={[styles.container, { justifyContent: containerAlignment }]}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.joystickContainer}>
          <View style={[styles.joystickPad, dynamicStyles.joystickPad]}>
            <Animated.View style={[styles.joystickStick, dynamicStyles.joystickStick, stickStyle]} />
          </View>
        </View>
      </GestureDetector>
    </View>
  )
}

export const VirtualControls = React.memo(VirtualControlsComponent)

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    pointerEvents: "box-none",
  },
  joystickContainer: {
    pointerEvents: "box-only",
  },
  joystickPad: {
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  joystickStick: {
    opacity: 0.85,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
  },
})
