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
      <View
        className="mt-2"
        accessible={false}
      >
        <View
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: theme.colors.panelBorder }}
          accessible={false}
        >
          <View
            className="h-full rounded-full"
            style={{
              width: `${percentage}%`,
              backgroundColor: completed ? theme.colors.hudAccent : theme.colors.buttonPrimary,
            }}
            accessible={false}
          />
        </View>
        <Text
          className="text-xs mt-1"
          style={{ color: theme.colors.textMuted }}
          accessible={false}
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
      accessible={true}
      accessibilityLabel={t('challenges.title')}
      accessibilityRole="none"
    >
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        accessible={false}
      >
        <View
          className="w-11/12 max-h-5/6 rounded-2xl overflow-hidden"
          style={{
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.panelBorder,
            borderWidth: 2,
          }}
          accessible={false}
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
          <ScrollView
            className="flex-1 px-6 py-4"
            accessible={false}
          >
            {challenges.length === 0 ? (
              <View
                className="flex-1 justify-center items-center py-12"
                accessible={true}
                accessibilityLabel={t('challenges.noActiveChallenges')}
                accessibilityRole="text"
              >
                <Text
                  className="text-base text-center"
                  style={{ color: theme.colors.textMuted }}
                  accessible={false}
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
                  accessible={true}
                  accessibilityLabel={`${challenge.name}. ${challenge.description}. Progress: ${challenge.progress} out of ${challenge.target}. Reward: ${challenge.reward} credits. ${challenge.completed ? 'Completed' : 'In progress'}`}
                  accessibilityRole="summary"
                  accessibilityState={{ disabled: challenge.completed }}
                  accessibilityValue={{
                    min: 0,
                    max: challenge.target,
                    now: challenge.progress,
                  }}
                >
                  {/* Challenge Header */}
                  <View
                    className="flex-row items-start justify-between mb-2"
                    accessible={false}
                  >
                    <View
                      className="flex-row items-center flex-1"
                      accessible={false}
                    >
                      <Text
                        className="text-2xl mr-2"
                        accessible={false}
                      >
                        {challenge.icon}
                      </Text>
                      <View
                        className="flex-1"
                        accessible={false}
                      >
                        <Text
                          className="text-base font-semibold"
                          style={{ color: theme.colors.textPrimary }}
                          accessible={false}
                        >
                          {challenge.name}
                        </Text>
                        <Text
                          className="text-sm"
                          style={{ color: theme.colors.textSecondary }}
                          accessible={false}
                        >
                          {challenge.description}
                        </Text>
                      </View>
                    </View>
                    {challenge.completed && (
                      <View
                        className="px-2 py-1 rounded"
                        style={{ backgroundColor: theme.colors.hudAccent }}
                        accessible={false}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: '#fff' }}
                          accessible={false}
                        >
                          ✓ {t('challenges.completed')}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Progress Bar */}
                  {renderProgressBar(challenge.progress, challenge.target, challenge.completed)}

                  {/* Reward */}
                  <View
                    className="flex-row items-center justify-between mt-3"
                    accessible={false}
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: theme.colors.textSecondary }}
                      accessible={false}
                    >
                      {t('challenges.reward')}:
                    </Text>
                    <View
                      className="flex-row items-center"
                      accessible={false}
                    >
                      <Text
                        className="text-base font-bold"
                        style={{ color: theme.colors.buttonPrimary }}
                        accessible={false}
                      >
                        {challenge.reward}
                      </Text>
                      <Text
                        className="text-sm ml-1"
                        style={{ color: theme.colors.textMuted }}
                        accessible={false}
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
            accessible={false}
          >
            <TouchableOpacity
              className="py-3 rounded-lg"
              style={{ backgroundColor: theme.colors.buttonPrimary }}
              onPress={onClose}
              accessible={true}
              accessibilityLabel={t('general.close')}
              accessibilityRole="button"
              accessibilityHint="Closes the challenges modal"
            >
              <Text
                className="text-center text-base font-semibold"
                style={{ color: '#fff' }}
                accessible={false}
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
