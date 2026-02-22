import React from 'react'
import { View, Text, Pressable, Modal } from 'react-native'
import type { ThemeColors } from '../../../theme/types'

export interface InstructionsModalProps {
  visible: boolean
  onStartGame: () => void
  colors: ThemeColors
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ visible, onStartGame, colors }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.modalOverlay }}>
      <View style={{
        backgroundColor: colors.panelBg,
        borderWidth: 2,
        borderColor: colors.buttonPrimary,
        borderRadius: 16,
        padding: 24,
        marginHorizontal: 24,
        width: 340,
      }}>
        <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
          NEON VOID
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 18, fontWeight: '600', marginBottom: 20, textAlign: 'center' }}>
          Welcome, Space Pilot!
        </Text>

        <Text style={{ color: colors.textMuted, fontSize: 16, marginBottom: 12, fontWeight: 'bold' }}>HOW TO PLAY:</Text>

        <View style={{ marginBottom: 20, gap: 12 }}>
          <View style={{ backgroundColor: colors.buttonSecondary, borderRadius: 12, padding: 12 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>
              🕹️ MOVE YOUR SHIP
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
              Use the joystick at the bottom center to move and steer your spaceship.
            </Text>
          </View>

          <View style={{ backgroundColor: colors.buttonSecondary, borderRadius: 12, padding: 12 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>
              💥 SHOOT ENEMIES
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
              Tap to fire. Double-tap to activate your special ability!
            </Text>
          </View>

          <View style={{ backgroundColor: colors.buttonSecondary, borderRadius: 12, padding: 12 }}>
            <Text style={{ color: colors.comboText, fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>
              ⚡ SURVIVE & SCORE
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
              Dodge enemy fire, defeat bosses every 5 waves, and collect power-ups!
            </Text>
          </View>
        </View>

        <Pressable
          style={{
            backgroundColor: colors.buttonPrimary,
            borderRadius: 12,
            paddingVertical: 16,
            paddingHorizontal: 16,
          }}
          onPress={onStartGame}
          accessible={true}
          accessibilityLabel="Start Mission"
          accessibilityRole="button"
          accessibilityHint="Begin the game"
        >
          <Text style={{ color: colors.buttonText, textAlign: 'center', fontSize: 18, fontWeight: 'bold' }}>
            START MISSION
          </Text>
        </Pressable>
      </View>
    </View>
  </Modal>
)
