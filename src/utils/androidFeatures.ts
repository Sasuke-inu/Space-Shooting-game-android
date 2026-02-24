// ------------------------------------------------------------------ //
//                    Android-Specific Features
//     Screen awake, immersive mode, back button, notifications
// ------------------------------------------------------------------ //

import { Platform, BackHandler, Alert } from 'react-native'
import { useEffect, useCallback } from 'react'
import * as KeepAwake from 'expo-keep-awake'
import * as NavigationBar from 'expo-navigation-bar'
import * as Notifications from 'expo-notifications'
import { useSettingsStore } from '../theme/themeStore'

// ------------------------------------------------------------------ //
//                         Screen Awake
// ------------------------------------------------------------------ //

/**
 * Keep the screen awake during gameplay (Android & iOS)
 */
export const activateKeepAwake = async () => {
  const keepScreenAwake = useSettingsStore.getState().keepScreenAwake
  if (keepScreenAwake) {
    await KeepAwake.activateKeepAwakeAsync('gameplay')
  }
}

export const deactivateKeepAwake = async () => {
  await KeepAwake.deactivateKeepAwake('gameplay')
}

/**
 * Hook to manage screen awake state during gameplay
 */
export const useKeepAwake = (isPlaying: boolean) => {
  useEffect(() => {
    if (isPlaying) {
      activateKeepAwake()
    } else {
      deactivateKeepAwake()
    }

    return () => {
      deactivateKeepAwake()
    }
  }, [isPlaying])
}

// ------------------------------------------------------------------ //
//                       Immersive Mode (Android)
// ------------------------------------------------------------------ //

/**
 * Enable immersive mode - hides navigation bar
 */
export const enableImmersiveMode = async () => {
  if (Platform.OS !== 'android') return

  const immersiveMode = useSettingsStore.getState().immersiveMode
  if (!immersiveMode) return

  try {
    await NavigationBar.setVisibilityAsync('hidden')
    await NavigationBar.setBehaviorAsync('overlay-swipe')
  } catch (error) {
    // Silently fail - immersive mode is non-critical
  }
}

/**
 * Disable immersive mode - shows navigation bar
 */
export const disableImmersiveMode = async () => {
  if (Platform.OS !== 'android') return

  try {
    await NavigationBar.setVisibilityAsync('visible')
  } catch (error) {
    // Silently fail
  }
}

/**
 * Set navigation bar color to match theme
 */
export const setNavigationBarColor = async (color: string) => {
  if (Platform.OS !== 'android') return

  try {
    // Use setPositionAsync for edge-to-edge compatible styling
    // setBackgroundColorAsync is not supported with edge-to-edge enabled
    await NavigationBar.setButtonStyleAsync('light')
  } catch (error) {
    // Silently fail
  }
}

/**
 * Hook to manage immersive mode during gameplay
 */
export const useImmersiveMode = (isPlaying: boolean) => {
  useEffect(() => {
    if (Platform.OS !== 'android') return

    if (isPlaying) {
      enableImmersiveMode()
    } else {
      disableImmersiveMode()
    }

    return () => {
      disableImmersiveMode()
    }
  }, [isPlaying])
}

// ------------------------------------------------------------------ //
//                    Back Button Handler (Android)
// ------------------------------------------------------------------ //

interface BackHandlerOptions {
  onBackPress?: () => boolean
  exitConfirmation?: boolean
  exitTitle?: string
  exitMessage?: string
  exitYes?: string
  exitNo?: string
}

/**
 * Hook to handle Android back button with confirmation dialog
 */
export const useAndroidBackHandler = (options: BackHandlerOptions = {}) => {
  const {
    onBackPress,
    exitConfirmation = true,
    exitTitle = 'Exit Game',
    exitMessage = 'Are you sure you want to exit?',
    exitYes = 'Yes',
    exitNo = 'No',
  } = options

  const handleBackPress = useCallback(() => {
    if (Platform.OS !== 'android') return false

    // If custom handler provided, use it
    if (onBackPress) {
      return onBackPress()
    }

    // Default: show exit confirmation
    if (exitConfirmation) {
      Alert.alert(exitTitle, exitMessage, [
        { text: exitNo, style: 'cancel' },
        { text: exitYes, onPress: () => BackHandler.exitApp() },
      ])
      return true // Prevent default back action
    }

    return false // Allow default back action
  }, [onBackPress, exitConfirmation, exitTitle, exitMessage, exitYes, exitNo])

  useEffect(() => {
    if (Platform.OS !== 'android') return

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress)

    return () => subscription.remove()
  }, [handleBackPress])
}

/**
 * Hook for back button during gameplay (pause game instead of exit)
 */
export const useGameBackHandler = (
  isPlaying: boolean,
  isPaused: boolean,
  onPause: () => void,
  onResume: () => void
) => {
  const handleBackPress = useCallback(() => {
    if (!isPlaying) return false

    if (isPaused) {
      // If already paused, show exit confirmation
      Alert.alert('Exit Game', 'Do you want to exit the current game?', [
        { text: 'Resume', onPress: onResume, style: 'cancel' },
        { text: 'Exit', onPress: () => BackHandler.exitApp(), style: 'destructive' },
      ])
    } else {
      // Pause the game
      onPause()
    }
    return true
  }, [isPlaying, isPaused, onPause, onResume])

  useEffect(() => {
    if (Platform.OS !== 'android') return

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress)

    return () => subscription.remove()
  }, [handleBackPress])
}

// ------------------------------------------------------------------ //
//                    Push Notifications (Android)
// ------------------------------------------------------------------ //

/**
 * Configure notification handler
 */
export const configureNotifications = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })
}

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync()

  if (existingStatus === 'granted') return true

  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

/**
 * Schedule a daily challenge reminder notification
 */
export const scheduleDailyChallengeReminder = async (hour: number = 9, minute: number = 0) => {
  // Cancel existing reminders first
  await cancelDailyChallengeReminder()

  const hasPermission = await requestNotificationPermissions()
  if (!hasPermission) return null

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚀 Daily Challenge Available!',
        body: 'Complete today\'s challenge to earn bonus credits!',
        data: { type: 'daily_challenge' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    })
    return identifier
  } catch (error) {
    console.warn('Failed to schedule notification:', error)
    return null
  }
}

/**
 * Cancel daily challenge reminder
 */
export const cancelDailyChallengeReminder = async () => {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync()

  for (const notification of scheduledNotifications) {
    if (notification.content.data?.type === 'daily_challenge') {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier)
    }
  }
}

/**
 * Send an immediate achievement notification
 */
export const sendAchievementNotification = async (achievementName: string) => {
  const hasPermission = await requestNotificationPermissions()
  if (!hasPermission) return

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🏆 Achievement Unlocked!',
      body: `You earned: ${achievementName}`,
      data: { type: 'achievement' },
      sound: true,
    },
    trigger: null, // Send immediately
  })
}

/**
 * Send a high score notification
 */
export const sendHighScoreNotification = async (score: number) => {
  const hasPermission = await requestNotificationPermissions()
  if (!hasPermission) return

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎮 New High Score!',
      body: `Congratulations! You scored ${score.toLocaleString()} points!`,
      data: { type: 'high_score', score },
      sound: true,
    },
    trigger: null,
  })
}

// ------------------------------------------------------------------ //
//                    Combined Android Features Hook
// ------------------------------------------------------------------ //

/**
 * Master hook that activates all Android features during gameplay
 */
export const useAndroidGameFeatures = (
  isPlaying: boolean,
  isPaused: boolean,
  onPause: () => void,
  onResume: () => void,
  themeBackgroundColor: string = '#000000'
) => {
  // Keep screen awake during gameplay
  useKeepAwake(isPlaying)

  // Enable immersive mode during gameplay
  useImmersiveMode(isPlaying)

  // Handle back button
  useGameBackHandler(isPlaying, isPaused, onPause, onResume)

  // Set navigation bar color on mount
  useEffect(() => {
    if (Platform.OS === 'android') {
      setNavigationBarColor(themeBackgroundColor)
    }
  }, [themeBackgroundColor])
}

// Initialize notifications on app start
export const initializeAndroidFeatures = () => {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    configureNotifications()
  }
}
