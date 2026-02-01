import React, { useEffect, useRef } from 'react'
import { View, Text, Animated } from 'react-native'
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
  const translateY = useRef(new Animated.Value(-100)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (achievement) {
      // Reset animations
      translateY.setValue(-100)
      opacity.setValue(1)

      // Slide in animation
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start()

      // Auto-hide after 4 seconds
      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start()
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [achievement, translateY, opacity])

  if (!achievement) return null

  return (
    <Animated.View style={{
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
      transform: [{ translateY }],
      opacity,
    }}>
      <Text style={{ fontSize: 32 }}>{achievement.icon}</Text>
      <View>
        <Text style={{ color: colors.comboText, fontSize: 12, fontWeight: 'bold' }}>ACHIEVEMENT UNLOCKED</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: 'bold' }}>{achievement.name}</Text>
      </View>
    </Animated.View>
  )
}
