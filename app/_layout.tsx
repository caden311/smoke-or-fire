import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ThemeProvider, useTheme } from "../src/context/ThemeContext";
import { SettingsProvider } from "../src/context/SettingsContext";
import { GameProvider } from "../src/context/GameContext";
import { MultiplayerProvider } from "../src/context/MultiplayerContext";
import { RemoteGameProvider } from "../src/context/RemoteGameContext";
import { AdProvider } from "../src/context/AdContext";

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { colors } = useTheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

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
