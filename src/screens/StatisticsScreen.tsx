import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useI18nStore } from '../i18n';
import { useTheme } from '../theme';
import { useStatisticsStore, useAchievementStore } from '../state/progressStore';

export default function StatisticsScreen({ onBack }: { onBack?: () => void }) {
  const theme = useTheme();
  const { t } = useI18nStore();
  const { stats } = useStatisticsStore();
  const { achievements } = useAchievementStore();

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const calculateAccuracy = (): string => {
    if (stats.totalShotsFired === 0) return '0.0%';
    return `${((stats.totalShotsHit / stats.totalShotsFired) * 100).toFixed(1)}%`;
  };

  const calculateAverageScore = (): number => {
    if (stats.totalGames === 0) return 0;
    return Math.floor(stats.totalScore / stats.totalGames);
  };

  const calculateKDRatio = (): string => {
    if (stats.totalDeaths === 0) return stats.totalKills.toFixed(2);
    return (stats.totalKills / stats.totalDeaths).toFixed(2);
  };

  const unlockedCount = Object.values(achievements).filter((a) => a.unlocked).length;
  const totalAchievements = Object.keys(achievements).length;

  const StatCard = ({ label, value, color }: { label: string; value: string | number; color?: string }) => (
    <View
      className="flex-1 p-4 m-2 rounded-lg border"
      style={{
        backgroundColor: theme.colors.panelBg,
        borderColor: theme.colors.panelBorder,
        minWidth: '45%',
      }}
    >
      <Text
        className="text-sm mb-2"
        style={{ color: theme.colors.textSecondary }}
      >
        {label}
      </Text>
      <Text
        className="text-2xl font-bold"
        style={{ color: color || theme.colors.textPrimary }}
      >
        {value}
      </Text>
    </View>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <View className="px-2 py-3 mt-2">
      <Text
        className="text-lg font-bold"
        style={{ color: theme.colors.textPrimary }}
      >
        {title}
      </Text>
    </View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View
        className="pt-12 pb-4 px-6 border-b"
        style={{
          backgroundColor: theme.colors.panelBg,
          borderBottomColor: theme.colors.panelBorder,
        }}
      >
        <Text
          className="text-3xl font-bold text-center"
          style={{ color: theme.colors.textPrimary }}
        >
          {t('statistics.title')}
        </Text>
        {onBack && (
          <TouchableOpacity
            className="absolute left-6 top-12 p-2"
            onPress={onBack}
            style={{
              backgroundColor: theme.colors.buttonSecondary,
              borderRadius: 8,
            }}
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: theme.colors.buttonSecondaryText }}
            >
              {t('general.back')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* Overview Stats */}
        <SectionHeader title="Overview" />
        <View className="flex-row flex-wrap justify-between">
          <StatCard
            label={t('stats.gamesPlayed')}
            value={stats.totalGames}
            color={theme.colors.accent}
          />
          <StatCard
            label={t('stats.totalScore')}
            value={stats.totalScore.toLocaleString()}
            color={theme.colors.accent}
          />
          <StatCard
            label={t('stats.highScore')}
            value={stats.highestScore.toLocaleString()}
            color={theme.colors.powerUps.magnet}
          />
          <StatCard
            label={t('stats.averageScore')}
            value={calculateAverageScore().toLocaleString()}
          />
        </View>

        {/* Combat Stats */}
        <SectionHeader title="Combat" />
        <View className="flex-row flex-wrap justify-between">
          <StatCard
            label={t('statistics.totalKills')}
            value={stats.totalKills}
            color={theme.colors.enemy.bullet}
          />
          <StatCard
            label={t('statistics.totalDeaths')}
            value={stats.totalDeaths}
          />
          <StatCard
            label="K/D Ratio"
            value={calculateKDRatio()}
            color={theme.colors.accent}
          />
          <StatCard
            label={t('statistics.bossesDefeated')}
            value={stats.totalBossesDefeated}
            color={theme.colors.powerUps.shield}
          />
          <StatCard
            label={t('statistics.accuracy')}
            value={calculateAccuracy()}
            color={theme.colors.powerUps.rapid_fire}
          />
          <StatCard
            label={t('statistics.highestCombo')}
            value={`${stats.highestCombo}x`}
            color={theme.colors.combo.text}
          />
        </View>

        {/* Kills by Enemy Type */}
        <SectionHeader title="Enemy Kills" />
        <View className="flex-row flex-wrap justify-between">
          <StatCard
            label="Scout"
            value={stats.killsByEnemyType.scout}
          />
          <StatCard
            label="Tank"
            value={stats.killsByEnemyType.tank}
          />
          <StatCard
            label="Sniper"
            value={stats.killsByEnemyType.sniper}
          />
          <StatCard
            label="Bomber"
            value={stats.killsByEnemyType.bomber}
          />
        </View>

        {/* Kills by Boss Type */}
        <SectionHeader title="Boss Kills" />
        <View className="flex-row flex-wrap justify-between">
          <StatCard
            label="Destroyer"
            value={stats.killsByBossType.destroyer}
            color={theme.colors.enemy.ship}
          />
          <StatCard
            label="Carrier"
            value={stats.killsByBossType.carrier}
            color={theme.colors.enemy.ship}
          />
          <StatCard
            label="Dreadnought"
            value={stats.killsByBossType.dreadnought}
            color={theme.colors.enemy.ship}
          />
        </View>

        {/* Progress Stats */}
        <SectionHeader title="Progress" />
        <View className="flex-row flex-wrap justify-between">
          <StatCard
            label={t('stats.highestWave')}
            value={stats.highestWave}
            color={theme.colors.powerUps.spread_shot}
          />
          <StatCard
            label={t('statistics.longestSurvivalTime')}
            value={formatTime(stats.longestSurvival)}
          />
          <StatCard
            label={t('statistics.totalPlayTime')}
            value={formatTime(stats.totalTimePlayed)}
            color={theme.colors.accent}
          />
          <StatCard
            label={t('statistics.powerUpsCollected')}
            value={stats.totalPowerUpsCollected}
            color={theme.colors.powerUps.magnet}
          />
        </View>

        {/* Achievements */}
        <SectionHeader title="Achievements" />
        <View className="flex-row flex-wrap justify-between">
          <StatCard
            label="Unlocked"
            value={`${unlockedCount}/${totalAchievements}`}
            color={theme.colors.powerUps.magnet}
          />
          <StatCard
            label="Completion"
            value={`${((unlockedCount / totalAchievements) * 100).toFixed(0)}%`}
            color={theme.colors.accent}
          />
        </View>

        {/* Shooting Stats */}
        <SectionHeader title="Shooting" />
        <View className="flex-row flex-wrap justify-between">
          <StatCard
            label="Shots Fired"
            value={stats.totalShotsFired.toLocaleString()}
          />
          <StatCard
            label="Shots Hit"
            value={stats.totalShotsHit.toLocaleString()}
            color={theme.colors.player.bullet}
          />
          <StatCard
            label="Best Accuracy"
            value={`${stats.bestAccuracy.toFixed(1)}%`}
            color={theme.colors.powerUps.rapid_fire}
          />
          <StatCard
            label="Shots Missed"
            value={(stats.totalShotsFired - stats.totalShotsHit).toLocaleString()}
          />
        </View>

        {/* Favorites */}
        <SectionHeader title="Favorites" />
        <View className="flex-row flex-wrap justify-between">
          <StatCard
            label="Favorite Ship"
            value={stats.favoriteShip.charAt(0).toUpperCase() + stats.favoriteShip.slice(1)}
            color={theme.colors.player.ship}
          />
          <StatCard
            label="Favorite Theme"
            value={stats.favoriteTheme.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            color={theme.colors.accent}
          />
        </View>

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
