import React from 'react'
import { View, Text } from 'react-native'
import type { ThemeColors } from '../../theme/types'

export interface StatRowProps {
  label: string
  value: string
  colors: ThemeColors
}

export const StatRow: React.FC<StatRowProps> = ({ label, value, colors }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{label}</Text>
    <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '600' }}>{value}</Text>
  </View>
)
