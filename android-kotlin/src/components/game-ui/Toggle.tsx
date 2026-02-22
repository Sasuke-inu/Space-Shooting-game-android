import React from 'react'
import { View, Text, Pressable } from 'react-native'
import type { ThemeColors } from '../../theme/types'

export interface ToggleProps {
  value: boolean
  onValueChange: (value: boolean) => void
  label: string
  colors: ThemeColors
}

export const Toggle: React.FC<ToggleProps> = ({ value, onValueChange, label, colors }) => (
  <Pressable
    onPress={() => onValueChange(!value)}
    style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}
    accessible={true}
    accessibilityRole="switch"
    accessibilityLabel={label}
    accessibilityState={{ checked: value }}
  >
    <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{label}</Text>
    <View style={{
      width: 50,
      height: 28,
      borderRadius: 14,
      backgroundColor: value ? colors.buttonPrimary : colors.panelBorder,
      justifyContent: 'center',
      paddingHorizontal: 2,
    }}>
      <View style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.textPrimary,
        alignSelf: value ? 'flex-end' : 'flex-start',
      }} />
    </View>
  </Pressable>
)
