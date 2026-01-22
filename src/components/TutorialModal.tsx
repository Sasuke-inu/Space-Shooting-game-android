import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
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

const PRACTICE_AREA_WIDTH = 280
const PRACTICE_AREA_HEIGHT = 320
const BULLET_SPEED = 5
const BULLET_SIZE = 6
const TARGET_SIZE = 40
const TARGET_HIT_RADIUS = 25 // Collision detection radius

const POWERUP_SIZE = 32

interface PowerUpInfo {
  type: 'shield' | 'rapid_fire' | 'spread_shot' | 'magnet'
  name: string
  description: string
  colorKey: keyof ThemeColors
  effect: string
}

const POWER_UP_INFO: PowerUpInfo[] = [
  {
    type: 'shield',
    name: 'Shield',
    description: 'Temporary invincibility',
    colorKey: 'powerUpShield',
    effect: 'Protects you from all damage for a short time',
  },
  {
    type: 'rapid_fire',
    name: 'Rapid Fire',
    description: '2x fire rate',
    colorKey: 'powerUpRapidFire',
    effect: 'Doubles your shooting speed temporarily',
  },
  {
    type: 'spread_shot',
    name: 'Spread Shot',
    description: 'Fire 3 bullets in spread pattern',
    colorKey: 'powerUpSpreadShot',
    effect: 'Fires three bullets at once for better coverage',
  },
  {
    type: 'magnet',
    name: 'Magnet',
    description: 'Attract nearby power-ups',
    colorKey: 'powerUpMagnet',
    effect: 'Automatically pulls power-ups towards your ship',
  },
]

interface Target {
  id: number
  x: number
  y: number
  hit: boolean
}

interface Bullet {
  id: number
  x: number
  y: number
}

// Power-ups Explanation Step Component
function PowerUpsExplanationStep({ colors }: { colors: ThemeColors }) {
  const [selectedPowerUp, setSelectedPowerUp] = useState<PowerUpInfo | null>(null)
  const [collectedPowerUps, setCollectedPowerUps] = useState<Set<string>>(new Set())

  const handleCollectPowerUp = useCallback((powerUp: PowerUpInfo) => {
    setSelectedPowerUp(powerUp)
    setCollectedPowerUps((prev) => new Set(prev).add(powerUp.type))
  }, [])

  const allCollected = collectedPowerUps.size === POWER_UP_INFO.length

  const dynamicStyles = useMemo(() => ({
    powerUpCard: (powerUp: PowerUpInfo, isSelected: boolean) => ({
      borderColor: isSelected ? colors.hudAccent : colors.panelBorder,
      backgroundColor: colors.panelBg + '80',
      opacity: collectedPowerUps.has(powerUp.type) ? 1 : 0.7,
    }),
    powerUpIcon: (colorKey: keyof ThemeColors) => ({
      backgroundColor: colors[colorKey],
      shadowColor: colors[colorKey],
    }),
  }), [colors, collectedPowerUps])

  return (
    <View style={tutorialStyles.stepContainer}>
      <Text style={[tutorialStyles.stepTitle, { color: colors.textPrimary }]}>
        Power-Ups
      </Text>

      <Text style={[tutorialStyles.stepDescription, { color: colors.textSecondary }]}>
        Collect these power-ups during gameplay to gain temporary advantages!
      </Text>

      {/* Visual indicator */}
      <View style={tutorialStyles.indicatorContainer}>
        {allCollected ? (
          <>
            <View style={[tutorialStyles.checkmark, { borderColor: colors.hudAccent }]}>
              <Text style={{ color: colors.hudAccent, fontSize: 24, fontWeight: 'bold' }}>✓</Text>
            </View>
            <Text style={[tutorialStyles.completionText, { color: colors.hudAccent }]}>
              You've learned about all power-ups!
            </Text>
          </>
        ) : (
          <Text style={[tutorialStyles.instructionText, { color: colors.textSecondary }]}>
            Tap each power-up to learn more ({collectedPowerUps.size}/{POWER_UP_INFO.length})
          </Text>
        )}
      </View>

      {/* Power-ups showcase */}
      <ScrollView
        style={{ maxHeight: 360 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 12 }}>
          {POWER_UP_INFO.map((powerUp) => {
            const isSelected = selectedPowerUp?.type === powerUp.type
            const isCollected = collectedPowerUps.has(powerUp.type)

            return (
              <Pressable
                key={powerUp.type}
                onPress={() => handleCollectPowerUp(powerUp)}
                style={[
                  tutorialStyles.powerUpCard,
                  dynamicStyles.powerUpCard(powerUp, isSelected),
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  {/* Power-up icon */}
                  <View
                    style={[
                      tutorialStyles.powerUpIcon,
                      dynamicStyles.powerUpIcon(powerUp.colorKey),
                    ]}
                  >
                    {isCollected && (
                      <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>✓</Text>
                    )}
                  </View>

                  {/* Power-up info */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                      {powerUp.name}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 6 }}>
                      {powerUp.description}
                    </Text>
                    {isSelected && (
                      <Text style={{ color: colors.hudAccent, fontSize: 12, fontStyle: 'italic' }}>
                        {powerUp.effect}
                      </Text>
                    )}
                  </View>
                </View>
              </Pressable>
            )
          })}
        </View>
      </ScrollView>

      {/* Hints */}
      <View style={tutorialStyles.hintsContainer}>
        <Text style={[tutorialStyles.hintText, { color: colors.textSecondary + '80' }]}>
          Power-ups drop from enemies and asteroids during gameplay
        </Text>
      </View>
    </View>
  )
}

// Shooting Practice Step Component
function ShootingPracticeStep({ colors }: { colors: ThemeColors }) {
  const [targets, setTargets] = useState<Target[]>([
    { id: 1, x: 70, y: 80, hit: false },
    { id: 2, x: 140, y: 120, hit: false },
    { id: 3, x: 210, y: 90, hit: false },
  ])
  const [bullets, setBullets] = useState<Bullet[]>([])
  const [completed, setCompleted] = useState(false)
  const bulletIdRef = useRef(0)
  const animationFrameRef = useRef<number | undefined>(undefined)

  // Update bullets position and check collisions
  useEffect(() => {
    const updateGame = (_timestamp: number) => {
      setBullets((prevBullets) => {
        // Filter out bullets that are off-screen
        const activeBullets = prevBullets.filter((b) => b.y > 0)

        // Move bullets upward
        return activeBullets.map((b) => ({
          ...b,
          y: b.y - BULLET_SPEED,
        }))
      })

      setTargets((prevTargets) => {
        return prevTargets.map((target) => {
          if (target.hit) return target

          // Check collision with any bullet
          const hitByBullet = bullets.some((bullet) => {
            const dx = bullet.x - target.x
            const dy = bullet.y - target.y
            const distSquared = dx * dx + dy * dy
            return distSquared < TARGET_HIT_RADIUS * TARGET_HIT_RADIUS
          })

          if (hitByBullet) {
            // Remove the hitting bullet
            setBullets((prevBullets) =>
              prevBullets.filter((bullet) => {
                const dx = bullet.x - target.x
                const dy = bullet.y - target.y
                const distSquared = dx * dx + dy * dy
                return distSquared >= TARGET_HIT_RADIUS * TARGET_HIT_RADIUS
              })
            )
            return { ...target, hit: true }
          }

          return target
        })
      })

      animationFrameRef.current = requestAnimationFrame(updateGame)
    }

    animationFrameRef.current = requestAnimationFrame(updateGame)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [bullets])

  // Check if all targets are destroyed
  useEffect(() => {
    const allDestroyed = targets.every((t) => t.hit)
    if (allDestroyed && !completed) {
      setCompleted(true)
    }
  }, [targets, completed])

  const handleTap = useCallback((event: any) => {
    const { locationX, locationY } = event.nativeEvent

    // Spawn bullet at tap location
    const newBullet: Bullet = {
      id: bulletIdRef.current++,
      x: locationX,
      y: locationY,
    }

    setBullets((prev) => [...prev, newBullet])
  }, [])

  const tapGesture = useMemo(() => Gesture.Tap().onEnd((event) => {
    'worklet'
    runOnJS(handleTap)(event)
  }), [handleTap])

  const dynamicStyles = useMemo(() => ({
    practiceArea: {
      borderColor: completed ? colors.hudAccent : colors.panelBorder,
      backgroundColor: colors.background + '40',
    },
    target: {
      backgroundColor: colors.asteroid,
      borderColor: colors.asteroid + '80',
    },
    targetHit: {
      backgroundColor: colors.particle + '20',
      borderColor: colors.particle + '40',
    },
    bullet: {
      backgroundColor: colors.playerBullet,
    },
  }), [colors, completed])

  return (
    <View style={tutorialStyles.stepContainer}>
      <Text style={[tutorialStyles.stepTitle, { color: colors.textPrimary }]}>
        Shooting Practice
      </Text>

      <Text style={[tutorialStyles.stepDescription, { color: colors.textSecondary }]}>
        Tap anywhere in the practice area to shoot. Destroy all targets!
      </Text>

      {/* Visual indicator */}
      <View style={tutorialStyles.indicatorContainer}>
        {completed ? (
          <>
            <View style={[tutorialStyles.checkmark, { borderColor: colors.hudAccent }]}>
              <Text style={{ color: colors.hudAccent, fontSize: 24, fontWeight: 'bold' }}>✓</Text>
            </View>
            <Text style={[tutorialStyles.completionText, { color: colors.hudAccent }]}>
              Excellent! All targets destroyed!
            </Text>
          </>
        ) : (
          <Text style={[tutorialStyles.instructionText, { color: colors.textSecondary }]}>
            Targets remaining: {targets.filter((t) => !t.hit).length}
          </Text>
        )}
      </View>

      {/* Practice Area */}
      <GestureDetector gesture={tapGesture}>
        <View
          style={[
            tutorialStyles.practiceArea,
            dynamicStyles.practiceArea,
          ]}
        >
          {/* Render targets */}
          {targets.map((target) => (
            <View
              key={target.id}
              style={[
                tutorialStyles.target,
                target.hit ? dynamicStyles.targetHit : dynamicStyles.target,
                {
                  left: target.x - TARGET_SIZE / 2,
                  top: target.y - TARGET_SIZE / 2,
                },
              ]}
            />
          ))}

          {/* Render bullets */}
          {bullets.map((bullet) => (
            <View
              key={bullet.id}
              style={[
                tutorialStyles.bullet,
                dynamicStyles.bullet,
                {
                  left: bullet.x - BULLET_SIZE / 2,
                  top: bullet.y - BULLET_SIZE / 2,
                },
              ]}
            />
          ))}
        </View>
      </GestureDetector>

      {/* Hints */}
      <View style={tutorialStyles.hintsContainer}>
        <Text style={[tutorialStyles.hintText, { color: colors.textSecondary + '80' }]}>
          Tap to shoot • Destroy all 3 targets
        </Text>
      </View>
    </View>
  )
}

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
        return <ShootingPracticeStep colors={colors} />

      case 'powerups':
        return <PowerUpsExplanationStep colors={colors} />

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
  practiceArea: {
    width: PRACTICE_AREA_WIDTH,
    height: PRACTICE_AREA_HEIGHT,
    borderWidth: 2,
    borderRadius: 12,
    position: 'relative',
    marginVertical: 20,
  },
  target: {
    position: 'absolute',
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    borderRadius: TARGET_SIZE / 2,
    borderWidth: 2,
  },
  bullet: {
    position: 'absolute',
    width: BULLET_SIZE,
    height: BULLET_SIZE,
    borderRadius: BULLET_SIZE / 2,
  },
  powerUpCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginVertical: 4,
  },
  powerUpIcon: {
    width: POWERUP_SIZE,
    height: POWERUP_SIZE,
    borderRadius: POWERUP_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
})
