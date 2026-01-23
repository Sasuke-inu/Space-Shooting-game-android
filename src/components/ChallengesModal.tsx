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
import { useChallengesStore } from '../state/challengesStore';

interface ChallengesModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ChallengesModal({ visible, onClose }: ChallengesModalProps) {
  const theme = useTheme();
  const { t } = useI18nStore();
  const { challenges, lastRefresh } = useChallengesStore();
  const [timeUntilRefresh, setTimeUntilRefresh] = useState('');

  // Calculate time until next refresh (midnight)
  useEffect(() => {
    const calculateTimeUntilRefresh = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeUntilRefresh(`${hours}h ${minutes}m`);
    };

    if (visible) {
      calculateTimeUntilRefresh();
      const interval = setInterval(calculateTimeUntilRefresh, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [visible]);

  const renderProgressBar = (progress: number, target: number, completed: boolean) => {
    const percentage = Math.min((progress / target) * 100, 100);

    return (
      <View className="mt-2">
        <View
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: theme.colors.panelBorder }}
        >
          <View
            className="h-full rounded-full"
            style={{
              width: `${percentage}%`,
              backgroundColor: completed ? theme.colors.hudAccent : theme.colors.buttonPrimary,
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
              className="text-2xl font-bold text-center"
              style={{ color: theme.colors.textPrimary }}
            >
              {t('challenges.title')}
            </Text>
            <View className="flex-row justify-between items-center mt-2">
              <Text
                className="text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                {t('challenges.daily')}
              </Text>
              <Text
                className="text-sm"
                style={{ color: theme.colors.textMuted }}
              >
                {t('challenges.refreshIn')}: {timeUntilRefresh}
              </Text>
            </View>
          </View>

          {/* Challenges List */}
          <ScrollView className="flex-1 px-6 py-4">
            {challenges.length === 0 ? (
              <View className="flex-1 justify-center items-center py-12">
                <Text
                  className="text-base text-center"
                  style={{ color: theme.colors.textMuted }}
                >
                  {t('challenges.noActiveChallenges')}
                </Text>
              </View>
            ) : (
              challenges.map((challenge) => (
                <View
                  key={challenge.id}
                  className="mb-4 p-4 rounded-lg border"
                  style={{
                    backgroundColor: challenge.completed
                      ? theme.colors.panelBg + '80'
                      : theme.colors.panelBg,
                    borderColor: challenge.completed
                      ? theme.colors.hudAccent
                      : theme.colors.panelBorder,
                    opacity: challenge.completed ? 0.7 : 1,
                  }}
                >
                  {/* Challenge Header */}
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-row items-center flex-1">
                      <Text className="text-2xl mr-2">{challenge.icon}</Text>
                      <View className="flex-1">
                        <Text
                          className="text-base font-semibold"
                          style={{ color: theme.colors.textPrimary }}
                        >
                          {challenge.name}
                        </Text>
                        <Text
                          className="text-sm"
                          style={{ color: theme.colors.textSecondary }}
                        >
                          {challenge.description}
                        </Text>
                      </View>
                    </View>
                    {challenge.completed && (
                      <View
                        className="px-2 py-1 rounded"
                        style={{ backgroundColor: theme.colors.hudAccent }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: '#fff' }}
                        >
                          ✓ {t('challenges.completed')}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Progress Bar */}
                  {renderProgressBar(challenge.progress, challenge.target, challenge.completed)}

                  {/* Reward */}
                  <View className="flex-row items-center justify-between mt-3">
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {t('challenges.reward')}:
                    </Text>
                    <View className="flex-row items-center">
                      <Text
                        className="text-base font-bold"
                        style={{ color: theme.colors.buttonPrimary }}
                      >
                        {challenge.reward}
                      </Text>
                      <Text
                        className="text-sm ml-1"
                        style={{ color: theme.colors.textMuted }}
                      >
                        credits
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Footer / Close Button */}
          <View
            className="p-4 border-t"
            style={{
              backgroundColor: theme.colors.panelBg,
              borderTopColor: theme.colors.panelBorder,
            }}
          >
            <TouchableOpacity
              className="py-3 rounded-lg"
              style={{ backgroundColor: theme.colors.buttonPrimary }}
              onPress={onClose}
            >
              <Text
                className="text-center text-base font-semibold"
                style={{ color: '#fff' }}
              >
                {t('general.close')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
