import React, { useMemo, useEffect } from "react"
import { View, Text, Modal, Pressable, StyleSheet, useWindowDimensions } from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated"
import { useThemeColors } from "../theme/themeStore"
import { useI18nStore } from "../i18n/store"

interface TutorialOverlayProps {
  visible: boolean
  currentStep: number
  onNextStep: () => void
  onSkip: () => void
  onComplete: () => void
}

const TOTAL_STEPS = 6 // movement, firing, powerups, combos, abilities, complete

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  visible,
  currentStep,
  onNextStep,
  onSkip,
  onComplete,
}) => {
  const colors = useThemeColors()
  const t = useI18nStore((s) => s.t)
  const { width, height } = useWindowDimensions()

  // Pulsing animation for highlights
  const pulseScale = useSharedValue(1)
  const pulseOpacity = useSharedValue(0.6)

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
    pulseOpacity.value = withRepeat(
      withTiming(0.9, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [])

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }))

  const stepContent = useMemo(() => {
    const steps = [
      { key: "movement", text: t("tutorial.movement") },
      { key: "firing", text: t("tutorial.firing") },
      { key: "powerups", text: t("tutorial.powerups") },
      { key: "combos", text: t("tutorial.combos") },
      { key: "abilities", text: t("tutorial.abilities") },
      { key: "complete", text: t("tutorial.complete") },
    ]
    return steps[currentStep] || steps[0]
  }, [currentStep, t])

  const isLastStep = currentStep >= TOTAL_STEPS - 1

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      onNextStep()
    }
  }

  const dynamicStyles = useMemo(
    () => ({
      overlay: {
        backgroundColor: `${colors.background}E6`, // 90% opacity
      },
      panel: {
        backgroundColor: colors.panelBg,
        borderColor: colors.hudAccent,
      },
      title: {
        color: colors.hudAccent,
      },
      text: {
        color: colors.hudText,
      },
      buttonPrimary: {
        backgroundColor: colors.hudAccent,
      },
      buttonSecondary: {
        backgroundColor: "transparent",
        borderColor: colors.hudText,
      },
      buttonTextPrimary: {
        color: colors.background,
      },
      buttonTextSecondary: {
        color: colors.hudText,
      },
      progressDot: {
        backgroundColor: colors.hudText,
      },
      progressDotActive: {
        backgroundColor: colors.hudAccent,
      },
      highlight: {
        borderColor: colors.hudAccent,
      },
      highlightGlow: {
        backgroundColor: `${colors.hudAccent}40`, // 25% opacity
      },
      arrow: {
        color: colors.hudAccent,
      },
    }),
    [colors]
  )

  // Calculate positions for visual guidance based on screen dimensions
  const positions = useMemo(() => ({
    joystick: { x: width / 2, y: height - 84 }, // Bottom center
    fireButton: { x: width / 2, y: height / 2 }, // Center of screen
    powerUp: { x: width / 2, y: height / 3 }, // Upper middle area
    combo: { x: width / 2, y: 80 }, // Top center
    specialAbility: { x: width - 50, y: height - 100 }, // Bottom right
  }), [width, height])

  // Render visual guidance based on current step
  const renderGuidance = () => {
    switch (currentStep) {
      case 0: // Movement - Highlight joystick
        return (
          <Animated.View
            style={[
              styles.highlightCircle,
              {
                left: positions.joystick.x - 80,
                top: positions.joystick.y - 80,
              },
              dynamicStyles.highlight,
              pulseStyle,
            ]}
          >
            <View style={[styles.highlightGlow, dynamicStyles.highlightGlow]} />
          </Animated.View>
        )

      case 1: // Firing - Highlight center screen (tap area)
        return (
          <>
            <Animated.View
              style={[
                styles.highlightCircle,
                {
                  left: positions.fireButton.x - 50,
                  top: positions.fireButton.y - 50,
                },
                dynamicStyles.highlight,
                pulseStyle,
              ]}
            >
              <View style={[styles.highlightGlow, dynamicStyles.highlightGlow]} />
            </Animated.View>
            <Text
              style={[
                styles.arrowText,
                {
                  left: positions.fireButton.x - 10,
                  top: positions.fireButton.y - 80,
                },
                dynamicStyles.arrow,
              ]}
            >
              👆
            </Text>
          </>
        )

      case 2: // Power-ups - Show power-up example
        return (
          <>
            <View
              style={[
                styles.powerUpExample,
                {
                  left: positions.powerUp.x - 60,
                  top: positions.powerUp.y - 60,
                },
              ]}
            >
              <Animated.View style={[styles.powerUpIcon, { backgroundColor: colors.powerUpShield }, pulseStyle]}>
                <Text style={styles.powerUpEmoji}>🛡</Text>
              </Animated.View>
              <Animated.View style={[styles.powerUpIcon, { backgroundColor: colors.powerUpRapidFire, marginLeft: 50 }, pulseStyle]}>
                <Text style={styles.powerUpEmoji}>🔥</Text>
              </Animated.View>
              <Animated.View style={[styles.powerUpIcon, { backgroundColor: colors.powerUpSpreadShot, marginLeft: 100 }, pulseStyle]}>
                <Text style={styles.powerUpEmoji}>💥</Text>
              </Animated.View>
              <Animated.View style={[styles.powerUpIcon, { backgroundColor: colors.powerUpMagnet, marginLeft: 150 }, pulseStyle]}>
                <Text style={styles.powerUpEmoji}>🧲</Text>
              </Animated.View>
            </View>
            <Text
              style={[
                styles.arrowText,
                {
                  left: positions.powerUp.x + 80,
                  top: positions.powerUp.y - 20,
                },
                dynamicStyles.arrow,
              ]}
            >
              ← Collect these!
            </Text>
          </>
        )

      case 3: // Combos - Highlight combo indicator
        return (
          <>
            <Animated.View
              style={[
                styles.highlightBox,
                {
                  left: positions.combo.x - 60,
                  top: positions.combo.y - 20,
                },
                dynamicStyles.highlight,
                pulseStyle,
              ]}
            >
              <View style={[styles.highlightGlow, dynamicStyles.highlightGlow]} />
            </Animated.View>
            <Text
              style={[
                styles.arrowText,
                {
                  left: positions.combo.x - 50,
                  top: positions.combo.y - 50,
                },
                dynamicStyles.arrow,
              ]}
            >
              ☝️ Watch here!
            </Text>
          </>
        )

      case 4: // Abilities - Highlight special ability button
        return (
          <>
            <Animated.View
              style={[
                styles.highlightCircle,
                {
                  left: positions.specialAbility.x - 40,
                  top: positions.specialAbility.y - 40,
                },
                dynamicStyles.highlight,
                pulseStyle,
              ]}
            >
              <View style={[styles.highlightGlow, dynamicStyles.highlightGlow]} />
            </Animated.View>
            <Text
              style={[
                styles.arrowText,
                {
                  left: positions.specialAbility.x - 110,
                  top: positions.specialAbility.y - 10,
                },
                dynamicStyles.arrow,
              ]}
            >
              ← Double-tap
            </Text>
          </>
        )

      default:
        return null
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      accessible={true}
      accessibilityViewIsModal={true}
      accessibilityLabel={t("tutorial.title")}
    >
      <View style={[styles.overlay, dynamicStyles.overlay]} pointerEvents="box-none">
        {/* Visual guidance overlays */}
        {currentStep < TOTAL_STEPS - 1 && (
          <View style={styles.guidanceContainer} pointerEvents="none">
            {renderGuidance()}
          </View>
        )}

        {/* Tutorial panel */}
        <View
          style={[styles.panel, dynamicStyles.panel]}
          pointerEvents="auto"
          accessible={true}
          accessibilityRole="alert"
          accessibilityLabel={`${t("tutorial.title")}, ${stepContent.text}`}
        >
          {/* Title */}
          <Text
            style={[styles.title, dynamicStyles.title]}
            accessible={true}
            accessibilityRole="header"
          >
            {t("tutorial.title")}
          </Text>

          {/* Step Content */}
          <View style={styles.contentContainer}>
            <Text style={[styles.text, dynamicStyles.text]}>
              {stepContent.text}
            </Text>
          </View>

          {/* Progress Dots */}
          <View
            style={styles.progressContainer}
            accessible={true}
            accessibilityRole="progressbar"
            accessibilityLabel={`Step ${currentStep + 1} of ${TOTAL_STEPS}`}
            accessibilityValue={{ min: 0, max: TOTAL_STEPS, now: currentStep + 1 }}
          >
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentStep
                    ? dynamicStyles.progressDotActive
                    : dynamicStyles.progressDot,
                ]}
                accessible={true}
                accessibilityLabel={`Step ${index + 1}${index === currentStep ? " (current)" : ""}`}
                accessibilityState={{ selected: index === currentStep }}
              />
            ))}
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {currentStep < TOTAL_STEPS - 1 && (
              <Pressable
                style={[styles.button, dynamicStyles.buttonSecondary]}
                onPress={onSkip}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t("tutorial.skip")}
                accessibilityHint="Skip the tutorial and start playing"
              >
                <Text style={[styles.buttonText, dynamicStyles.buttonTextSecondary]}>
                  {t("tutorial.skip")}
                </Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.button, dynamicStyles.buttonPrimary]}
              onPress={handleNext}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={isLastStep ? t("general.confirm") : t("tutorial.next")}
              accessibilityHint={isLastStep ? "Complete the tutorial" : "Go to the next step"}
            >
              <Text style={[styles.buttonText, dynamicStyles.buttonTextPrimary]}>
                {isLastStep ? t("general.confirm") : t("tutorial.next")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  guidanceContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  highlightCircle: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  highlightBox: {
    position: "absolute",
    width: 120,
    height: 40,
    borderRadius: 8,
    borderWidth: 3,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  highlightGlow: {
    width: "100%",
    height: "100%",
    borderRadius: 80,
  },
  arrowText: {
    position: "absolute",
    fontSize: 20,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  powerUpExample: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
  },
  powerUpIcon: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  powerUpEmoji: {
    fontSize: 20,
  },
  panel: {
    width: "100%",
    maxWidth: 500,
    borderRadius: 16,
    borderWidth: 2,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  contentContainer: {
    minHeight: 100,
    justifyContent: "center",
    marginBottom: 24,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 0.4,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
})
