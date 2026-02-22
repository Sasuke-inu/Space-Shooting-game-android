import React from 'react'
import { View, Text, Pressable } from 'react-native'
import type { ThemeColors } from '../../theme/types'

export interface SliderProps {
  value: number
  onValueChange: (value: number) => void
  label: string
  colors: ThemeColors
}

export const Slider: React.FC<SliderProps> = ({ value, onValueChange, label, colors }) => (
  <View style={{ marginBottom: 16 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: colors.textPrimary, fontSize: 14 }}>{Math.round(value * 100)}%</Text>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Pressable
        onPress={() => onValueChange(Math.max(0, value - 0.1))}
        style={{ backgroundColor: colors.buttonSecondary, padding: 8, borderRadius: 8 }}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label}`}
        accessibilityHint="Decreases value by 10%"
      >
        <Text style={{ color: colors.textPrimary, fontSize: 16 }}>−</Text>
      </Pressable>
      <View style={{ flex: 1, height: 8, backgroundColor: colors.panelBorder, borderRadius: 4 }}>
        <View style={{ width: `${value * 100}%`, height: '100%', backgroundColor: colors.buttonPrimary, borderRadius: 4 }} />
      </View>
      <Pressable
        onPress={() => onValueChange(Math.min(1, value + 0.1))}
        style={{ backgroundColor: colors.buttonSecondary, padding: 8, borderRadius: 8 }}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label}`}
        accessibilityHint="Increases value by 10%"
      >
        <Text style={{ color: colors.textPrimary, fontSize: 16 }}>+</Text>
      </Pressable>
    </View>
  </View>
)
