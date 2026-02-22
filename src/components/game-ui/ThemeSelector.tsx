import React from 'react'
import { View, Text, Pressable } from 'react-native'
import type { ThemeColors, GameTheme, ThemeId } from '../../theme/types'

export interface ThemeSelectorProps {
  themeList: GameTheme[]
  currentThemeId: ThemeId
  onThemeSelect: (themeId: ThemeId) => void
  colors: ThemeColors
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ themeList, currentThemeId, onThemeSelect, colors }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
    {themeList.map((theme) => (
      <Pressable
        key={theme.id}
        onPress={() => onThemeSelect(theme.id as ThemeId)}
        accessibilityRole="button"
        accessibilityLabel={`${theme.name} theme`}
        accessibilityState={{ selected: currentThemeId === theme.id }}
        accessibilityHint={`Select ${theme.name} theme`}
        style={{
          width: 90,
          padding: 8,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: currentThemeId === theme.id ? colors.buttonPrimary : colors.panelBorder,
          backgroundColor: currentThemeId === theme.id ? colors.buttonSecondary : 'transparent',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 24 }}>{theme.icon}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4, textAlign: 'center' }}>
          {theme.name}
        </Text>
        {currentThemeId === theme.id && (
          <Text style={{ color: colors.buttonPrimary, fontSize: 10, marginTop: 2 }}>✓</Text>
        )}
      </Pressable>
    ))}
  </View>
)
