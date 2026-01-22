import React from 'react'
import { View, Text, Pressable, Modal, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemeColors } from '../theme/themeStore'
import { useTutorialStore, TutorialStep } from '../state/tutorialStore'

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
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
              Movement Controls
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
              Use the joystick to move your ship around the screen.
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', fontStyle: 'italic' }}>
              (Interactive practice will be added in the next step)
            </Text>
          </View>
        )

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
