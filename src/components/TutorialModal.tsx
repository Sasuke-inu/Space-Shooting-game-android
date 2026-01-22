import React, { useState, useCallback, useMemo } from 'react'
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated'
import { useThemeColors } from '../theme/themeStore'
import { useTutorialStore, TutorialStep } from '../state/tutorialStore'
import type { Vec2 } from '../types/game'
import type { ThemeColors } from '../theme/types'

interface TutorialModalProps {
  visible: boolean
  onClose: () => void
}

const TUTORIAL_STEPS: TutorialStep[] = [
  'movement',
  'shooting',
  'powerups',
  'combo',
  'special-abilities',
]

const JOY_MAX_RADIUS = 60
const MOVEMENT_THRESHOLD = 0.3 // Minimum joystick movement to count

// Movement Practice Step Component
function MovementPracticeStep({ colors }: { colors: ThemeColors }) {
  const [movementDetected, setMovementDetected] = useState(false)
  const [totalMovement, setTotalMovement] = useState(0)

  const joystickX = useSharedValue(0)
  const joystickY = useSharedValue(0)
  const joystickScale = useSharedValue(1)

  const handleJoystickMove = useCallback((value: Vec2) => {
    const magnitude = Math.sqrt(value.x * value.x + value.y * value.y)

    if (magnitude > MOVEMENT_THRESHOLD) {
      setTotalMovement((prev) => {
        const newTotal = prev + magnitude
        if (newTotal > 2 && !movementDetected) {
          setMovementDetected(true)
        }
        return newTotal
      })
    }
  }, [movementDetected])

  const handleSetActive = useCallback((active: boolean) => {
    // Optional: add visual feedback when joystick is active
  }, [])

  const panGesture = useMemo(() => Gesture.Pan()
    .onStart(() => {
      'worklet'
      joystickScale.value = withSpring(1.15, { damping: 12 })
      runOnJS(handleSetActive)(true)
    })
    .onUpdate((event) => {
      'worklet'
      const dx = event.translationX
      const dy = event.translationY
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
    }), [handleJoystickMove, handleSetActive, joystickX, joystickY, joystickScale])

  const stickStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: joystickX.value },
      { translateY: joystickY.value },
      { scale: joystickScale.value },
    ],
  }))

  const dynamicStyles = useMemo(() => ({
    joystickPad: {
      borderColor: movementDetected ? colors.hudAccent : colors.joystickBorder,
      backgroundColor: colors.joystickPad,
    },
    joystickStick: {
      backgroundColor: colors.joystickStick,
      shadowColor: colors.joystickGlow,
    },
  }), [colors, movementDetected])

  return (
    <View style={tutorialStyles.stepContainer}>
      <Text style={[tutorialStyles.stepTitle, { color: colors.textPrimary }]}>
        Movement Controls
      </Text>

      <Text style={[tutorialStyles.stepDescription, { color: colors.textSecondary }]}>
        Use the joystick below to move your ship around.
      </Text>

      {/* Visual indicator */}
      <View style={tutorialStyles.indicatorContainer}>
        {movementDetected ? (
          <>
            <View style={[tutorialStyles.checkmark, { borderColor: colors.hudAccent }]}>
              <Text style={{ color: colors.hudAccent, fontSize: 24, fontWeight: 'bold' }}>✓</Text>
            </View>
            <Text style={[tutorialStyles.completionText, { color: colors.hudAccent }]}>
              Great! You've mastered the movement controls!
            </Text>
          </>
        ) : (
          <Text style={[tutorialStyles.instructionText, { color: colors.textSecondary }]}>
            Move the joystick in any direction
          </Text>
        )}
      </View>

      {/* Practice Joystick */}
      <View style={tutorialStyles.joystickArea}>
        <GestureDetector gesture={panGesture}>
          <View style={tutorialStyles.joystickContainer}>
            <View style={[tutorialStyles.joystickPad, dynamicStyles.joystickPad]}>
              <Animated.View style={[tutorialStyles.joystickStick, dynamicStyles.joystickStick, stickStyle]} />
            </View>
          </View>
        </GestureDetector>
      </View>

      {/* Directional hints */}
      <View style={tutorialStyles.hintsContainer}>
        <Text style={[tutorialStyles.hintText, { color: colors.textSecondary + '80' }]}>
          ← Drag in any direction →
        </Text>
      </View>
    </View>
  )
}

export function TutorialModal({ visible, onClose }: TutorialModalProps) {
  const insets = useSafeAreaInsets()
  const colors = useThemeColors()

  const currentStep = useTutorialStore((s) => s.currentStep)
  const nextStep = useTutorialStore((s) => s.nextStep)
  const skipTutorial = useTutorialStore((s) => s.skipTutorial)
  const completeTutorial = useTutorialStore((s) => s.completeTutorial)

  const totalSteps = TUTORIAL_STEPS.length
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1

  const handleNext = () => {
    if (isLastStep) {
      // Complete the tutorial
      completeTutorial()
      onClose()
    } else {
      // Move to next step
      const currentStepType = TUTORIAL_STEPS[currentStep]
      nextStep(currentStepType)
    }
  }

  const handleBack = () => {
    if (!isFirstStep) {
      const store = useTutorialStore.getState()
      store.startTutorial()
      // Set the current step back by one
      useTutorialStore.setState({ currentStep: currentStep - 1 })
    }
  }

  const handleSkip = () => {
    skipTutorial()
    onClose()
  }

  const renderStepContent = () => {
    const stepType = TUTORIAL_STEPS[currentStep]

    switch (stepType) {
      case 'movement':
        return <MovementPracticeStep colors={colors} />

      case 'shooting':
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
              Shooting Practice
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
              Tap anywhere on the screen to shoot enemies and asteroids.
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', fontStyle: 'italic' }}>
              (Target practice will be added in the next step)
            </Text>
          </View>
        )

      case 'powerups':
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
              Power-Ups
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
              Collect power-ups to gain temporary abilities like shields, rapid fire, and more!
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', fontStyle: 'italic' }}>
              (Visual showcase will be added in the next step)
            </Text>
          </View>
        )

      case 'combo':
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
              Combo System
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
              Destroy enemies quickly to build combos and multiply your score!
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', fontStyle: 'italic' }}>
              (Combo practice will be added in the next step)
            </Text>
          </View>
        )

      case 'special-abilities':
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
              Special Abilities
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
              Double-tap anywhere to activate your ship's special ability!
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', fontStyle: 'italic' }}>
              (Ability tutorial will be added in the next step)
            </Text>
          </View>
        )

      default:
        return null
    }
  }

  const renderProgressIndicator = () => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
        {TUTORIAL_STEPS.map((_, index) => (
          <View
            key={index}
            style={{
              width: index === currentStep ? 32 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: index === currentStep
                ? colors.hudAccent
                : index < currentStep
                ? colors.hudAccent + '60'
                : colors.panelBorder + '40',
            }}
          />
        ))}
      </View>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleSkip}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.85)',
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        {/* Header with Skip button */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
          }}
        >
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>
            Tutorial
          </Text>
          <Pressable
            onPress={handleSkip}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: colors.buttonSecondary + '40',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.panelBorder,
            }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Skip</Text>
          </Pressable>
        </View>

        {/* Progress indicator */}
        {renderProgressIndicator()}

        {/* Step content */}
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
            }}
          >
            {renderStepContent()}
          </ScrollView>
        </View>

        {/* Navigation buttons */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 20,
            gap: 12,
          }}
        >
          {/* Back button */}
          <Pressable
            onPress={handleBack}
            disabled={isFirstStep}
            style={{
              flex: 1,
              paddingVertical: 14,
              backgroundColor: isFirstStep ? colors.buttonSecondary + '20' : colors.buttonSecondary,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.panelBorder,
              opacity: isFirstStep ? 0.3 : 1,
            }}
          >
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 16,
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              Back
            </Text>
          </Pressable>

          {/* Step indicator text */}
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
            {currentStep + 1} of {totalSteps}
          </Text>

          {/* Next/Finish button */}
          <Pressable
            onPress={handleNext}
            style={{
              flex: 1,
              paddingVertical: 14,
              backgroundColor: colors.buttonPrimary,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.buttonPrimary,
            }}
          >
            <Text
              style={{
                color: colors.buttonText,
                fontSize: 16,
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              {isLastStep ? 'Finish' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const tutorialStyles = StyleSheet.create({
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  indicatorContainer: {
    alignItems: 'center',
    marginBottom: 32,
    minHeight: 80,
  },
  checkmark: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  joystickArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
  },
  joystickContainer: {
    pointerEvents: 'box-only',
  },
  joystickPad: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
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
  hintsContainer: {
    marginTop: 20,
  },
  hintText: {
    fontSize: 14,
    textAlign: 'center',
  },
})
