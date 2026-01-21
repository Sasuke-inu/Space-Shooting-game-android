import React, { useState, useCallback, useMemo } from "react"
import { View, StyleSheet } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated"
import type { Vec2 } from "../types/game"
import type { ThemeColors } from "../theme/types"

interface VirtualControlsProps {
  onJoystickMove: (value: Vec2) => void
  colors: ThemeColors
  sensitivity?: number
}

const JOY_MAX_RADIUS = 60
const JOY_DEADZONE = 0.1

export const VirtualControls: React.FC<VirtualControlsProps> = ({
  onJoystickMove,
  colors,
  sensitivity = 1.0,
}) => {
  const [joystickActive, setJoystickActive] = useState(false)
  const joystickX = useSharedValue(0)
  const joystickY = useSharedValue(0)
  const joystickScale = useSharedValue(1)

  const handleJoystickMove = useCallback((value: Vec2) => {
    onJoystickMove(value)
  }, [onJoystickMove])

  const handleSetActive = useCallback((active: boolean) => {
    setJoystickActive(active)
  }, [])

  const panGesture = useMemo(() => Gesture.Pan()
    .onStart(() => {
      'worklet'
      joystickScale.value = withSpring(1.15, { damping: 12 })
      runOnJS(handleSetActive)(true)
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

      // Apply dead zone
      if (magnitude < JOY_DEADZONE) {
        runOnJS(handleJoystickMove)({ x: 0, y: 0 })
      } else {
        // Remap from [deadzone, 1.0] to [0.0, 1.0]
        const remappedMagnitude = (magnitude - JOY_DEADZONE) / (1 - JOY_DEADZONE)
        const scale = remappedMagnitude / magnitude
        runOnJS(handleJoystickMove)({ x: normalizedX * scale, y: normalizedY * scale })
      }
    })
    .onEnd(() => {
      'worklet'
      joystickX.value = withSpring(0, { damping: 15 })
      joystickY.value = withSpring(0, { damping: 15 })
      joystickScale.value = withSpring(1)
      runOnJS(handleSetActive)(false)
      runOnJS(handleJoystickMove)({ x: 0, y: 0 })
    }), [handleJoystickMove, handleSetActive, joystickX, joystickY, joystickScale, sensitivity])

  const stickStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: joystickX.value },
      { translateY: joystickY.value },
      { scale: joystickScale.value },
    ],
  }))

  const dynamicStyles = useMemo(() => ({
    joystickPad: {
      borderColor: colors.joystickBorder,
      backgroundColor: colors.joystickPad,
    },
    joystickStick: {
      backgroundColor: colors.joystickStick,
      shadowColor: colors.joystickGlow,
    },
  }), [colors])

  return (
    <View style={styles.container}>
      {/* Center joystick */}
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

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "box-none",
  },
  joystickContainer: {
    pointerEvents: "box-only",
  },
  joystickPad: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  joystickStick: {
    width: 44,
    height: 44,
    borderRadius: 22,
    opacity: 0.85,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
  },
})
