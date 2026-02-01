import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedStarBackground } from '../components/AnimatedStarBackground';
import { useTheme } from '../theme';
import { useI18nStore } from '../i18n';
import type { RootStackParamList } from '../navigation/AppNavigator';

type MainMenuNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MainMenuScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainMenuNavigationProp>();
  const theme = useTheme();
  const { t } = useI18nStore();

  // Animation time for background
  const [time, setTime] = useState(0);
  const rafRef = useRef<number | null>(null);

  // Animate background
  useEffect(() => {
    let lastTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setTime((prev) => prev + dt);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handlePlay = () => {
    navigation.navigate('Game');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleShips = () => {
    navigation.navigate('ShipSelection');
  };

  const handleHighScores = () => {
    navigation.navigate('HighScores');
  };

  const handleChallenges = () => {
    navigation.navigate('Challenges');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      {/* Animated Background */}
      <View className="absolute inset-0">
        <AnimatedStarBackground
          width={width}
          height={height}
          colors={theme.colors}
          time={time}
          starCount={100}
          speed={10}
        />
      </View>

      {/* Content */}
      <View
        className="flex-1 justify-center items-center px-8"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        {/* Game Title */}
        <View className="mb-16">
          <Text
            className="text-5xl font-bold text-center mb-2"
            style={{ color: theme.colors.textPrimary }}
          >
            SPACE SHOOTER
          </Text>
          <Text
            className="text-lg text-center"
            style={{ color: theme.colors.textSecondary }}
          >
            Defend the Galaxy
          </Text>
        </View>

        {/* Menu Buttons */}
        <View className="w-full max-w-sm space-y-4">
          {/* Play Button */}
          <TouchableOpacity
            className="py-4 px-8 rounded-lg border-2"
            style={{
              backgroundColor: theme.colors.buttonPrimary,
              borderColor: theme.colors.textPrimary,
            }}
            onPress={handlePlay}
            activeOpacity={0.8}
          >
            <Text
              className="text-2xl font-bold text-center"
              style={{ color: theme.colors.textPrimary }}
            >
              {t('menu.play')}
            </Text>
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity
            className="py-4 px-8 rounded-lg border"
            style={{
              backgroundColor: theme.colors.panelBg,
              borderColor: theme.colors.panelBorder,
            }}
            onPress={handleSettings}
            activeOpacity={0.8}
          >
            <Text
              className="text-xl font-semibold text-center"
              style={{ color: theme.colors.textPrimary }}
            >
              {t('menu.settings')}
            </Text>
          </TouchableOpacity>

          {/* Ships Button */}
          <TouchableOpacity
            className="py-4 px-8 rounded-lg border"
            style={{
              backgroundColor: theme.colors.panelBg,
              borderColor: theme.colors.panelBorder,
            }}
            onPress={handleShips}
            activeOpacity={0.8}
          >
            <Text
              className="text-xl font-semibold text-center"
              style={{ color: theme.colors.textPrimary }}
            >
              {t('menu.ships')}
            </Text>
          </TouchableOpacity>

          {/* Daily Challenges Button */}
          <TouchableOpacity
            className="py-4 px-8 rounded-lg border"
            style={{
              backgroundColor: theme.colors.panelBg,
              borderColor: theme.colors.panelBorder,
            }}
            onPress={handleChallenges}
            activeOpacity={0.8}
          >
            <Text
              className="text-xl font-semibold text-center"
              style={{ color: theme.colors.textPrimary }}
            >
              {t('menu.challenges')}
            </Text>
          </TouchableOpacity>

          {/* High Scores Button */}
          <TouchableOpacity
            className="py-4 px-8 rounded-lg border"
            style={{
              backgroundColor: theme.colors.panelBg,
              borderColor: theme.colors.panelBorder,
            }}
            onPress={handleHighScores}
            activeOpacity={0.8}
          >
            <Text
              className="text-xl font-semibold text-center"
              style={{ color: theme.colors.textPrimary }}
            >
              {t('menu.highScores')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="absolute bottom-8">
          <Text
            className="text-sm text-center"
            style={{ color: theme.colors.textMuted }}
          >
            v1.0.0
          </Text>
        </View>
      </View>
    </View>
  );
}
