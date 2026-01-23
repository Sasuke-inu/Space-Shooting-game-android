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
import { SHIP_STATS, ABILITY_STATS } from "../types/game"

interface VirtualControlsProps {
  onJoystickMove: (value: Vec2) => void
  colors: ThemeColors
  sensitivity?: number
  player: Player
  onAbilityPress: () => void
}

const JOY_MAX_RADIUS = 60

// Helper function to map ship special ability name to ability type
const getAbilityTypeFromShip = (shipType: ShipType): string => {
  const specialName = SHIP_STATS[shipType].special
  const abilityMap: Record<string, string> = {
    'EMP Blast': 'emp_blast',
    'Missile Barrage': 'missile_barrage',
    'Time Warp': 'time_warp',
    'Shield Burst': 'shield_burst',
  }
  return abilityMap[specialName] || 'emp_blast'
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({
  onJoystickMove,
  colors,
  sensitivity = 1.0,
  player,
  onAbilityPress,
}) => {
  const [joystickActive, setJoystickActive] = useState(false)
  const joystickX = useSharedValue(0)
  const joystickY = useSharedValue(0)
  const joystickScale = useSharedValue(1)
  const cooldownProgress = useSharedValue(0)

  const handleJoystickMove = useCallback((value: Vec2) => {
    onJoystickMove(value)
  }, [onJoystickMove])

  const handleSetActive = useCallback((active: boolean) => {
    setJoystickActive(active)
  }, [])

  // Calculate cooldown progress
  useEffect(() => {
    const abilityType = getAbilityTypeFromShip(player.shipType) as keyof typeof ABILITY_STATS
    const maxCooldown = ABILITY_STATS[abilityType].cooldown
    const progress = player.specialReady ? 0 : player.specialCooldown / maxCooldown
    cooldownProgress.value = withTiming(progress, { duration: 50 })
  }, [player.specialCooldown, player.specialReady, player.shipType, cooldownProgress])

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
      runOnJS(handleJoystickMove)({ x: normalizedX, y: normalizedY })
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

  const cooldownOverlayStyle = useAnimatedStyle(() => {
    const rotation = cooldownProgress.value * 360
    return {
      transform: [{ rotate: `${rotation}deg` }],
      opacity: cooldownProgress.value > 0 ? 0.6 : 0,
    }
  })

  const dynamicStyles = useMemo(() => ({
    joystickPad: {
      borderColor: colors.joystickBorder,
      backgroundColor: colors.joystickPad,
    },
    joystickStick: {
      backgroundColor: colors.joystickStick,
      shadowColor: colors.joystickGlow,
    },
    abilityButton: {
      backgroundColor: colors.buttonPrimary,
    },
    cooldownOverlay: {
      borderColor: colors.textPrimary,
    },
    abilityText: {
      color: colors.textPrimary,
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

      {/* Special ability button */}
      <View style={styles.abilityButtonContainer}>
        <Pressable
          style={[
            styles.abilityButton,
            dynamicStyles.abilityButton,
            !player.specialReady && { opacity: 0.4 }
          ]}
          onPress={player.specialReady ? onAbilityPress : undefined}
          disabled={!player.specialReady}
        >
          <Text style={[styles.abilityText, dynamicStyles.abilityText]}>
            {SHIP_STATS[player.shipType].special}
          </Text>
        </Pressable>
        <Animated.View
          style={[
            styles.cooldownOverlay,
            dynamicStyles.cooldownOverlay,
            cooldownOverlayStyle
          ]}
          pointerEvents="none"
        />
      </View>
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
  abilityButtonContainer: {
    position: "absolute",
    right: 20,
    bottom: 0,
    width: 70,
    height: 70,
  },
  abilityButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 5,
  },
  cooldownOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderTopColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
  },
  abilityText: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
})
