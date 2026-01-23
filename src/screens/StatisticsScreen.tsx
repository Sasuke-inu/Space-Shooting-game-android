import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useI18nStore } from '../i18n';
import { useTheme } from '../theme';
import { useStatisticsStore, useAchievementStore } from '../state/progressStore';
import { SHIP_STATS, BOSS_STATS, ShipType } from '../types/game';

type TabType = 'overview' | 'perShip' | 'achievements';

export default function StatisticsScreen() {
  const theme = useTheme();
  const { t } = useI18nStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const { stats } = useStatisticsStore();
  const { achievements } = useAchievementStore((s) => ({ achievements: s.achievements }));

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const calculateAccuracy = (): string => {
    if (stats.totalShotsFired === 0) return '0%';
    return `${((stats.totalShotsHit / stats.totalShotsFired) * 100).toFixed(1)}%`;
  };

  const unlockedCount = Object.values(achievements).filter((a) => a.unlocked).length;
  const totalAchievements = Object.keys(achievements).length;

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
      </View>

      {/* Tabs */}
      <View
        className="flex-row border-b"
        style={{ borderBottomColor: theme.colors.panelBorder }}
      >
        {(['overview', 'perShip', 'achievements'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            className="flex-1 py-4"
            style={{
              backgroundColor:
                activeTab === tab ? theme.colors.panelBg : 'transparent',
              borderBottomWidth: activeTab === tab ? 2 : 0,
              borderBottomColor: theme.colors.buttonPrimary,
            }}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              className="text-center text-base font-semibold"
              style={{
                color:
                  activeTab === tab
                    ? theme.colors.textPrimary
                    : theme.colors.textMuted,
              }}
            >
              {t(`statistics.tabs.${tab}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View>
            {/* Lifetime Stats Section */}
            <View className="mb-6">
              <Text
                className="text-xl font-bold mb-4"
                style={{ color: theme.colors.textPrimary }}
              >
                Lifetime Statistics
              </Text>

              {/* Stats Grid */}
              <View className="space-y-3">
                {/* Total Games */}
                <View
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: theme.colors.panelBg,
                    borderColor: theme.colors.panelBorder,
                  }}
                >
                  <Text
                    className="text-sm font-semibold mb-1"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Total Games
                  </Text>
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    {stats.totalGames.toLocaleString()}
                  </Text>
                </View>

                {/* Time Played */}
                <View
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: theme.colors.panelBg,
                    borderColor: theme.colors.panelBorder,
                  }}
                >
                  <Text
                    className="text-sm font-semibold mb-1"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Total Time Played
                  </Text>
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    {formatTime(stats.totalTimePlayed)}
                  </Text>
                </View>

                {/* Total Kills */}
                <View
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: theme.colors.panelBg,
                    borderColor: theme.colors.panelBorder,
                  }}
                >
                  <Text
                    className="text-sm font-semibold mb-1"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Total Enemies Killed
                  </Text>
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    {stats.totalKills.toLocaleString()}
                  </Text>
                </View>

                {/* Accuracy */}
                <View
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: theme.colors.panelBg,
                    borderColor: theme.colors.panelBorder,
                  }}
                >
                  <Text
                    className="text-sm font-semibold mb-1"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Overall Accuracy
                  </Text>
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    {calculateAccuracy()}
                  </Text>
                </View>

                {/* Best Combo */}
                <View
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: theme.colors.panelBg,
                    borderColor: theme.colors.panelBorder,
                  }}
                >
                  <Text
                    className="text-sm font-semibold mb-1"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {t('statistics.labels.bestCombo')}
                  </Text>
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    {stats.highestCombo}x
                  </Text>
                </View>
              </View>
            </View>

            {/* Best Records Section */}
            <View className="mb-6">
              <Text
                className="text-xl font-bold mb-4"
                style={{ color: theme.colors.textPrimary }}
              >
                Best Records
              </Text>

              <View className="space-y-3">
                {/* Highest Score */}
                <View
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: theme.colors.panelBg,
                    borderColor: theme.colors.panelBorder,
                  }}
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      Highest Score
                    </Text>
                    <Text
                      className="text-2xl font-bold"
                      style={{ color: theme.colors.textPrimary }}
                    >
                      {stats.highestScore.toLocaleString()}
                    </Text>
                  </View>
                  {stats.highestScore > 0 && (
                    <View
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: theme.colors.panelBorder }}
                    >
                      <View
                        className="h-2 rounded-full"
                        style={{
                          backgroundColor: theme.colors.buttonPrimary,
                          width: `${Math.min((stats.highestScore / 100000) * 100, 100)}%`,
                        }}
                      />
                    </View>
                  )}
                </View>

                {/* Highest Wave */}
                <View
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: theme.colors.panelBg,
                    borderColor: theme.colors.panelBorder,
                  }}
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      Highest Wave
                    </Text>
                    <Text
                      className="text-2xl font-bold"
                      style={{ color: theme.colors.textPrimary }}
                    >
                      {stats.highestWave}
                    </Text>
                  </View>
                  {stats.highestWave > 0 && (
                    <View
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: theme.colors.panelBorder }}
                    >
                      <View
                        className="h-2 rounded-full"
                        style={{
                          backgroundColor: theme.colors.buttonPrimary,
                          width: `${Math.min((stats.highestWave / 50) * 100, 100)}%`,
                        }}
                      />
                    </View>
                  )}
                </View>

                {/* Longest Survival */}
                <View
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: theme.colors.panelBg,
                    borderColor: theme.colors.panelBorder,
                  }}
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      Longest Survival
                    </Text>
                    <Text
                      className="text-2xl font-bold"
                      style={{ color: theme.colors.textPrimary }}
                    >
                      {formatTime(stats.longestSurvival)}
                    </Text>
                  </View>
                  {stats.longestSurvival > 0 && (
                    <View
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: theme.colors.panelBorder }}
                    >
                      <View
                        className="h-2 rounded-full"
                        style={{
                          backgroundColor: theme.colors.buttonPrimary,
                          width: `${Math.min((stats.longestSurvival / 600) * 100, 100)}%`,
                        }}
                      />
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Kills by Enemy Type Chart */}
            {stats.totalKills > 0 && (
              <View className="mb-6">
                <Text
                  className="text-xl font-bold mb-4"
                  style={{ color: theme.colors.textPrimary }}
                >
                  {t('statistics.charts.killsByType')}
                </Text>

                <View
                  className="rounded-lg border p-4"
                  style={{
                    backgroundColor: theme.colors.panelBg,
                    borderColor: theme.colors.panelBorder,
                  }}
                >
                  <BarChart
                    data={{
                      labels: ['Scout', 'Tank', 'Sniper', 'Bomber'],
                      datasets: [
                        {
                          data: [
                            stats.killsByEnemyType.scout || 0,
                            stats.killsByEnemyType.tank || 0,
                            stats.killsByEnemyType.sniper || 0,
                            stats.killsByEnemyType.bomber || 0,
                          ],
                        },
                      ],
                    }}
                    width={Dimensions.get('window').width - 80}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={{
                      backgroundColor: theme.colors.panelBg,
                      backgroundGradientFrom: theme.colors.panelBg,
                      backgroundGradientTo: theme.colors.panelBg,
                      decimalPlaces: 0,
                      color: (opacity = 1) => `${theme.colors.buttonPrimary}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
                      labelColor: (opacity = 1) => `${theme.colors.textSecondary}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
                      style: {
                        borderRadius: 16,
                      },
                      propsForBackgroundLines: {
                        strokeDasharray: '',
                        stroke: theme.colors.panelBorder,
                        strokeWidth: 1,
                      },
                    }}
                    style={{
                      marginVertical: 8,
                      borderRadius: 16,
                    }}
                    showValuesOnTopOfBars
                    fromZero
                  />
                </View>
              </View>
            )}

            {/* Boss Kills Section */}
            <View className="mb-6">
              <Text
                className="text-xl font-bold mb-4"
                style={{ color: theme.colors.textPrimary }}
              >
                {t('statistics.labels.bossKills')}
              </Text>

              <View className="space-y-3">
                {Object.entries(stats.killsByBossType).map(([bossType, kills]) => {
                  const maxBossKills = Math.max(...Object.values(stats.killsByBossType), 1);
                  const percentage = (kills / maxBossKills) * 100;

                  return (
                    <View
                      key={bossType}
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: theme.colors.panelBg,
                        borderColor: theme.colors.panelBorder,
                      }}
                    >
                      <View className="flex-row justify-between items-center mb-2">
                        <Text
                          className="text-sm font-semibold capitalize"
                          style={{ color: theme.colors.textSecondary }}
                        >
                          {bossType}
                        </Text>
                        <Text
                          className="text-2xl font-bold"
                          style={{ color: theme.colors.textPrimary }}
                        >
                          {kills}
                        </Text>
                      </View>

                      {/* Visual bar */}
                      <View
                        className="h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: theme.colors.panelBorder }}
                      >
                        <View
                          className="h-2 rounded-full"
                          style={{
                            backgroundColor: theme.colors.buttonPrimary,
                            width: `${percentage}%`,
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Power-Ups Collected */}
            <View className="mb-6">
              <Text
                className="text-xl font-bold mb-4"
                style={{ color: theme.colors.textPrimary }}
              >
                {t('statistics.labels.powerUpsCollected')}
              </Text>

              <View
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: theme.colors.panelBg,
                  borderColor: theme.colors.panelBorder,
                }}
              >
                <Text
                  className="text-2xl font-bold"
                  style={{ color: theme.colors.textPrimary }}
                >
                  {stats.totalPowerUpsCollected.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Per-Ship Stats Tab */}
        {activeTab === 'perShip' && (
          <View>
            <Text
              className="text-xl font-bold mb-4"
              style={{ color: theme.colors.textPrimary }}
            >
              Per-Ship Statistics
            </Text>

            {stats.totalGames === 0 ? (
              <View className="py-8">
                <Text
                  className="text-center text-lg"
                  style={{ color: theme.colors.textMuted }}
                >
                  {t('statistics.labels.noDataYet')}
                </Text>
                <Text
                  className="text-center text-sm mt-2"
                  style={{ color: theme.colors.textMuted }}
                >
                  {t('statistics.labels.playToUnlock')}
                </Text>
              </View>
            ) : (
              <View className="space-y-4">
                {(['fighter', 'scout', 'tank', 'interceptor'] as ShipType[]).map((shipType) => {
                  const shipStats = stats.perShipStats[shipType];
                  const isFavorite = stats.favoriteShip === shipType;

                  return (
                    <View
                      key={shipType}
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: theme.colors.panelBg,
                        borderColor: isFavorite
                          ? theme.colors.buttonPrimary
                          : theme.colors.panelBorder,
                        borderWidth: isFavorite ? 2 : 1,
                      }}
                    >
                      <View className="flex-row items-center justify-between mb-3">
                        <Text
                          className="text-lg font-bold capitalize"
                          style={{ color: theme.colors.textPrimary }}
                        >
                          {shipType}
                          {isFavorite && (
                            <Text style={{ color: theme.colors.buttonPrimary }}>
                              {' '}★
                            </Text>
                          )}
                        </Text>
                        <Text
                          className="text-sm"
                          style={{ color: theme.colors.textMuted }}
                        >
                          {SHIP_STATS[shipType].special}
                        </Text>
                      </View>

                      <View className="space-y-2">
                        <View className="flex-row justify-between">
                          <Text
                            className="text-sm"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            Games Played
                          </Text>
                          <Text
                            className="text-sm font-semibold"
                            style={{ color: theme.colors.textPrimary }}
                          >
                            {shipStats.games}
                          </Text>
                        </View>

                        <View className="flex-row justify-between">
                          <Text
                            className="text-sm"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            Best Score
                          </Text>
                          <Text
                            className="text-sm font-semibold"
                            style={{ color: theme.colors.textPrimary }}
                          >
                            {shipStats.bestScore.toLocaleString()}
                          </Text>
                        </View>

                        <View className="flex-row justify-between">
                          <Text
                            className="text-sm"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            Best Wave
                          </Text>
                          <Text
                            className="text-sm font-semibold"
                            style={{ color: theme.colors.textPrimary }}
                          >
                            {shipStats.bestWave}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <View>
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className="text-xl font-bold"
                style={{ color: theme.colors.textPrimary }}
              >
                Achievements
              </Text>
              <Text
                className="text-sm font-semibold"
                style={{ color: theme.colors.textSecondary }}
              >
                {unlockedCount} / {totalAchievements}
              </Text>
            </View>

            <View className="space-y-3">
              {Object.values(achievements).map((achievement) => (
                <View
                  key={achievement.id}
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: theme.colors.panelBg,
                    borderColor: achievement.unlocked
                      ? theme.colors.buttonPrimary
                      : theme.colors.panelBorder,
                    opacity: achievement.unlocked ? 1 : 0.6,
                  }}
                >
                  <View className="flex-row items-start">
                    <Text className="text-3xl mr-3">{achievement.icon}</Text>
                    <View className="flex-1">
                      <Text
                        className="text-base font-bold mb-1"
                        style={{ color: theme.colors.textPrimary }}
                      >
                        {achievement.name}
                      </Text>
                      <Text
                        className="text-sm mb-2"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        {achievement.description}
                      </Text>

                      {/* Progress Bar for Progressive Achievements */}
                      {achievement.target && achievement.target > 1 && !achievement.unlocked && (
                        <View>
                          <View
                            className="h-2 rounded-full mb-1"
                            style={{ backgroundColor: theme.colors.panelBorder }}
                          >
                            <View
                              className="h-2 rounded-full"
                              style={{
                                backgroundColor: theme.colors.buttonPrimary,
                                width: `${((achievement.progress || 0) / achievement.target) * 100}%`,
                              }}
                            />
                          </View>
                          <Text
                            className="text-xs"
                            style={{ color: theme.colors.textMuted }}
                          >
                            {achievement.progress || 0} / {achievement.target}
                          </Text>
                        </View>
                      )}

                      {/* Unlocked Status */}
                      {achievement.unlocked && achievement.unlockedAt && (
                        <Text
                          className="text-xs mt-1"
                          style={{ color: theme.colors.textMuted }}
                        >
                          Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
