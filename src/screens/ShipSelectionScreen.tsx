import React, { useState, useMemo } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ShipCard } from "../components/ShipCard"
import { useThemeColors } from "../theme/themeStore"
import { useI18nStore } from "../i18n"
import { useGameStore } from "../state/gameStore"
import { useUpgradesStore } from "../state/progressStore"
import type { ShipType } from "../types/game"

interface ShipSelectionScreenProps {
  onClose: () => void
}

const SHIP_COSTS: Record<ShipType, number> = {
  fighter: 0,
  scout: 500,
  tank: 750,
  interceptor: 1000,
}

const ALL_SHIPS: ShipType[] = ['fighter', 'scout', 'tank', 'interceptor']

export default function ShipSelectionScreen({ onClose }: ShipSelectionScreenProps) {
  const insets = useSafeAreaInsets()
  const colors = useThemeColors()
  const { t } = useI18nStore()

  // Game state
  const currentShipType = useGameStore((s) => s.player.shipType)
  const setShipType = useGameStore((s) => s.setShipType)

  // Upgrades state
  const { credits, isShipUnlocked, unlockShip } = useUpgradesStore()

  // UI state
  const [comparisonMode, setComparisonMode] = useState(false)

  const dynamicStyles = useMemo(
    () => ({
      background: {
        backgroundColor: colors.background,
      },
      header: {
        backgroundColor: colors.panelBg,
        borderBottomColor: colors.panelBorder,
        paddingTop: insets.top,
      },
      title: {
        color: colors.textPrimary,
      },
      closeButton: {
        backgroundColor: colors.buttonPrimary,
      },
      closeButtonText: {
        color: colors.textPrimary,
      },
      creditsBar: {
        backgroundColor: colors.panelBg,
        borderBottomColor: colors.panelBorder,
      },
      creditsLabel: {
        color: colors.textSecondary,
      },
      creditsValue: {
        color: colors.hudAccent,
      },
      toggleButton: {
        backgroundColor: comparisonMode ? colors.buttonPrimary : colors.panelBg,
        borderColor: colors.panelBorder,
      },
      toggleText: {
        color: comparisonMode ? colors.textPrimary : colors.textSecondary,
      },
      comparisonGrid: {
        borderTopColor: colors.panelBorder,
        borderBottomColor: colors.panelBorder,
      },
    }),
    [colors, comparisonMode, insets]
  )

  const handleShipSelect = (shipType: ShipType) => {
    const isUnlocked = isShipUnlocked(shipType)

    if (isUnlocked) {
      // Select the ship
      setShipType(shipType)
    } else {
      // Try to unlock it
      const cost = SHIP_COSTS[shipType]
      if (credits >= cost) {
        unlockShip(shipType)
        // Automatically select after unlocking
        setShipType(shipType)
      }
    }
  }

  return (
    <View style={[styles.container, dynamicStyles.background]}>
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, dynamicStyles.title]}>
            {t("ships.selectShip") || "Select Ship"}
          </Text>
          <TouchableOpacity
            style={[styles.closeButton, dynamicStyles.closeButton]}
            onPress={onClose}
          >
            <Text style={[styles.closeButtonText, dynamicStyles.closeButtonText]}>
              ✕
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Credits bar */}
      <View style={[styles.creditsBar, dynamicStyles.creditsBar]}>
        <Text style={[styles.creditsLabel, dynamicStyles.creditsLabel]}>
          {t("general.credits") || "Credits"}:
        </Text>
        <Text style={[styles.creditsValue, dynamicStyles.creditsValue]}>
          {credits.toLocaleString()}
        </Text>
      </View>

      {/* Comparison mode toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, dynamicStyles.toggleButton]}
          onPress={() => setComparisonMode(!comparisonMode)}
        >
          <Text style={[styles.toggleText, dynamicStyles.toggleText]}>
            {comparisonMode
              ? "✓ " + (t("ships.compareShips") || "Compare Ships")
              : (t("ships.compareShips") || "Compare Ships")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Ship list */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {comparisonMode ? (
          // Comparison grid view (2x2)
          <View style={styles.comparisonContainer}>
            <View style={[styles.comparisonGrid, dynamicStyles.comparisonGrid]}>
              {ALL_SHIPS.map((shipType) => (
                <View key={shipType} style={styles.comparisonItem}>
                  <ShipCard
                    shipType={shipType}
                    isSelected={shipType === currentShipType}
                    onSelect={() => handleShipSelect(shipType)}
                    unlockCost={SHIP_COSTS[shipType]}
                  />
                </View>
              ))}
            </View>
          </View>
        ) : (
          // Standard list view
          <View style={styles.listContainer}>
            {ALL_SHIPS.map((shipType) => (
              <ShipCard
                key={shipType}
                shipType={shipType}
                isSelected={shipType === currentShipType}
                onSelect={() => handleShipSelect(shipType)}
                unlockCost={SHIP_COSTS[shipType]}
              />
            ))}
          </View>
        )}

        {/* Bottom padding for safe area */}
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: "700",
  },
  creditsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  creditsLabel: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  creditsValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  toggleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  toggleButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  listContainer: {
    paddingTop: 8,
  },
  comparisonContainer: {
    paddingTop: 8,
  },
  comparisonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  comparisonItem: {
    width: "48%",
    marginBottom: 12,
  },
})
