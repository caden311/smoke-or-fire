import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SettingsProvider } from "../src/context/SettingsContext";
import { GameProvider } from "../src/context/GameContext";
import { MultiplayerProvider } from "../src/context/MultiplayerContext";
import { RemoteGameProvider } from "../src/context/RemoteGameContext";
import { Colors } from "../constants/Colors";

export default function RootLayout() {
  return (
    <SettingsProvider>
      <MultiplayerProvider>
        <GameProvider>
          <RemoteGameProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
                animation: "slide_from_right",
              }}
            />
          </RemoteGameProvider>
        </GameProvider>
      </MultiplayerProvider>
    </SettingsProvider>
  );
}
