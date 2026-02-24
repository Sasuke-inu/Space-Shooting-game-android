import React, { useMemo } from "react"
import { View, Text, StyleSheet } from "react-native"
import type { ViewStyle } from "react-native"
import type { ThemeColors } from "../theme/types"

interface StatBarProps {
  label: string
  value: number
  maxValue: number
  colors: ThemeColors
}

export const StatBar: React.FC<StatBarProps> = ({
  label,
  value,
  maxValue,
  colors,
}) => {
  const percentage = useMemo(() => {
    return Math.min(100, Math.max(0, (value / maxValue) * 100))
  }, [value, maxValue])

  const dynamicStyles = useMemo(() => ({
    container: {
      backgroundColor: colors.panelBg,
      borderColor: colors.panelBorder,
    },
    label: {
      color: colors.textPrimary,
    },
    barBackground: {
      backgroundColor: colors.hullBarBg,
    },
    barFill: {
      backgroundColor: colors.hudAccent,
      width: `${percentage}%`,
    } as ViewStyle,
    value: {
      color: colors.textSecondary,
    },
  }), [colors, percentage])

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Text style={[styles.label, dynamicStyles.label]}>{label}</Text>
      <View style={styles.barContainer}>
        <View style={[styles.barBackground, dynamicStyles.barBackground]}>
          <View style={[styles.barFill, dynamicStyles.barFill]} />
        </View>
        <Text style={[styles.value, dynamicStyles.value]}>
          {value.toFixed(value % 1 === 0 ? 0 : 1)}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  barContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  barBackground: {
    flex: 1,
    height: 20,
    borderRadius: 10,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 10,
  },
  value: {
    fontSize: 13,
    fontWeight: "500",
    minWidth: 40,
    textAlign: "right",
  },
})
