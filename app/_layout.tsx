import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GameProvider } from "../src/context/GameContext";
import { Colors } from "../constants/Colors";

export default function RootLayout() {
  return (
    <GameProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: "slide_from_right",
        }}
      />
    </GameProvider>
  );
}
