import React from 'react'
import { View, Text } from 'react-native'
import { ThemeColors } from '../../theme/types'
import { Achievement } from '../../types/game'

export interface AchievementNotificationProps {
  achievement: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'> | null
  topInset: number
  colors: ThemeColors
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  topInset,
  colors,
}) => {
  if (!achievement) return null

  return (
    <View style={{
      position: 'absolute',
      top: topInset + 60,
      left: 20,
      right: 20,
      backgroundColor: colors.panelBg,
      borderWidth: 2,
      borderColor: colors.comboText,
      borderRadius: 12,
      padding: 12,
      zIndex: 100,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    }}>
      <Text style={{ fontSize: 32 }}>{achievement.icon}</Text>
      <View>
        <Text style={{ color: colors.comboText, fontSize: 12, fontWeight: 'bold' }}>ACHIEVEMENT UNLOCKED</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: 'bold' }}>{achievement.name}</Text>
      </View>
    </View>
  )
}
