import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useI18nStore } from '../i18n';
import { useHighScoresStore } from '../state/highScoresStore';
import type { RootStackParamList } from '../navigation/AppNavigator';

type HighScoresNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HighScoresScreen() {
  const theme = useTheme();
  const { t } = useI18nStore();
  const navigation = useNavigation<HighScoresNavigationProp>();
  const scores = useHighScoresStore((state) => state.scores);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatScore = (score: number): string => {
    return score.toLocaleString();
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
          {t('menu.highScores')}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {scores.length === 0 ? (
          // Empty state
          <View className="flex-1 justify-center items-center py-20">
            <Text
              className="text-lg text-center"
              style={{ color: theme.colors.textMuted }}
            >
              No high scores yet.{'\n'}Play a game to set your first record!
            </Text>
          </View>
        ) : (
          // High scores list
          <View>
            {scores.map((score, index) => (
              <View
                key={`${score.date}-${index}`}
                className="mb-4 p-4 rounded-lg border"
                style={{
                  backgroundColor: theme.colors.panelBg,
                  borderColor: theme.colors.panelBorder,
                }}
              >
                {/* Rank and Name */}
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{
                        backgroundColor:
                          index === 0
                            ? '#FFD700' // Gold
                            : index === 1
                            ? '#C0C0C0' // Silver
                            : index === 2
                            ? '#CD7F32' // Bronze
                            : theme.colors.buttonSecondary,
                      }}
                    >
                      <Text
                        className="text-lg font-bold"
                        style={{
                          color: index < 3 ? '#000000' : theme.colors.textPrimary,
                        }}
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <Text
                      className="text-xl font-bold"
                      style={{ color: theme.colors.textPrimary }}
                    >
                      {score.name}
                    </Text>
                  </View>
                </View>

                {/* Score and Wave */}
                <View className="flex-row justify-between items-center mb-1">
                  <Text
                    className="text-sm"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {t('game.score')}:
                  </Text>
                  <Text
                    className="text-xl font-bold"
                    style={{ color: theme.colors.buttonPrimary }}
                  >
                    {formatScore(score.score)}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center mb-1">
                  <Text
                    className="text-sm"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {t('game.wave')}:
                  </Text>
                  <Text
                    className="text-base font-semibold"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    {score.wave}
                  </Text>
                </View>

                {/* Date */}
                <View className="flex-row justify-between items-center">
                  <Text
                    className="text-xs"
                    style={{ color: theme.colors.textMuted }}
                  >
                    {formatDate(score.date)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Back Button */}
      <View
        className="p-6 border-t"
        style={{
          backgroundColor: theme.colors.panelBg,
          borderTopColor: theme.colors.panelBorder,
        }}
      >
        <TouchableOpacity
          className="py-4 rounded-lg items-center"
          style={{ backgroundColor: theme.colors.buttonSecondary }}
          onPress={() => navigation.goBack()}
        >
          <Text
            className="text-lg font-semibold"
            style={{ color: theme.colors.textPrimary }}
          >
            {t('general.back')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
