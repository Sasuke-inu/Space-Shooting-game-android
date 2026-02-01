import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainMenuScreen from "../screens/MainMenuScreen";
import GameScreen from "../screens/GameScreen";
import SettingsScreen from "../screens/SettingsScreen";
import HighScoresScreen from "../screens/HighScoresScreen";
import ShipSelectionScreen from "../screens/ShipSelectionScreen";
import AchievementsScreen from "../screens/AchievementsScreen";

export type RootStackParamList = {
  MainMenu: undefined;
  Game: undefined;
  Settings: undefined;
  HighScores: undefined;
  ShipSelection: undefined;
  Achievements: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MainMenu"
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen name="MainMenu" component={MainMenuScreen} />
      <Stack.Screen name="Game" component={GameScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="HighScores" component={HighScoresScreen} />
      <Stack.Screen name="ShipSelection" component={ShipSelectionScreen} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
    </Stack.Navigator>
  );
}
