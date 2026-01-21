import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect, useState } from "react";
import GameScreen from "./src/screens/GameScreen";
import { migrateStorageToSecureStore } from "./src/utils/migrateStorage";

export default function App() {
  const [migrationComplete, setMigrationComplete] = useState(false);

  useEffect(() => {
    // Run migration on app startup (one-time operation)
    migrateStorageToSecureStore()
      .then(() => {
        console.log('[App] Storage migration complete');
        setMigrationComplete(true);
      })
      .catch((error) => {
        console.error('[App] Migration failed:', error);
        // Still allow app to run even if migration fails
        // User will start with fresh data rather than crashing
        setMigrationComplete(true);
      });
  }, []);

  // Show nothing while migration runs
  // This prevents stores from initializing before migration completes
  if (!migrationComplete) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <GameScreen />
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
