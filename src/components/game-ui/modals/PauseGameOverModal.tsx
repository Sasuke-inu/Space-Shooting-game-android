import React from 'react'
import { View, Text, Pressable, Modal } from 'react-native'
import { ThemeColors } from '../../../theme/types'
import { HighScore } from '../../../state/highScoresStore'

export interface PauseGameOverModalProps {
  visible: boolean
  lives: number
  score: number
  wave: number
  credits: number
  highScores: HighScore[]
  onRestart: () => void
  onContinue: () => void
  colors: ThemeColors
}

export const PauseGameOverModal: React.FC<PauseGameOverModalProps> = ({
  visible,
  lives,
  score,
  wave,
  credits,
  highScores,
  onRestart,
  onContinue,
  colors,
}) => {
  if (!visible) return null

  const isGameOver = lives <= 0

  return (
    <Modal visible={true} transparent animationType="fade">
      <Pressable
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.modalOverlay,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        onPress={!isGameOver ? onContinue : undefined}
      >
        <Pressable
          style={{
            backgroundColor: colors.panelBg,
            borderWidth: 2,
            borderColor: colors.panelBorder,
            borderRadius: 16,
            padding: 24,
            marginHorizontal: 24,
            width: 340,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {isGameOver ? (
            <>
              <Text style={{ color: colors.enemyShip, fontSize: 28, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
                GAME OVER
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 20, fontWeight: '600', marginBottom: 16, textAlign: 'center' }}>
                Final Score: {score}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 16, marginBottom: 8, textAlign: 'center' }}>
                Wave {wave} reached
              </Text>
              <Text style={{ color: colors.comboText, fontSize: 14, marginBottom: 16, textAlign: 'center' }}>
                +{credits} Credits Earned!
              </Text>

              {/* High Scores Leaderboard */}
              {highScores.length > 0 && (
                <View style={{
                  backgroundColor: colors.buttonSecondary,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
                    🏆 TOP 5 HIGH SCORES
                  </Text>
                  {highScores.map((hs, index) => (
                    <View
                      key={index}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 8,
                        borderBottomWidth: index < highScores.length - 1 ? 1 : 0,
                        borderBottomColor: colors.panelBorder,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: 'bold', width: 24 }}>
                          {index + 1}.
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                          {hs.name}
                        </Text>
                      </View>
                      <Text style={{ color: colors.comboText, fontSize: 14, fontWeight: '600' }}>
                        {hs.score}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <Pressable
                style={{
                  backgroundColor: colors.buttonPrimary,
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                }}
                onPress={onRestart}
              >
                <Text style={{ color: colors.buttonText, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
                  PLAY AGAIN
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={{ color: colors.textSecondary, fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
                GAME PAUSED
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 16, marginBottom: 12, fontWeight: '600' }}>Controls:</Text>
              <View style={{ marginBottom: 20, gap: 8 }}>
                <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
                  • <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>Joystick:</Text> Move and steer
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
                  • <Text style={{ fontWeight: 'bold', color: colors.textSecondary }}>Tap:</Text> Fire weapons
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
                  • <Text style={{ fontWeight: 'bold', color: colors.comboText }}>Double-Tap:</Text> Special ability
                </Text>
              </View>
              <Pressable
                style={{
                  backgroundColor: colors.buttonPrimary,
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                }}
                onPress={onContinue}
              >
                <Text style={{ color: colors.buttonText, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
                  CONTINUE
                </Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}
