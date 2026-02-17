import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "../src/context/ThemeContext";
import { SettingsProvider } from "../src/context/SettingsContext";
import { GameProvider } from "../src/context/GameContext";
import { MultiplayerProvider } from "../src/context/MultiplayerContext";
import { RemoteGameProvider } from "../src/context/RemoteGameContext";
import { AdProvider } from "../src/context/AdContext";

function AppContent() {
  const { colors } = useTheme();

  return (
    <>
      <StatusBar style={colors.statusBarStyle} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AdProvider>
          <MultiplayerProvider>
            <GameProvider>
              <RemoteGameProvider>
                <AppContent />
              </RemoteGameProvider>
            </GameProvider>
          </MultiplayerProvider>
        </AdProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
