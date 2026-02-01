import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useI18nStore } from '../i18n';
import { useTheme } from '../theme';
import { useWeeklyEventsStore } from '../state/weeklyEventsStore';
import { EVENT_MODIFIERS } from '../types/weeklyEvents';

interface WeeklyEventModalProps {
  visible: boolean;
  onClose: () => void;
  onPlayEvent?: () => void;
  onViewLeaderboard?: () => void;
}

export default function WeeklyEventModal({
  visible,
  onClose,
  onPlayEvent,
  onViewLeaderboard,
}: WeeklyEventModalProps) {
  const theme = useTheme();
  const { t } = useI18nStore();
  const { getCurrentEvent, checkAndRefreshEvent } = useWeeklyEventsStore();
  const [timeRemaining, setTimeRemaining] = useState('');
  const currentEvent = getCurrentEvent();

  // Calculate time remaining until event ends
  useEffect(() => {
    const calculateTimeRemaining = () => {
      if (!currentEvent) return;

      const now = Date.now();
      const diff = currentEvent.endDate - now;

      if (diff <= 0) {
        setTimeRemaining('Event Ended');
        checkAndRefreshEvent();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h remaining`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeRemaining(`${minutes}m remaining`);
      }
    };

    if (visible && currentEvent) {
      calculateTimeRemaining();
      const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [visible, currentEvent, checkAndRefreshEvent]);

  // Refresh event when modal opens
  useEffect(() => {
    if (visible) {
      checkAndRefreshEvent();
    }
  }, [visible, checkAndRefreshEvent]);

  const renderModifier = (modifierType: string) => {
    const modifier = EVENT_MODIFIERS[modifierType as keyof typeof EVENT_MODIFIERS];
    if (!modifier) return null;

    return (
      <View
        key={modifierType}
        className="mb-3 p-3 rounded-lg border"
        style={{
          backgroundColor: theme.colors.panelBg,
          borderColor: theme.colors.panelBorder,
        }}
      >
        <View className="flex-row items-start">
          <Text className="text-2xl mr-3">{modifier.icon}</Text>
          <View className="flex-1">
            <Text
              className="text-base font-semibold mb-1"
              style={{ color: theme.colors.textPrimary }}
            >
              {modifier.name}
            </Text>
            <Text
              className="text-sm"
              style={{ color: theme.colors.textSecondary }}
            >
              {modifier.description}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      >
        <View
          className="w-11/12 max-h-5/6 rounded-2xl overflow-hidden"
          style={{
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.panelBorder,
            borderWidth: 2,
          }}
        >
          {/* Header */}
          <View
            className="py-4 px-6 border-b"
            style={{
              backgroundColor: theme.colors.panelBg,
              borderBottomColor: theme.colors.panelBorder,
            }}
          >
            <Text
              className="text-2xl font-bold text-center mb-2"
              style={{ color: theme.colors.textPrimary }}
            >
              {currentEvent?.name || 'Weekly Event'}
            </Text>
            <Text
              className="text-sm text-center mb-2"
              style={{ color: theme.colors.textSecondary }}
            >
              {currentEvent?.description || 'No active event'}
            </Text>
            <View className="flex-row justify-center items-center">
              <Text
                className="text-sm font-semibold"
                style={{ color: theme.colors.hudAccent }}
              >
                ⏱️ {timeRemaining}
              </Text>
            </View>
          </View>

          {/* Content */}
          <ScrollView className="flex-1 px-6 py-4">
            {!currentEvent ? (
              <View className="flex-1 justify-center items-center py-12">
                <Text
                  className="text-base text-center"
                  style={{ color: theme.colors.textMuted }}
                >
                  No active event. Check back soon!
                </Text>
              </View>
            ) : (
              <>
                {/* Modifiers Section */}
                <View className="mb-4">
                  <Text
                    className="text-lg font-bold mb-3"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    Event Modifiers
                  </Text>
                  {currentEvent.modifiers.map((modifierType) =>
                    renderModifier(modifierType)
                  )}
                </View>

                {/* Rewards Section */}
                <View className="mb-4">
                  <Text
                    className="text-lg font-bold mb-3"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    Rewards
                  </Text>
                  <View
                    className="p-4 rounded-lg"
                    style={{
                      backgroundColor: theme.colors.panelBg,
                      borderColor: theme.colors.panelBorder,
                      borderWidth: 1,
                    }}
                  >
                    <View className="flex-row justify-between mb-2">
                      <Text
                        className="text-sm"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        🏆 1st Place:
                      </Text>
                      <Text
                        className="text-sm font-bold"
                        style={{ color: theme.colors.buttonPrimary }}
                      >
                        {currentEvent.rewards.participation + currentEvent.rewards.rank1} Credits
                      </Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                      <Text
                        className="text-sm"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        🥈 2nd Place:
                      </Text>
                      <Text
                        className="text-sm font-bold"
                        style={{ color: theme.colors.buttonPrimary }}
                      >
                        {currentEvent.rewards.participation + currentEvent.rewards.rank2} Credits
                      </Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                      <Text
                        className="text-sm"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        🥉 3rd Place:
                      </Text>
                      <Text
                        className="text-sm font-bold"
                        style={{ color: theme.colors.buttonPrimary }}
                      >
                        {currentEvent.rewards.participation + currentEvent.rewards.rank3} Credits
                      </Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                      <Text
                        className="text-sm"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        🎖️ Top 10:
                      </Text>
                      <Text
                        className="text-sm font-bold"
                        style={{ color: theme.colors.buttonPrimary }}
                      >
                        {currentEvent.rewards.participation + currentEvent.rewards.top10} Credits
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text
                        className="text-sm"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        🎯 Participation:
                      </Text>
                      <Text
                        className="text-sm font-bold"
                        style={{ color: theme.colors.buttonPrimary }}
                      >
                        {currentEvent.rewards.participation} Credits
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View
            className="px-6 py-4 border-t"
            style={{
              backgroundColor: theme.colors.panelBg,
              borderTopColor: theme.colors.panelBorder,
            }}
          >
            {currentEvent && (
              <>
                {/* Play Event Button */}
                <TouchableOpacity
                  onPress={onPlayEvent}
                  className="mb-3 py-4 rounded-lg"
                  style={{
                    backgroundColor: theme.colors.buttonPrimary,
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    className="text-center text-lg font-bold"
                    style={{ color: '#fff' }}
                  >
                    🎮 Play Event
                  </Text>
                </TouchableOpacity>

                {/* View Leaderboard Button */}
                <TouchableOpacity
                  onPress={onViewLeaderboard}
                  className="mb-3 py-4 rounded-lg border"
                  style={{
                    backgroundColor: theme.colors.panelBg,
                    borderColor: theme.colors.panelBorder,
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    className="text-center text-base font-semibold"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    📊 View Leaderboard
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              className="py-3 rounded-lg"
              style={{
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.panelBorder,
                borderWidth: 1,
              }}
              activeOpacity={0.8}
            >
              <Text
                className="text-center text-base font-semibold"
                style={{ color: theme.colors.textSecondary }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
