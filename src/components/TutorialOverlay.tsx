import React, { useMemo } from "react"
import { View, Text, Modal, Pressable, StyleSheet } from "react-native"
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
    }),
    [colors]
  )

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={[styles.overlay, dynamicStyles.overlay]}>
        <View style={[styles.panel, dynamicStyles.panel]}>
          {/* Title */}
          <Text style={[styles.title, dynamicStyles.title]}>
            {t("tutorial.title")}
          </Text>

          {/* Step Content */}
          <View style={styles.contentContainer}>
            <Text style={[styles.text, dynamicStyles.text]}>
              {stepContent.text}
            </Text>
          </View>

          {/* Progress Dots */}
          <View style={styles.progressContainer}>
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentStep
                    ? dynamicStyles.progressDotActive
                    : dynamicStyles.progressDot,
                ]}
              />
            ))}
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {currentStep < TOTAL_STEPS - 1 && (
              <Pressable
                style={[styles.button, dynamicStyles.buttonSecondary]}
                onPress={onSkip}
              >
                <Text style={[styles.buttonText, dynamicStyles.buttonTextSecondary]}>
                  {t("tutorial.skip")}
                </Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.button, dynamicStyles.buttonPrimary]}
              onPress={handleNext}
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
