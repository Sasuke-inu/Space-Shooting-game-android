import React, { useMemo } from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { StatBar } from "./StatBar"
import { useThemeColors } from "../theme/themeStore"
import { useI18nStore } from "../i18n"
import { useUpgradesStore } from "../state/progressStore"
import type { ShipType } from "../types/game"
import { SHIP_STATS, ABILITY_STATS } from "../types/game"

interface ShipCardProps {
  shipType: ShipType
  isSelected: boolean
  onSelect: () => void
  unlockCost: number
}

// Ship emoji icons for visual representation
const SHIP_ICONS: Record<ShipType, string> = {
  fighter: "🚀",
  scout: "⚡",
  tank: "🛡️",
  interceptor: "✈️",
  support: "💚",
  stealth: "👻",
  heavy: "💀",
}

// Map ship special abilities to ability types
const SHIP_ABILITY_MAP: Record<ShipType, keyof typeof ABILITY_STATS> = {
  fighter: "missile_barrage",
  scout: "time_warp",
  tank: "shield_burst",
  interceptor: "emp_blast",
  support: "repair_drone",
  stealth: "phase_cloak",
  heavy: "gravity_cannon",
}

// Maximum values for stat normalization (for progress bars)
const MAX_STATS = {
  speed: 1.4,
  fireRate: 1.5,
  damage: 2.0,
  hull: 200,
}

export const ShipCard: React.FC<ShipCardProps> = ({
  shipType,
  isSelected,
  onSelect,
  unlockCost,
}) => {
  const colors = useThemeColors()
  const { t } = useI18nStore()
  const { isShipUnlocked, credits } = useUpgradesStore()

  const isUnlocked = isShipUnlocked(shipType)
  const canAfford = credits >= unlockCost
  const stats = SHIP_STATS[shipType]
  const abilityType = SHIP_ABILITY_MAP[shipType]
  const abilityInfo = ABILITY_STATS[abilityType]

  const dynamicStyles = useMemo(
    () => ({
      container: {
        backgroundColor: colors.panelBg,
        borderColor: isSelected ? colors.buttonPrimary : colors.panelBorder,
        borderWidth: isSelected ? 3 : 1,
        opacity: isUnlocked ? 1 : 0.7,
      },
      header: {
        backgroundColor: isSelected ? colors.buttonPrimary : colors.hullBarBg,
      },
      headerText: {
        color: isSelected ? colors.textPrimary : colors.textSecondary,
      },
      shipName: {
        color: colors.textPrimary,
      },
      shipIcon: {
        fontSize: 40,
      },
      abilityTitle: {
        color: colors.textSecondary,
      },
      abilityName: {
        color: colors.hudAccent,
      },
      abilityDescription: {
        color: colors.textMuted,
      },
      lockOverlay: {
        backgroundColor: `${colors.panelBg}DD`,
      },
      lockText: {
        color: colors.textPrimary,
      },
      costText: {
        color: canAfford ? colors.hudAccent : colors.hullBarDanger,
      },
      selectedBadge: {
        backgroundColor: colors.buttonPrimary,
      },
      selectedText: {
        color: colors.textPrimary,
      },
    }),
    [colors, isSelected, isUnlocked, canAfford]
  )

  return (
    <TouchableOpacity
      style={[styles.container, dynamicStyles.container]}
      onPress={onSelect}
      activeOpacity={0.7}
      disabled={!isUnlocked}
    >
      {/* Header with ship icon and name */}
      <View style={[styles.header, dynamicStyles.header]}>
        <Text style={dynamicStyles.shipIcon}>{SHIP_ICONS[shipType]}</Text>
        <Text style={[styles.shipName, dynamicStyles.shipName]}>
          {t(`ships.${shipType}.name`)}
        </Text>
      </View>

      {/* Stats section */}
      <View style={styles.statsSection}>
        <StatBar
          label={t("stats.speed") || "Speed"}
          value={stats.speed}
          maxValue={MAX_STATS.speed}
          colors={colors}
        />
        <StatBar
          label={t("stats.fireRate") || "Fire Rate"}
          value={stats.fireRate}
          maxValue={MAX_STATS.fireRate}
          colors={colors}
        />
        <StatBar
          label={t("stats.damage") || "Damage"}
          value={stats.damage}
          maxValue={MAX_STATS.damage}
          colors={colors}
        />
        <StatBar
          label={t("stats.hull") || "Hull"}
          value={stats.hull}
          maxValue={MAX_STATS.hull}
          colors={colors}
        />
      </View>

      {/* Special ability section */}
      <View style={styles.abilitySection}>
        <Text style={[styles.abilityTitle, dynamicStyles.abilityTitle]}>
          {t("ships.specialAbility") || "Special Ability"}
        </Text>
        <Text style={[styles.abilityName, dynamicStyles.abilityName]}>
          {stats.special}
        </Text>
        <Text style={[styles.abilityDescription, dynamicStyles.abilityDescription]}>
          {abilityInfo.description}
        </Text>
        <Text style={[styles.abilityCooldown, dynamicStyles.abilityDescription]}>
          {t("ships.cooldown") || "Cooldown"}: {abilityInfo.cooldown}s
        </Text>
      </View>

      {/* Lock overlay for locked ships */}
      {!isUnlocked && (
        <View style={[styles.lockOverlay, dynamicStyles.lockOverlay]}>
          <Text style={[styles.lockIcon, dynamicStyles.lockText]}>🔒</Text>
          <Text style={[styles.lockText, dynamicStyles.lockText]}>
            {t("ships.locked") || "Locked"}
          </Text>
          <Text style={[styles.costText, dynamicStyles.costText]}>
            {unlockCost} {t("general.credits") || "Credits"}
          </Text>
          {!canAfford && (
            <Text style={[styles.insufficientText, dynamicStyles.costText]}>
              {t("ships.insufficientCredits") || "Insufficient Credits"}
            </Text>
          )}
        </View>
      )}

      {/* Selected badge */}
      {isSelected && isUnlocked && (
        <View style={[styles.selectedBadge, dynamicStyles.selectedBadge]}>
          <Text style={[styles.selectedText, dynamicStyles.selectedText]}>
            ✓ {t("ships.selected") || "Selected"}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 8,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  shipName: {
    fontSize: 24,
    fontWeight: "700",
  },
  statsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  abilitySection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 8,
  },
  abilityTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  abilityName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  abilityDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  abilityCooldown: {
    fontSize: 12,
    fontStyle: "italic",
  },
  lockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  lockIcon: {
    fontSize: 48,
  },
  lockText: {
    fontSize: 20,
    fontWeight: "700",
  },
  costText: {
    fontSize: 16,
    fontWeight: "600",
  },
  insufficientText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  selectedBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  selectedText: {
    fontSize: 12,
    fontWeight: "700",
  },
})
