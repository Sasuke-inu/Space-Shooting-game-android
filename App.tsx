import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import GameScreen from "./src/screens/GameScreen";
import MenuScreen from "./src/screens/MenuScreen";
import type { GameMode } from "./src/types/game";

type Screen = "menu" | "game";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("menu");

  const handleStartGame = (mode: GameMode) => {
    setCurrentScreen("game");
  };

  const handleShowSettings = () => {
    // TODO: Navigate to settings screen
  };

  const handleShowHighScores = () => {
    // TODO: Navigate to high scores screen
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {currentScreen === "menu" ? (
          <MenuScreen
            onStartGame={handleStartGame}
            onShowSettings={handleShowSettings}
            onShowHighScores={handleShowHighScores}
          />
        ) : (
          <GameScreen />
        )}
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
