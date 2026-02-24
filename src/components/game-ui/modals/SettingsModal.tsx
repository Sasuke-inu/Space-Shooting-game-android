import React, { useState, useCallback, useEffect } from 'react'
import { View, Text, Pressable, Modal, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemeColors, ThemeId, GameTheme } from '../../../theme/types'
import { ShipType, GameStatistics } from '../../../types/game'
import { ThemeSelector } from '../ThemeSelector'
import { ShipSelector } from '../ShipSelector'
import { StatsDisplay } from '../StatsDisplay'
import { Slider } from '../Slider'
import { Toggle } from '../Toggle'

export interface SettingsModalProps {
  visible: boolean
  activeTab: 'general' | 'ship' | 'stats'
  onTabChange: (tab: 'general' | 'ship' | 'stats') => void
  onClose: () => void
  colors: ThemeColors
  // General tab props
  themeList: GameTheme[]
  currentThemeId: ThemeId
  onThemeSelect: (themeId: ThemeId) => void
  musicVolume: number
  setMusicVolume: (volume: number) => void
  sfxVolume: number
  setSfxVolume: (volume: number) => void
  joystickSensitivity: number
  setJoystickSensitivity: (sensitivity: number) => void
  autoFire: boolean
  setAutoFire: (enabled: boolean) => void
  hapticsEnabled: boolean
  setHapticsEnabled: (enabled: boolean) => void
  // Ship tab props
  currentShip: ShipType
  unlockedShips: ShipType[]
  onShipSelect: (ship: ShipType) => void
  // Stats tab props
  stats: GameStatistics
  upgradesCredits: number
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  activeTab,
  onTabChange,
  onClose,
  colors,
  themeList,
  currentThemeId,
  onThemeSelect,
  musicVolume,
  setMusicVolume,
  sfxVolume,
  setSfxVolume,
  joystickSensitivity,
  setJoystickSensitivity,
  autoFire,
  setAutoFire,
  hapticsEnabled,
  setHapticsEnabled,
  currentShip,
  unlockedShips,
  onShipSelect,
  stats,
  upgradesCredits,
}) => {
  // Scroll state tracking
  const [canScrollDown, setCanScrollDown] = useState(false)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)

  const handleScroll = useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
    const isAtTop = contentOffset.y <= 1
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 1

    setCanScrollUp(!isAtTop)
    setCanScrollDown(!isAtBottom)

    // Hide scroll hint after user scrolls down slightly
    if (contentOffset.y > 5) {
      setHasScrolled(true)
    }
  }, [])

  // Reset scroll hint when tab changes
  useEffect(() => {
    setHasScrolled(false)
  }, [activeTab])

  if (!visible) return null

  return (
    <Modal visible={true} transparent animationType="fade">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.modalOverlay }}>
        <View style={{
          backgroundColor: colors.panelBg,
          borderWidth: 2,
          borderColor: colors.panelBorder,
          borderRadius: 16,
          padding: 20,
          marginHorizontal: 24,
          width: 340,
          maxHeight: '85%',
        }}>
          <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
            ⚙️ Settings
          </Text>

          {/* Tab buttons */}
          <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
            {(['general', 'ship', 'stats'] as const).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => onTabChange(tab)}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: activeTab === tab ? colors.buttonPrimary : colors.buttonSecondary,
                }}
              >
                <Text style={{
                  color: activeTab === tab ? colors.buttonText : colors.textSecondary,
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 'bold',
                  textTransform: 'capitalize',
                }}>
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ScrollView container with fade indicator */}
          <View style={{ position: 'relative' }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 400 }}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {activeTab === 'general' && (
                <>
                  {/* Theme Section */}
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 12 }} accessibilityRole="header">
                    🎨 Theme
                  </Text>
                  <ThemeSelector themeList={themeList} currentThemeId={currentThemeId} onThemeSelect={onThemeSelect} colors={colors} />

                  {/* Audio Section */}
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 12 }} accessibilityRole="header">
                    🔊 Audio
                  </Text>
                  <Slider value={musicVolume} onValueChange={setMusicVolume} label="Music Volume" colors={colors} />
                  <Slider value={sfxVolume} onValueChange={setSfxVolume} label="SFX Volume" colors={colors} />

                  {/* Controls Section */}
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginTop: 8, marginBottom: 12 }} accessibilityRole="header">
                    🎮 Controls
                  </Text>
                  <Slider value={joystickSensitivity} onValueChange={setJoystickSensitivity} label="Joystick Sensitivity" colors={colors} />
                  <Toggle value={autoFire} onValueChange={setAutoFire} label="Auto-Fire" colors={colors} />
                  <Toggle value={hapticsEnabled} onValueChange={setHapticsEnabled} label="Haptic Feedback" colors={colors} />
                </>
              )}

              {activeTab === 'ship' && (
                <>
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                    🚀 Select Ship
                  </Text>
                  <ShipSelector currentShip={currentShip} unlockedShips={unlockedShips} onShipSelect={onShipSelect} colors={colors} />
                </>
              )}

              {activeTab === 'stats' && (
                <>
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                    📊 Statistics
                  </Text>
                  <Text style={{ color: colors.comboText, fontSize: 14, marginBottom: 12 }}>
                    Total Credits: {upgradesCredits}
                  </Text>
                  <StatsDisplay stats={stats} colors={colors} />
                </>
              )}
            </ScrollView>

            {/* Fade gradient indicator at bottom */}
            {canScrollDown && (
              <LinearGradient
                colors={['transparent', colors.panelBg]}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 50,
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Scroll hint indicator */}
            {canScrollDown && !hasScrolled && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 0,
                  right: 0,
                  alignItems: 'center',
                  pointerEvents: 'none',
                }}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 20 }}>
                  ▼
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 2 }}>
                  Scroll for more
                </Text>
              </View>
            )}
          </View>

          <Pressable
            style={{
              backgroundColor: colors.buttonPrimary,
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 16,
              marginTop: 16,
            }}
            onPress={onClose}
          >
            <Text style={{ color: colors.buttonText, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
              DONE
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}
