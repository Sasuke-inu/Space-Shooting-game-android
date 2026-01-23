import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useI18nStore, SUPPORTED_LANGUAGES, LanguageCode } from '../i18n';
import { useAppSettingsStore, JoystickSize } from '../state/settingsStore';
import { useSettingsStore, useTheme, themeList, HapticIntensity } from '../theme';
import { useStatisticsStore, useAchievementStore, useUpgradesStore } from '../state/progressStore';
import { ThemeId } from '../theme/types';
import { scheduleDailyChallengeReminder, cancelDailyChallengeReminder } from '../utils/androidFeatures';

type TabType = 'general' | 'controls' | 'account';
type SettingsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<SettingsNavigationProp>();
  const { t, currentLanguage, setLanguage } = useI18nStore();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [sizeModalVisible, setSizeModalVisible] = useState(false);
  const [qualityModalVisible, setQualityModalVisible] = useState(false);

  // Settings from different stores
  const {
    joystickSize,
    invertY,
    qualityLevel,
    setJoystickSize,
    setInvertY,
    setQualityLevel,
    resetAppSettings,
  } = useAppSettingsStore();

  const {
    themeId,
    musicVolume,
    sfxVolume,
    joystickSensitivity,
    autoFire,
    hapticsEnabled,
    // Android-specific
    hapticIntensity,
    keepScreenAwake,
    immersiveMode,
    setTheme,
    setMusicVolume,
    setSfxVolume,
    setJoystickSensitivity,
    setAutoFire,
    setHapticsEnabled,
    // Android-specific setters
    setHapticIntensity,
    setKeepScreenAwake,
    setImmersiveMode,
    resetSettings: resetThemeSettings,
  } = useSettingsStore();

  // Android notification state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const { stats, resetStats } = useStatisticsStore();
  const { achievements } = useAchievementStore((s) => ({ achievements: s.achievements }));
  const { credits, resetUpgrades } = useUpgradesStore();
  const {
    isThemeUnlocked,
    getUnlockDescription,
    purchaseTheme,
  } = useThemeUnlockStore();

  const handleResetProgress = () => {
    Alert.alert(
      t('general.confirm'),
      t('settings.resetProgressConfirm'),
      [
        { text: t('general.cancel'), style: 'cancel' },
        {
          text: t('general.confirm'),
          style: 'destructive',
          onPress: () => {
            resetStats();
            resetUpgrades();
            Alert.alert('Success', 'Progress has been reset');
          },
        },
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      t('general.confirm'),
      t('settings.resetSettingsConfirm'),
      [
        { text: t('general.cancel'), style: 'cancel' },
        {
          text: t('general.confirm'),
          style: 'destructive',
          onPress: () => {
            resetThemeSettings();
            resetAppSettings();
            Alert.alert('Success', 'Settings have been reset');
          },
        },
      ]
    );
  };

  const handleThemeSelect = (selectedThemeId: ThemeId) => {
    const unlocked = isThemeUnlocked(selectedThemeId);

    if (unlocked) {
      setTheme(selectedThemeId);
      setThemeModalVisible(false);
    } else {
      // Check if it's a purchasable theme
      const unlockDesc = getUnlockDescription(selectedThemeId);
      if (unlockDesc.includes('Purchase')) {
        // Extract cost from description
        const costMatch = unlockDesc.match(/(\d+)/);
        const cost = costMatch ? parseInt(costMatch[0]) : 0;

        Alert.alert(
          'Theme Locked',
          `${unlockDesc}\n\nYour credits: ${credits}`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Purchase',
              style: 'default',
              onPress: () => {
                if (credits >= cost) {
                  const success = purchaseTheme(selectedThemeId);
                  if (success) {
                    setTheme(selectedThemeId);
                    setThemeModalVisible(false);
                    Alert.alert('Success!', 'Theme unlocked and applied!');
                  } else {
                    Alert.alert('Error', 'Failed to purchase theme');
                  }
                } else {
                  Alert.alert('Insufficient Credits', `You need ${cost - credits} more credits`);
                }
              },
            },
          ]
        );
      } else {
        // Show unlock requirement
        Alert.alert('Theme Locked', unlockDesc);
      }
    }
  };

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
          {t('settings.title')}
        </Text>
      </View>

      {/* Tabs */}
      <View
        className="flex-row border-b"
        style={{ borderBottomColor: theme.colors.panelBorder }}
      >
        {(['general', 'controls', 'account'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            className="flex-1 py-4"
            style={{
              backgroundColor:
                activeTab === tab ? theme.colors.panelBg : 'transparent',
              borderBottomWidth: activeTab === tab ? 2 : 0,
              borderBottomColor: theme.colors.buttonPrimary,
            }}
            onPress={() => {
              playSfx('button_click');
              setActiveTab(tab);
            }}
          >
            <Text
              className="text-center text-base font-semibold capitalize"
              style={{
                color:
                  activeTab === tab
                    ? theme.colors.textPrimary
                    : theme.colors.textMuted,
              }}
            >
              {t(`settings.${tab}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {/* General Tab */}
        {activeTab === 'general' && (
          <View>
            {/* Language Selector */}
            <View className="mb-6">
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: theme.colors.textSecondary }}
              >
                {t('settings.language')}
              </Text>
              <TouchableOpacity
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: theme.colors.panelBg,
                  borderColor: theme.colors.panelBorder,
                }}
                onPress={() => {
                  playSfx('button_click');
                  setLanguageModalVisible(true);
                }}
              >
                <Text style={{ color: theme.colors.textPrimary }}>
                  {SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage)?.flag}{' '}
                  {SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage)?.nativeName}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Theme Selector */}
            <View className="mb-6">
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: theme.colors.textSecondary }}
              >
                {t('settings.theme')}
              </Text>
              <TouchableOpacity
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: theme.colors.panelBg,
                  borderColor: theme.colors.panelBorder,
                }}
                onPress={() => {
                  playSfx('button_click');
                  setThemeModalVisible(true);
                }}
              >
                <Text style={{ color: theme.colors.textPrimary }}>
                  {themeList.find((th) => th.id === themeId)?.icon}{' '}
                  {themeList.find((th) => th.id === themeId)?.name}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quality Settings */}
            <View className="mb-6">
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: theme.colors.textSecondary }}
              >
                Graphics Quality
              </Text>
              <TouchableOpacity
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: theme.colors.panelBg,
                  borderColor: theme.colors.panelBorder,
                }}
                onPress={() => setQualityModalVisible(true)}
              >
                <Text style={{ color: theme.colors.textPrimary }} className="capitalize">
                  {qualityLevel}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sound Effects */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-2">
                <Text
                  className="text-sm font-semibold"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {t('settings.sound')}
                </Text>
                <Text style={{ color: theme.colors.textMuted }}>
                  {Math.round(sfxVolume * 100)}%
                </Text>
              </View>
              <Slider
                value={sfxVolume}
                onValueChange={setSfxVolume}
                minimumValue={0}
                maximumValue={1}
                step={0.1}
                minimumTrackTintColor={theme.colors.buttonPrimary}
                maximumTrackTintColor={theme.colors.panelBorder}
                thumbTintColor={theme.colors.buttonPrimary}
              />
            </View>

            {/* Music */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-2">
                <Text
                  className="text-sm font-semibold"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {t('settings.music')}
                </Text>
                <Text style={{ color: theme.colors.textMuted }}>
                  {Math.round(musicVolume * 100)}%
                </Text>
              </View>
              <Slider
                value={musicVolume}
                onValueChange={setMusicVolume}
                minimumValue={0}
                maximumValue={1}
                step={0.1}
                minimumTrackTintColor={theme.colors.buttonPrimary}
                maximumTrackTintColor={theme.colors.panelBorder}
                thumbTintColor={theme.colors.buttonPrimary}
              />
            </View>

            {/* Vibration */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center p-4 rounded-lg border"
                style={{
                  backgroundColor: theme.colors.panelBg,
                  borderColor: theme.colors.panelBorder,
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {t('settings.vibration')}
                </Text>
                <Switch
                  value={hapticsEnabled}
                  onValueChange={(value) => {
                    playSfx(value ? 'toggle_on' : 'toggle_off');
                    setHapticsEnabled(value);
                  }}
                  trackColor={{
                    false: theme.colors.panelBorder,
                    true: theme.colors.buttonPrimary,
                  }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>

            {/* Android-Specific Settings */}
            {Platform.OS === 'android' && (
              <View className="mt-6">
                <Text
                  className="text-lg font-bold mb-4"
                  style={{ color: theme.colors.textPrimary }}
                >
                  Android Settings
                </Text>

                {/* Haptic Intensity */}
                {hapticsEnabled && (
                  <View className="mb-4">
                    <Text
                      className="text-sm font-semibold mb-2"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      Vibration Intensity
                    </Text>
                    <View className="flex-row">
                      {(['light', 'medium', 'strong'] as HapticIntensity[]).map((intensity) => (
                        <TouchableOpacity
                          key={intensity}
                          className="flex-1 py-3 mx-1 rounded-lg border"
                          style={{
                            backgroundColor: hapticIntensity === intensity
                              ? theme.colors.buttonPrimary
                              : theme.colors.panelBg,
                            borderColor: theme.colors.panelBorder,
                          }}
                          onPress={() => setHapticIntensity(intensity)}
                        >
                          <Text
                            className="text-center text-sm font-semibold capitalize"
                            style={{
                              color: hapticIntensity === intensity
                                ? '#ffffff'
                                : theme.colors.textSecondary,
                            }}
                          >
                            {intensity}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Keep Screen Awake */}
                <View
                  className="flex-row justify-between items-center p-4 rounded-lg border mb-4"
                  style={{
                    backgroundColor: theme.colors.panelBg,
                    borderColor: theme.colors.panelBorder,
                  }}
                >
                  <View className="flex-1 mr-4">
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      Keep Screen Awake
                    </Text>
                    <Text
                      className="text-xs mt-1"
                      style={{ color: theme.colors.textMuted }}
                    >
                      Prevent screen from sleeping during gameplay
                    </Text>
                  </View>
                  <Switch
                    value={keepScreenAwake}
                    onValueChange={setKeepScreenAwake}
                    trackColor={{
                      false: theme.colors.panelBorder,
                      true: theme.colors.buttonPrimary,
                    }}
                    thumbColor="#ffffff"
                  />
                </View>

                {/* Immersive Mode */}
                <View
                  className="flex-row justify-between items-center p-4 rounded-lg border mb-4"
                  style={{
                    backgroundColor: theme.colors.panelBg,
                    borderColor: theme.colors.panelBorder,
                  }}
                >
                  <View className="flex-1 mr-4">
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      Immersive Mode
                    </Text>
                    <Text
                      className="text-xs mt-1"
                      style={{ color: theme.colors.textMuted }}
                    >
                      Hide navigation bar during gameplay
                    </Text>
                  </View>
                  <Switch
                    value={immersiveMode}
                    onValueChange={setImmersiveMode}
                    trackColor={{
                      false: theme.colors.panelBorder,
                      true: theme.colors.buttonPrimary,
                    }}
                    thumbColor="#ffffff"
                  />
                </View>

                {/* Daily Reminder Notifications */}
                <View
                  className="flex-row justify-between items-center p-4 rounded-lg border"
                  style={{
                    backgroundColor: theme.colors.panelBg,
                    borderColor: theme.colors.panelBorder,
                  }}
                >
                  <View className="flex-1 mr-4">
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      Daily Challenge Reminder
                    </Text>
                    <Text
                      className="text-xs mt-1"
                      style={{ color: theme.colors.textMuted }}
                    >
                      Get notified at 9 AM daily
                    </Text>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={async (enabled) => {
                      setNotificationsEnabled(enabled);
                      if (enabled) {
                        await scheduleDailyChallengeReminder(9, 0);
                      } else {
                        await cancelDailyChallengeReminder();
                      }
                    }}
                    trackColor={{
                      false: theme.colors.panelBorder,
                      true: theme.colors.buttonPrimary,
                    }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* Controls Tab */}
        {activeTab === 'controls' && (
          <View>
            {/* Joystick Sensitivity */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-2">
                <Text
                  className="text-sm font-semibold"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {t('settings.sensitivity')}
                </Text>
                <Text style={{ color: theme.colors.textMuted }}>
                  {joystickSensitivity.toFixed(1)}x
                </Text>
              </View>
              <Slider
                value={joystickSensitivity}
                onValueChange={setJoystickSensitivity}
                minimumValue={0.5}
                maximumValue={2.0}
                step={0.1}
                minimumTrackTintColor={theme.colors.buttonPrimary}
                maximumTrackTintColor={theme.colors.panelBorder}
                thumbTintColor={theme.colors.buttonPrimary}
              />
            </View>

            {/* Joystick Size */}
            <View className="mb-6">
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: theme.colors.textSecondary }}
              >
                {t('settings.joystickSize')}
              </Text>
              <TouchableOpacity
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: theme.colors.panelBg,
                  borderColor: theme.colors.panelBorder,
                }}
                onPress={() => {
                  playSfx('button_click');
                  setSizeModalVisible(true);
                }}
              >
                <Text style={{ color: theme.colors.textPrimary }} className="capitalize">
                  {t(`settings.${joystickSize}`)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Auto-Fire */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center p-4 rounded-lg border"
                style={{
                  backgroundColor: theme.colors.panelBg,
                  borderColor: theme.colors.panelBorder,
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {t('settings.autoFire')}
                </Text>
                <Switch
                  value={autoFire}
                  onValueChange={(value) => {
                    playSfx(value ? 'toggle_on' : 'toggle_off');
                    setAutoFire(value);
                  }}
                  trackColor={{
                    false: theme.colors.panelBorder,
                    true: theme.colors.buttonPrimary,
                  }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>

            {/* Invert Y-Axis */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center p-4 rounded-lg border"
                style={{
                  backgroundColor: theme.colors.panelBg,
                  borderColor: theme.colors.panelBorder,
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {t('settings.invertY')}
                </Text>
                <Switch
                  value={invertY}
                  onValueChange={(value) => {
                    playSfx(value ? 'toggle_on' : 'toggle_off');
                    setInvertY(value);
                  }}
                  trackColor={{
                    false: theme.colors.panelBorder,
                    true: theme.colors.buttonPrimary,
                  }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>
          </View>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <View>
            {/* Stats Summary */}
            <View className="mb-6">
              <Text
                className="text-lg font-bold mb-4"
                style={{ color: theme.colors.textPrimary }}
              >
                Player Statistics
              </Text>

              <View className="space-y-3">
                <StatRow
                  label={t('stats.gamesPlayed')}
                  value={stats.totalGames.toString()}
                  theme={theme}
                />
                <StatRow
                  label={t('stats.highScore')}
                  value={stats.highestScore.toLocaleString()}
                  theme={theme}
                />
                <StatRow
                  label={t('stats.totalKills')}
                  value={stats.totalKills.toLocaleString()}
                  theme={theme}
                />
                <StatRow
                  label={t('stats.accuracy')}
                  value={calculateAccuracy()}
                  theme={theme}
                />
                <StatRow
                  label={t('stats.highestWave')}
                  value={stats.highestWave.toString()}
                  theme={theme}
                />
                <StatRow
                  label={t('stats.totalPlayTime')}
                  value={formatTime(stats.totalTimePlayed)}
                  theme={theme}
                />
                <StatRow
                  label="Achievements"
                  value={`${unlockedCount}/${totalAchievements}`}
                  theme={theme}
                />
              </View>
            </View>

            {/* Reset Buttons */}
            <View className="mb-6">
              <TouchableOpacity
                className="p-4 rounded-lg border mb-3"
                style={{
                  backgroundColor: theme.colors.panelBg,
                  borderColor: theme.colors.panelBorder,
                }}
                onPress={() => {
                  playSfx('button_click');
                  handleResetSettings();
                }}
              >
                <Text
                  className="text-center font-semibold"
                  style={{ color: theme.colors.textPrimary }}
                >
                  {t('settings.resetSettings')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: theme.colors.panelBg,
                  borderColor: '#ff4444',
                }}
                onPress={() => {
                  playSfx('button_click');
                  handleResetProgress();
                }}
              >
                <Text
                  className="text-center font-semibold"
                  style={{ color: '#ff4444' }}
                >
                  {t('settings.resetProgress')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Language Modal */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: theme.colors.modalOverlay }}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <View
            className="w-4/5 rounded-lg p-4"
            style={{
              backgroundColor: theme.colors.panelBg,
              borderColor: theme.colors.panelBorder,
              borderWidth: 1,
            }}
            onStartShouldSetResponder={() => true}
          >
            <Text
              className="text-xl font-bold mb-4 text-center"
              style={{ color: theme.colors.textPrimary }}
            >
              {t('settings.language')}
            </Text>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                className="p-4 rounded-lg mb-2 border"
                style={{
                  backgroundColor:
                    currentLanguage === lang.code
                      ? theme.colors.buttonPrimary + '20'
                      : theme.colors.background,
                  borderColor:
                    currentLanguage === lang.code
                      ? theme.colors.buttonPrimary
                      : theme.colors.panelBorder,
                }}
                onPress={() => {
                  playSfx('button_click');
                  setLanguage(lang.code);
                  setLanguageModalVisible(false);
                }}
              >
                <Text style={{ color: theme.colors.textPrimary }}>
                  {lang.flag} {lang.nativeName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Theme Modal */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: theme.colors.modalOverlay }}
          activeOpacity={1}
          onPress={() => setThemeModalVisible(false)}
        >
          <View
            className="w-4/5 rounded-lg p-4 max-h-4/5"
            style={{
              backgroundColor: theme.colors.panelBg,
              borderColor: theme.colors.panelBorder,
              borderWidth: 1,
            }}
            onStartShouldSetResponder={() => true}
          >
            <Text
              className="text-xl font-bold mb-4 text-center"
              style={{ color: theme.colors.textPrimary }}
            >
              {t('settings.theme')}
            </Text>
            <ScrollView className="max-h-96">
              {themeList.map((th) => {
                const unlocked = isThemeUnlocked(th.id as ThemeId);
                const unlockDesc = getUnlockDescription(th.id as ThemeId);

                return (
                  <TouchableOpacity
                    key={th.id}
                    className="p-4 rounded-lg mb-2 border"
                    style={{
                      backgroundColor:
                        themeId === th.id
                          ? theme.colors.buttonPrimary + '20'
                          : theme.colors.background,
                      borderColor:
                        themeId === th.id
                          ? theme.colors.buttonPrimary
                          : theme.colors.panelBorder,
                      opacity: unlocked ? 1 : 0.6,
                    }}
                    onPress={() => handleThemeSelect(th.id as ThemeId)}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text style={{ color: theme.colors.textPrimary }}>
                          {unlocked ? th.icon : '🔒'} {th.name}
                        </Text>
                        <Text
                          className="text-xs mt-1"
                          style={{ color: theme.colors.textMuted }}
                        >
                          {th.description}
                        </Text>
                        {!unlocked && (
                          <Text
                            className="text-xs mt-1 italic"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            {unlockDesc}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Joystick Size Modal */}
      <Modal
        visible={sizeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSizeModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: theme.colors.modalOverlay }}
          activeOpacity={1}
          onPress={() => setSizeModalVisible(false)}
        >
          <View
            className="w-4/5 rounded-lg p-4"
            style={{
              backgroundColor: theme.colors.panelBg,
              borderColor: theme.colors.panelBorder,
              borderWidth: 1,
            }}
            onStartShouldSetResponder={() => true}
          >
            <Text
              className="text-xl font-bold mb-4 text-center"
              style={{ color: theme.colors.textPrimary }}
            >
              {t('settings.joystickSize')}
            </Text>
            {(['small', 'medium', 'large'] as JoystickSize[]).map((size) => (
              <TouchableOpacity
                key={size}
                className="p-4 rounded-lg mb-2 border"
                style={{
                  backgroundColor:
                    joystickSize === size
                      ? theme.colors.buttonPrimary + '20'
                      : theme.colors.background,
                  borderColor:
                    joystickSize === size
                      ? theme.colors.buttonPrimary
                      : theme.colors.panelBorder,
                }}
                onPress={() => {
                  playSfx('button_click');
                  setJoystickSize(size);
                  setSizeModalVisible(false);
                }}
              >
                <Text style={{ color: theme.colors.textPrimary }} className="capitalize">
                  {t(`settings.${size}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Quality Modal */}
      <Modal
        visible={qualityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQualityModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: theme.colors.modalOverlay }}
          activeOpacity={1}
          onPress={() => setQualityModalVisible(false)}
        >
          <View
            className="w-4/5 rounded-lg p-4"
            style={{
              backgroundColor: theme.colors.panelBg,
              borderColor: theme.colors.panelBorder,
              borderWidth: 1,
            }}
            onStartShouldSetResponder={() => true}
          >
            <Text
              className="text-xl font-bold mb-4 text-center"
              style={{ color: theme.colors.textPrimary }}
            >
              Graphics Quality
            </Text>
            {(['low', 'medium', 'high'] as QualityLevel[]).map((quality) => (
              <TouchableOpacity
                key={quality}
                className="p-4 rounded-lg mb-2 border"
                style={{
                  backgroundColor:
                    qualityLevel === quality
                      ? theme.colors.buttonPrimary + '20'
                      : theme.colors.background,
                  borderColor:
                    qualityLevel === quality
                      ? theme.colors.buttonPrimary
                      : theme.colors.panelBorder,
                }}
                onPress={() => {
                  setQualityLevel(quality);
                  setQualityModalVisible(false);
                }}
              >
                <Text style={{ color: theme.colors.textPrimary }} className="capitalize">
                  {quality}
                </Text>
                <Text
                  className="text-xs mt-1"
                  style={{ color: theme.colors.textMuted }}
                >
                  {quality === 'low' && 'Reduced particles and effects for better performance'}
                  {quality === 'medium' && 'Balanced visuals and performance'}
                  {quality === 'high' && 'Full visual effects with maximum particles'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// Helper component for stat rows
function StatRow({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: any;
}) {
  return (
    <View className="flex-row justify-between items-center p-3 rounded-lg"
      style={{
        backgroundColor: theme.colors.panelBg,
        borderColor: theme.colors.panelBorder,
        borderWidth: 1,
      }}
    >
      <Text style={{ color: theme.colors.textSecondary }}>{label}</Text>
      <Text
        className="font-semibold"
        style={{ color: theme.colors.textPrimary }}
      >
        {value}
      </Text>
    </View>
  );
}
