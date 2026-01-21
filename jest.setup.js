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
          playAsync: jest.fn(),
          unloadAsync: jest.fn(),
          setVolumeAsync: jest.fn()
        }
      })
    },
    setAudioModeAsync: jest.fn()
  }
}));

// Mock react-native-reanimated
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper");
