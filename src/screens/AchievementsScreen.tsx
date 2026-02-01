import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useI18nStore } from '../i18n';
import { useTheme } from '../theme';
import { useAchievementStore } from '../state/progressStore';
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  type AchievementCategory,
  getAllCategories,
  getCategoryDisplayName,
  getCategoryIcon,
  getAchievementsByCategory,
  getAchievementCounts,
  getAchievementCompletionPercentage,
} from '../utils/achievementTracker';
import { ACHIEVEMENTS, type AchievementId } from '../types/game';

type AchievementsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AchievementsScreen() {
  const navigation = useNavigation<AchievementsNavigationProp>();
  const theme = useTheme();
  const { t } = useI18nStore();
  const { achievements } = useAchievementStore();
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');

  // Calculate summary stats
  const { unlocked: unlockedCount, total: totalCount } = getAchievementCounts();
  const completionPercentage = getAchievementCompletionPercentage();

  // Filter achievements by category
  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'all') {
      return Object.keys(achievements) as (keyof typeof achievements)[];
    }
    return getAchievementsByCategory(selectedCategory);
  }, [selectedCategory, achievements]);

  // Sort achievements: unlocked first, then by credit reward (highest first)
  const sortedAchievementIds = useMemo(() => {
    return [...filteredAchievements].sort((a, b) => {
      const achievementA = achievements[a];
      const achievementB = achievements[b];

      // First sort by unlocked status
      if (achievementA.unlocked && !achievementB.unlocked) return -1;
      if (!achievementA.unlocked && achievementB.unlocked) return 1;

      // Then by credit reward (highest first)
      const rewardA = ACHIEVEMENTS[a].creditReward || 0;
      const rewardB = ACHIEVEMENTS[b].creditReward || 0;
      return rewardB - rewardA;
    });
  }, [filteredAchievements, achievements]);

  const CategoryTab = ({ category, label, icon }: { category: AchievementCategory | 'all'; label: string; icon: string }) => {
    const isSelected = selectedCategory === category;
    return (
      <TouchableOpacity
        className="px-4 py-2 mr-2 rounded-full border"
        style={{
          backgroundColor: isSelected ? theme.colors.buttonPrimary : theme.colors.panelBg,
          borderColor: isSelected ? theme.colors.buttonPrimary : theme.colors.panelBorder,
        }}
        onPress={() => setSelectedCategory(category)}
      >
        <View className="flex-row items-center">
          <Text className="text-base mr-1">{icon}</Text>
          <Text
            className="text-sm font-semibold"
            style={{ color: isSelected ? '#fff' : theme.colors.textPrimary }}
          >
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const AchievementCard = ({ achievementId }: { achievementId: AchievementId }) => {
    const achievement = achievements[achievementId];
    const achievementDef = ACHIEVEMENTS[achievementId];
    const isUnlocked = achievement.unlocked;
    const hasProgress = achievementDef.target !== undefined;
    const progress = achievement.progress || 0;
    const target = achievementDef.target || 1;
    const progressPercentage = hasProgress ? Math.min((progress / target) * 100, 100) : 0;

    return (
      <View
        className="mb-3 p-4 rounded-lg border"
        style={{
          backgroundColor: isUnlocked
            ? theme.colors.panelBg
            : theme.colors.panelBg + '60',
          borderColor: isUnlocked
            ? theme.colors.hudAccent
            : theme.colors.panelBorder,
          opacity: isUnlocked ? 1 : 0.7,
        }}
      >
        {/* Achievement Header */}
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-row items-start flex-1">
            <Text className="text-3xl mr-3">{achievementDef.icon}</Text>
            <View className="flex-1">
              <Text
                className="text-base font-bold"
                style={{ color: theme.colors.textPrimary }}
              >
                {achievementDef.name}
              </Text>
              <Text
                className="text-sm mt-1"
                style={{ color: theme.colors.textSecondary }}
              >
                {achievementDef.description}
              </Text>
            </View>
          </View>
          {isUnlocked && (
            <View
              className="px-2 py-1 rounded ml-2"
              style={{ backgroundColor: theme.colors.hudAccent }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: '#fff' }}
              >
                ✓
              </Text>
            </View>
          )}
        </View>

        {/* Progress Bar (for progressive achievements) */}
        {hasProgress && (
          <View className="mt-2">
            <View
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: theme.colors.panelBorder }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  width: `${progressPercentage}%`,
                  backgroundColor: isUnlocked
                    ? theme.colors.hudAccent
                    : theme.colors.buttonPrimary,
                }}
              />
            </View>
            <Text
              className="text-xs mt-1"
              style={{ color: theme.colors.textMuted }}
            >
              {progress} / {target}
            </Text>
          </View>
        )}

        {/* Credit Reward */}
        {achievementDef.creditReward > 0 && (
          <View className="flex-row items-center justify-between mt-3 pt-3 border-t"
            style={{ borderTopColor: theme.colors.panelBorder }}
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: theme.colors.textSecondary }}
            >
              {t('general.credits')} Reward:
            </Text>
            <View className="flex-row items-center">
              <Text
                className="text-base font-bold"
                style={{
                  color: isUnlocked
                    ? theme.colors.hudAccent
                    : theme.colors.buttonPrimary
                }}
              >
                {achievementDef.creditReward}
              </Text>
              <Text
                className="text-base font-bold ml-1"
                style={{
                  color: isUnlocked
                    ? theme.colors.hudAccent
                    : theme.colors.buttonPrimary
                }}
              >
                💰
              </Text>
            </View>
          </View>
        )}

        {/* Unlock Date */}
        {isUnlocked && achievement.unlockedAt && (
          <Text
            className="text-xs mt-2"
            style={{ color: theme.colors.textMuted }}
          >
            Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    );
  };

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
          🏆 Achievements
        </Text>
        <TouchableOpacity
          className="absolute left-6 top-12 p-2"
          onPress={() => navigation.goBack()}
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

        {/* Summary Stats */}
        <View className="mt-4 flex-row justify-around">
          <View className="items-center">
            <Text
              className="text-2xl font-bold"
              style={{ color: theme.colors.hudAccent }}
            >
              {unlockedCount} / {totalCount}
            </Text>
            <Text
              className="text-sm"
              style={{ color: theme.colors.textSecondary }}
            >
              Unlocked
            </Text>
          </View>
          <View className="items-center">
            <Text
              className="text-2xl font-bold"
              style={{ color: theme.colors.hudAccent }}
            >
              {completionPercentage.toFixed(0)}%
            </Text>
            <Text
              className="text-sm"
              style={{ color: theme.colors.textSecondary }}
            >
              Completion
            </Text>
          </View>
        </View>
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 py-3 border-b"
        style={{
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.panelBorder,
          maxHeight: 60,
        }}
      >
        <CategoryTab category="all" label="All" icon="📋" />
        {getAllCategories().map((category) => (
          <CategoryTab
            key={category}
            category={category}
            label={getCategoryDisplayName(category)}
            icon={getCategoryIcon(category)}
          />
        ))}
      </ScrollView>

      {/* Achievements List */}
      <ScrollView className="flex-1 px-4 py-4">
        {sortedAchievementIds.length === 0 ? (
          <View className="flex-1 justify-center items-center py-12">
            <Text
              className="text-base text-center"
              style={{ color: theme.colors.textMuted }}
            >
              No achievements in this category
            </Text>
          </View>
        ) : (
          sortedAchievementIds.map((achievementId) => (
            <AchievementCard key={achievementId} achievementId={achievementId} />
          ))
        )}
      </ScrollView>
    </View>
  );
}
