import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  AppState,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AnimatedStarBackground } from '../components/AnimatedStarBackground';
import { useTheme } from '../theme';
import { useI18nStore } from '../i18n';
import { useWeeklyEventsStore } from '../state/weeklyEventsStore';
import WeeklyEventModal from '../components/WeeklyEventModal';
import { EventLeaderboardModal } from '../components/EventLeaderboardModal';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useGameStore } from '../state/gameStore';

type MainMenuNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MainMenuScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainMenuNavigationProp>();
  const theme = useTheme();
  const { t } = useI18nStore();
  const { getCurrentEvent, checkAndRefreshEvent } = useWeeklyEventsStore();
  const startEventGame = useGameStore((s) => s.startEventGame);

  // Animation time for background
  const [time, setTime] = useState(0);
  const rafRef = useRef<number | null>(null);

  // Weekly event state
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [leaderboardModalVisible, setLeaderboardModalVisible] = useState(false);
  const [eventTimeRemaining, setEventTimeRemaining] = useState('');
  const currentEvent = getCurrentEvent();

  // Pulse animation for event button
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.8);

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

  // Calculate event time remaining
  useEffect(() => {
    const calculateTimeRemaining = () => {
      if (!currentEvent) {
        setEventTimeRemaining('');
        return;
      }

      const now = Date.now();
      const diff = currentEvent.endDate - now;

      if (diff <= 0) {
        setEventTimeRemaining('Event Ended');
        checkAndRefreshEvent();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (days > 0) {
        setEventTimeRemaining(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setEventTimeRemaining(`${hours}h`);
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setEventTimeRemaining(`${minutes}m`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [currentEvent, checkAndRefreshEvent]);

  // Pulse animation for event button
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );

    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.8, { duration: 1000 })
      ),
      -1,
      false
    );
  }, [pulseScale, pulseOpacity]);

  // Refresh event on mount
  useEffect(() => {
    checkAndRefreshEvent();
  }, [checkAndRefreshEvent]);

  // Refresh event when app resumes from background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkAndRefreshEvent();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkAndRefreshEvent]);

  const handlePlay = () => {
    // Ensure we're starting a normal game (not event mode)
    // resetGame() in GameScreen will clear event mode flags
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

  const handleAchievements = () => {
    navigation.navigate('Achievements');
  };

  const handleWeeklyEvent = () => {
    setEventModalVisible(true);
  };

  const handlePlayEvent = () => {
    const event = getCurrentEvent();
    if (event) {
      // Start event game with modifiers
      startEventGame(event.id, event.modifiers);
    }
    setEventModalVisible(false);
    navigation.navigate('Game');
  };

  const handleViewLeaderboard = () => {
    setEventModalVisible(false);
    setLeaderboardModalVisible(true);
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));


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

          {/* Weekly Event Button */}
          {currentEvent && (
            <Animated.View style={pulseStyle}>
              <TouchableOpacity
                className="py-4 px-8 rounded-lg border-2"
                style={{
                  backgroundColor: theme.colors.hudAccent,
                  borderColor: theme.colors.textPrimary,
                }}
                onPress={handleWeeklyEvent}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center justify-center">
                  <Text className="text-2xl mr-2">⚡</Text>
                  <View className="flex-1">
                    <Text
                      className="text-xl font-bold text-center"
                      style={{ color: '#fff' }}
                    >
                      Weekly Event
                    </Text>
                    {eventTimeRemaining && (
                      <Text
                        className="text-xs text-center mt-1"
                        style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                      >
                        ⏱️ {eventTimeRemaining} remaining
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

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

          {/* Achievements Button */}
          <TouchableOpacity
            className="py-4 px-8 rounded-lg border"
            style={{
              backgroundColor: theme.colors.panelBg,
              borderColor: theme.colors.panelBorder,
            }}
            onPress={handleAchievements}
            activeOpacity={0.8}
          >
            <Text
              className="text-xl font-semibold text-center"
              style={{ color: theme.colors.textPrimary }}
            >
              {t('menu.achievements')}
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

      {/* Weekly Event Modal */}
      <WeeklyEventModal
        visible={eventModalVisible}
        onClose={() => setEventModalVisible(false)}
        onPlayEvent={handlePlayEvent}
        onViewLeaderboard={handleViewLeaderboard}
      />

      {/* Event Leaderboard Modal */}
      {currentEvent && (
        <EventLeaderboardModal
          visible={leaderboardModalVisible}
          onClose={() => setLeaderboardModalVisible(false)}
          eventId={currentEvent.id}
        />
      )}
    </View>
  );
}
