import React from 'react'
import { Pressable, Text } from 'react-native'
import { ThemeColors } from '../../theme/types'

export interface PauseButtonProps {
  topInset: number
  paused: boolean
  onPress: () => void
  colors: ThemeColors
}

export const PauseButton: React.FC<PauseButtonProps> = ({
  topInset,
  paused,
  onPress,
  colors,
}) => {
  return (
    <Pressable
      style={{
        position: 'absolute',
        top: topInset + 12,
        right: 12,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: `${colors.buttonSecondary}cc`, // Semi-transparent
        borderWidth: 1,
        borderColor: colors.panelBorder,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
      }}
      onPress={onPress}
    >
      <Text style={{ color: colors.hudText, fontSize: 18 }}>
        {paused ? '▶️' : '⏸'}
      </Text>
    </Pressable>
  )
}
