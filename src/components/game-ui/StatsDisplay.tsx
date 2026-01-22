import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import type { ThemeColors } from '../../theme/types'
import { StatRow } from './StatRow'

export interface GameStatistics {
  totalGames: number
  totalScore: number
  totalKills: number
  totalTimePlayed: number
  totalBossesDefeated: number
  highestScore: number
  highestWave: number
  highestCombo: number
  bestAccuracy: number
  killsByEnemyType: {
    scout: number
    tank: number
    sniper: number
    bomber: number
  }
}

export interface StatsDisplayProps {
  stats: GameStatistics
  colors: ThemeColors
}

export const StatsDisplay: React.FC<StatsDisplayProps> = ({ stats, colors }) => (
  <ScrollView style={{ maxHeight: 300 }}>
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: 'bold' }}>Lifetime Stats</Text>
      <View style={{ backgroundColor: colors.buttonSecondary, borderRadius: 8, padding: 12, gap: 4 }}>
        <StatRow label="Total Games" value={stats.totalGames.toString()} colors={colors} />
        <StatRow label="Total Score" value={stats.totalScore.toLocaleString()} colors={colors} />
        <StatRow label="Total Kills" value={stats.totalKills.toString()} colors={colors} />
        <StatRow label="Time Played" value={`${Math.floor(stats.totalTimePlayed / 60)}m`} colors={colors} />
        <StatRow label="Bosses Defeated" value={stats.totalBossesDefeated.toString()} colors={colors} />
      </View>

      <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: 'bold', marginTop: 8 }}>Best Records</Text>
      <View style={{ backgroundColor: colors.buttonSecondary, borderRadius: 8, padding: 12, gap: 4 }}>
        <StatRow label="Highest Score" value={stats.highestScore.toLocaleString()} colors={colors} />
        <StatRow label="Highest Wave" value={stats.highestWave.toString()} colors={colors} />
        <StatRow label="Highest Combo" value={`${stats.highestCombo}x`} colors={colors} />
        <StatRow label="Best Accuracy" value={`${stats.bestAccuracy.toFixed(1)}%`} colors={colors} />
      </View>

      <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: 'bold', marginTop: 8 }}>Kill Breakdown</Text>
      <View style={{ backgroundColor: colors.buttonSecondary, borderRadius: 8, padding: 12, gap: 4 }}>
        <StatRow label="Scouts" value={stats.killsByEnemyType.scout.toString()} colors={colors} />
        <StatRow label="Tanks" value={stats.killsByEnemyType.tank.toString()} colors={colors} />
        <StatRow label="Snipers" value={stats.killsByEnemyType.sniper.toString()} colors={colors} />
        <StatRow label="Bombers" value={stats.killsByEnemyType.bomber.toString()} colors={colors} />
      </View>
    </View>
  </ScrollView>
)
