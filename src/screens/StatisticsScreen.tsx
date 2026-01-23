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
  const { stats, lastSessionStats } = useStatisticsStore();
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
              style={{ color: theme.colors.textPrimary }}
            >
              {t('general.back')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* Overview Stats */}
        <SectionHeader title={t('statistics.sectionOverview')} />
        <View className="flex-row flex-wrap justify-between">
          <StatCard
            label={t('stats.gamesPlayed')}
            value={stats.totalGames}
            color={theme.colors.hudAccent}
          />
          <StatCard
            label={t('stats.totalScore')}
            value={stats.totalScore.toLocaleString()}
            color={theme.colors.hudAccent}
          />
          <StatCard
            label={t('stats.highScore')}
            value={stats.highestScore.toLocaleString()}
            color={theme.colors.powerUpMagnet}
          />
          <StatCard
            label={t('stats.averageScore')}
            value={calculateAverageScore().toLocaleString()}
          />
        </View>

        {/* Recent Session Stats */}
        <SectionHeader title={t('statistics.sectionRecentSession')} />
        {lastSessionStats ? (
          <View className="flex-row flex-wrap justify-between">
            <StatCard
              label={t('statistics.sessionScore')}
              value={lastSessionStats.score.toLocaleString()}
              color={theme.colors.hudAccent}
            />
            <StatCard
              label={t('statistics.sessionWave')}
              value={lastSessionStats.wave}
              color={theme.colors.powerUpSpreadShot}
            />
            <StatCard
              label={t('statistics.sessionKills')}
              value={lastSessionStats.kills}
              color={theme.colors.enemyBullet}
            />
            <StatCard
              label={t('statistics.sessionAccuracy')}
              value={`${lastSessionStats.accuracy.toFixed(1)}%`}
              color={theme.colors.powerUpRapidFire}
            />
            <StatCard
              label={t('statistics.sessionTime')}
              value={formatTime(lastSessionStats.time)}
            />
          </View>
        ) : (
          <View className="px-2 py-4">
            <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
              {t('statistics.noRecentSession')}
            </Text>
          </View>
        )}

        {/* Combat Stats */}
        <SectionHeader title={t('statistics.sectionCombat')} />
        <View className="flex-row flex-wrap justify-between">
          <StatCard
            label={t('statistics.totalKills')}
            value={stats.totalKills}
            color={theme.colors.enemyBullet}
          />
          <StatCard
            label={t('statistics.totalDeaths')}
            value={stats.totalDeaths}
          />
          <StatCard
            label={t('statistics.kdRatio')}
            value={calculateKDRatio()}
            color={theme.colors.hudAccent}
          />
          <StatCard
            label={t('statistics.bossesDefeated')}
            value={stats.totalBossesDefeated}
            color={theme.colors.powerUpShield}
          />
          <StatCard
            label={t('statistics.accuracy')}
            value={calculateAccuracy()}
            color={theme.colors.powerUpRapidFire}
          />
          <StatCard
            label={t('statistics.highestCombo')}
            value={`${stats.highestCombo}x`}
            color={theme.colors.comboText}
          />
        </View>

        {/* Kills by Enemy Type */}
        <SectionHeader title={t('statistics.sectionEnemyKills')} />
        <View className="flex-row flex-wrap justify-between">
          <StatCard
            label={t('enemyTypes.scout')}
            value={stats.killsByEnemyType.scout}
          />
          <StatCard
            label={t('enemyTypes.tank')}
            value={stats.killsByEnemyType.tank}
          />
          <StatCard
            label={t('enemyTypes.sniper')}
            value={stats.killsByEnemyType.sniper}
          />
          <StatCard
            label={t('enemyTypes.bomber')}
            value={stats.killsByEnemyType.bomber}
          />
        </View>

        {/* Kills by Boss Type */}
        <SectionHeader title={t('statistics.sectionBossKills')} />
        <View className="flex-row flex-wrap justify-between">
          <StatCard
            label={t('bossTypes.destroyer')}
            value={stats.killsByBossType.destroyer}
            color={theme.colors.enemyShip}
          />
          <StatCard
            label={t('bossTypes.carrier')}
            value={stats.killsByBossType.carrier}
            color={theme.colors.enemyShip}
          />
          <StatCard
            label={t('bossTypes.dreadnought')}
            value={stats.killsByBossType.dreadnought}
            color={theme.colors.enemyShip}
          />
        </View>

        {/* Progress Stats */}
        <SectionHeader title={t('statistics.sectionProgress')} />
        <View className="flex-row flex-wrap justify-between">
          <StatCard
            label={t('stats.highestWave')}
            value={stats.highestWave}
            color={theme.colors.powerUpSpreadShot}
          />
          <StatCard
            label={t('statistics.longestSurvivalTime')}
            value={formatTime(stats.longestSurvival)}
          />
          <StatCard
            label={t('statistics.totalPlayTime')}
            value={formatTime(stats.totalTimePlayed)}
            color={theme.colors.hudAccent}
          />
          <StatCard
            label={t('statistics.powerUpsCollected')}
            value={stats.totalPowerUpsCollected}
            color={theme.colors.powerUpMagnet}
          />
        </View>

        {/* Achievements */}
        <SectionHeader title={t('statistics.sectionAchievements')} />

        {/* Summary Cards */}
        <View className="flex-row flex-wrap justify-between mb-2">
          <StatCard
            label={t('statistics.unlocked')}
            value={`${unlockedCount}/${totalAchievements}`}
            color={theme.colors.powerUpMagnet}
          />
          <StatCard
            label={t('statistics.completion')}
            value={`${((unlockedCount / totalAchievements) * 100).toFixed(0)}%`}
            color={theme.colors.hudAccent}
          />
        </View>

        {/* Individual Achievement List */}
        <View className="px-2">
          {Object.values(achievements)
            .sort((a, b) => {
              // Sort: unlocked first (by date desc), then locked
              if (a.unlocked && !b.unlocked) return -1;
              if (!a.unlocked && b.unlocked) return 1;
              if (a.unlocked && b.unlocked) {
                return (b.unlockedAt || 0) - (a.unlockedAt || 0);
              }
              return 0;
            })
            .map((achievement) => (
              <View
                key={achievement.id}
                className="flex-row items-center p-3 mb-2 rounded-lg"
                style={{
                  backgroundColor: theme.colors.panelBg,
                  borderColor: achievement.unlocked
                    ? theme.colors.hudAccent
                    : theme.colors.panelBorder,
                  borderWidth: 1,
                  opacity: achievement.unlocked ? 1 : 0.6,
                }}
              >
                <Text style={{ fontSize: 24, marginRight: 12 }}>
                  {achievement.icon}
                </Text>
                <View className="flex-1">
                  <Text
                    style={{
                      color: theme.colors.textPrimary,
                      fontWeight: '600',
                      marginBottom: 2
                    }}
                  >
                    {achievement.name}
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: 12,
                      marginBottom: 4
                    }}
                  >
                    {achievement.description}
                  </Text>
                  {achievement.unlocked && achievement.unlockedAt && (
                    <Text
                      style={{
                        color: theme.colors.hudAccent,
                        fontSize: 11,
                        fontStyle: 'italic'
                      }}
                    >
                      {t('statistics.unlockedOn')}: {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                {achievement.unlocked && (
                  <Text style={{ color: theme.colors.hudAccent, fontSize: 20 }}>
                    ✓
                  </Text>
                )}
                {!achievement.unlocked && (
                  <Text style={{ color: theme.colors.textMuted, fontSize: 16 }}>
                    🔒
                  </Text>
                )}
              </View>
            ))}
        </View>

        {/* Shooting Stats */}
        <SectionHeader title={t('statistics.sectionShooting')} />
        <View className="flex-row flex-wrap justify-between">
          <StatCard
            label={t('statistics.shotsFired')}
            value={stats.totalShotsFired.toLocaleString()}
          />
          <StatCard
            label={t('statistics.shotsHit')}
            value={stats.totalShotsHit.toLocaleString()}
            color={theme.colors.playerBullet}
          />
          <StatCard
            label={t('statistics.bestAccuracy')}
            value={`${stats.bestAccuracy.toFixed(1)}%`}
            color={theme.colors.powerUpRapidFire}
          />
          <StatCard
            label={t('statistics.shotsMissed')}
            value={(stats.totalShotsFired - stats.totalShotsHit).toLocaleString()}
          />
        </View>

        {/* Favorites */}
        <SectionHeader title={t('statistics.sectionFavorites')} />
        <View className="flex-row flex-wrap justify-between">
          <StatCard
            label={t('statistics.favoriteShip')}
            value={stats.favoriteShip.charAt(0).toUpperCase() + stats.favoriteShip.slice(1)}
            color={theme.colors.playerShip}
          />
          <StatCard
            label={t('statistics.favoriteTheme')}
            value={stats.favoriteTheme.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            color={theme.colors.hudAccent}
          />
        </View>

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
