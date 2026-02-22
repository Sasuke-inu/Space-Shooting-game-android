import React from 'react'
import { View, Text, Pressable, Modal, TextInput } from 'react-native'
import { ThemeColors } from '../../../theme/types'

export interface NameInputModalProps {
  visible: boolean
  score: number
  credits: number
  playerName: string
  onNameChange: (name: string) => void
  onSubmit: () => void
  colors: ThemeColors
}

export const NameInputModal: React.FC<NameInputModalProps> = ({
  visible,
  score,
  credits,
  playerName,
  onNameChange,
  onSubmit,
  colors,
}) => {
  if (!visible) return null

  return (
    <Modal visible={true} transparent animationType="fade" accessibilityViewIsModal>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.modalOverlay }}>
        <View
          style={{
            backgroundColor: colors.panelBg,
            borderWidth: 2,
            borderColor: colors.buttonPrimary,
            borderRadius: 16,
            padding: 24,
            marginHorizontal: 24,
            width: 340,
          }}
          accessible
          accessibilityLabel="High score name input dialog"
        >
          <Text
            style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}
            accessible
            accessibilityLabel="Top 5 score achieved"
            accessibilityRole="header"
          >
            🏆 TOP 5 SCORE!
          </Text>
          <Text
            style={{ color: colors.textSecondary, fontSize: 18, fontWeight: '600', marginBottom: 16, textAlign: 'center' }}
            accessible
            accessibilityLabel={`Your score is ${score}`}
          >
            Score: {score}
          </Text>
          <Text
            style={{ color: colors.comboText, fontSize: 14, marginBottom: 16, textAlign: 'center' }}
            accessible
            accessibilityLabel={`${credits} credits earned`}
          >
            +{credits} Credits Earned!
          </Text>

          <TextInput
            style={{
              backgroundColor: colors.buttonSecondary,
              borderWidth: 1,
              borderColor: colors.buttonPrimary,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              color: colors.textPrimary,
              fontSize: 16,
              marginBottom: 20,
            }}
            placeholder="Enter your name"
            placeholderTextColor={colors.textMuted}
            value={playerName}
            onChangeText={onNameChange}
            maxLength={15}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={onSubmit}
            accessibilityLabel="Player name input"
            accessibilityHint="Enter your name for the high score leaderboard, maximum 15 characters"
          />

          <Pressable
            style={{
              backgroundColor: colors.buttonPrimary,
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 16,
            }}
            onPress={onSubmit}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Submit high score"
            accessibilityHint="Saves your name and score to the leaderboard"
          >
            <Text style={{ color: colors.buttonText, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
              SUBMIT
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}
