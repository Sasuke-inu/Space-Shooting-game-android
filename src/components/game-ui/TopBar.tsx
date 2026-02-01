import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { ThemeColors } from '../../theme/types'

export interface TopBarProps {
  topInset: number
  themeName: string
  paused: boolean
  onSettingsPress: () => void
  onPausePress: () => void
  onRestartPress: () => void
  colors: ThemeColors
}

export const TopBar: React.FC<TopBarProps> = ({
  topInset,
  themeName,
  paused,
  onSettingsPress,
  onPausePress,
  onRestartPress,
  colors,
}) => {
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: topInset + 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        gap: 8,
        zIndex: 10,
      }}
    >
      <Text style={{ color: colors.hudAccent, fontSize: 16, fontWeight: '600', letterSpacing: 0.5 }}>
        {themeName}
      </Text>
      <View style={{ flex: 1 }} />
      <Pressable
        style={{
          backgroundColor: colors.buttonSecondary,
          borderWidth: 1,
          borderColor: colors.panelBorder,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
        onPress={onSettingsPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Settings"
        accessibilityHint="Opens the settings menu"
      >
        <Text style={{ color: colors.hudText, fontSize: 14 }}>⚙️</Text>
      </Pressable>
      <Pressable
        style={{
          backgroundColor: colors.buttonSecondary,
          borderWidth: 1,
          borderColor: colors.panelBorder,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
        onPress={onPausePress}
      >
        <Text style={{ color: colors.hudText, fontSize: 14 }}>{paused ? "Resume" : "Pause"}</Text>
      </Pressable>
      <Pressable
        style={{
          backgroundColor: colors.buttonSecondary,
          borderWidth: 1,
          borderColor: colors.panelBorder,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
        onPress={onRestartPress}
      >
        <Text style={{ color: colors.hudText, fontSize: 14 }}>Restart</Text>
      </Pressable>
    </View>
  )
}
