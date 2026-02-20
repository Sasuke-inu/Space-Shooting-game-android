import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18nStore } from '../i18n';
import { useTheme } from '../theme';
import { useGameStore } from '../state/gameStore';
import type { GameMode } from '../types/game';

interface MenuScreenProps {
  onStartGame: (mode: GameMode) => void;
  onShowSettings: () => void;
  onShowHighScores: () => void;
}

export default function MenuScreen({
  onStartGame,
  onShowSettings,
  onShowHighScores,
}: MenuScreenProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useI18nStore();
  const setGameMode = useGameStore((s) => s.setGameMode);

  const handleModeSelect = (mode: GameMode) => {
    setGameMode(mode);
    onStartGame(mode);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 24,
        }}
      >
        {/* Title */}
        <View className="items-center mb-12">
          <Text
            className="text-5xl font-bold mb-2"
            style={{ color: theme.colors.textPrimary }}
          >
            Space Shooter
          </Text>
          <View
            className="h-1 rounded-full mt-2"
            style={{
              width: 120,
              backgroundColor: theme.colors.buttonPrimary,
            }}
          />
        </View>

        {/* Game Mode Selection */}
        <View className="mb-8">
          <Text
            className="text-lg font-semibold mb-4 text-center"
            style={{ color: theme.colors.textSecondary }}
          >
            Select Game Mode
          </Text>

          {/* Campaign Mode Button */}
          <TouchableOpacity
            className="mb-4 p-6 rounded-2xl border-2"
            style={{
              backgroundColor: theme.colors.panelBg,
              borderColor: theme.colors.buttonPrimary,
            }}
            onPress={() => handleModeSelect('campaign')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Campaign Mode"
            accessibilityHint="Start campaign mode with waves of enemies and bosses every 5 waves"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text
                className="text-2xl font-bold"
                style={{ color: theme.colors.textPrimary }}
              >
                Campaign Mode
              </Text>
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: theme.colors.buttonPrimary }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: theme.colors.buttonText }}
                >
                  CLASSIC
                </Text>
              </View>
            </View>
            <Text
              className="text-sm leading-5"
              style={{ color: theme.colors.textMuted }}
            >
              Battle through waves of enemies and face powerful bosses every 5 waves. Test your skills in the classic game mode.
            </Text>
          </TouchableOpacity>

          {/* Endless Mode Button */}
          <TouchableOpacity
            className="p-6 rounded-2xl border-2"
            style={{
              backgroundColor: theme.colors.panelBg,
              borderColor: theme.colors.accent,
            }}
            onPress={() => handleModeSelect('endless')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Endless Mode"
            accessibilityHint="Start endless survival mode without boss encounters"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text
                className="text-2xl font-bold"
                style={{ color: theme.colors.textPrimary }}
              >
                Endless Mode
              </Text>
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: theme.colors.accent }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: theme.colors.background }}
                >
                  SURVIVAL
                </Text>
              </View>
            </View>
            <Text
              className="text-sm leading-5"
              style={{ color: theme.colors.textMuted }}
            >
              Survive endless waves without boss encounters. Pure skill-based survival for the ultimate high score challenge.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Secondary Buttons */}
        <View className="space-y-3">
          <TouchableOpacity
            className="p-4 rounded-xl border"
            style={{
              backgroundColor: theme.colors.panelBg,
              borderColor: theme.colors.panelBorder,
            }}
            onPress={onShowHighScores}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="High Scores"
            accessibilityHint="View high scores leaderboard"
          >
            <Text
              className="text-center text-lg font-semibold"
              style={{ color: theme.colors.textPrimary }}
            >
              {t('menu.highScores')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="p-4 rounded-xl border"
            style={{
              backgroundColor: theme.colors.panelBg,
              borderColor: theme.colors.panelBorder,
            }}
            onPress={onShowSettings}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            accessibilityHint="Open settings menu"
          >
            <Text
              className="text-center text-lg font-semibold"
              style={{ color: theme.colors.textPrimary }}
            >
              {t('menu.settings')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
