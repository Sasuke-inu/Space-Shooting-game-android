import React from 'react'
import { View, Text, Pressable } from 'react-native'
import type { ThemeColors } from '../../theme/types'
import type { ShipType } from '../../types/game'
import { SHIP_STATS } from '../../types/game'

export interface ShipSelectorProps {
  currentShip: ShipType
  unlockedShips: ShipType[]
  onShipSelect: (ship: ShipType) => void
  colors: ThemeColors
}

export const ShipSelector: React.FC<ShipSelectorProps> = ({ currentShip, unlockedShips, onShipSelect, colors }) => (
  <View style={{ gap: 12 }}>
    {(['fighter', 'scout', 'tank', 'interceptor'] as ShipType[]).map((ship) => {
      const shipStats = SHIP_STATS[ship]
      const isUnlocked = unlockedShips.includes(ship)
      const isSelected = currentShip === ship

      return (
        <Pressable
          key={ship}
          onPress={() => onShipSelect(ship)}
          style={{
            padding: 12,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: isSelected ? colors.buttonPrimary : colors.panelBorder,
            backgroundColor: isSelected ? colors.buttonSecondary : 'transparent',
            opacity: isUnlocked ? 1 : 0.5,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', textTransform: 'capitalize' }}>
              {ship} {isSelected && '✓'}
            </Text>
            {!isUnlocked && (
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>🔒 Locked</Text>
            )}
          </View>
          <View style={{ marginTop: 8, gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Speed</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 12 }}>{(shipStats.speed * 100).toFixed(0)}%</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Fire Rate</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 12 }}>{(shipStats.fireRate * 100).toFixed(0)}%</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Hull</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 12 }}>{shipStats.hull}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Special</Text>
              <Text style={{ color: colors.comboText, fontSize: 12 }}>{shipStats.special}</Text>
            </View>
          </View>
        </Pressable>
      )
    })}
  </View>
)
