// Jest setup file for React Native / Expo

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mock expo-haptics
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Heavy: "heavy"
  },
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error"
  }
}));

// Mock expo-av for audio
jest.mock("expo-av", () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn().mockResolvedValue(undefined),
          replayAsync: jest.fn().mockResolvedValue(undefined),
          unloadAsync: jest.fn().mockResolvedValue(undefined),
          setVolumeAsync: jest.fn().mockResolvedValue(undefined)
        }
      })
    },
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined)
  }
}));

// Mock react-native-reanimated
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Silence the warning: Animated: `useNativeDriver` is not supported
// Note: Commenting out as this module path doesn't exist in current React Native version
// jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper");
