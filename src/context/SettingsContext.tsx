import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameSettings, DEFAULT_GAME_SETTINGS } from "../types";

const SETTINGS_KEY = "@smoke_or_fire_settings";

interface SettingsContextValue {
  settings: GameSettings;
  updateSettings: (settings: Partial<GameSettings>) => void;
  resetToDefaults: () => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as GameSettings;
          setSettings(parsed);
        }
      } catch (error) {
        console.log("[SETTINGS] Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Persist settings to AsyncStorage whenever they change
  const persistSettings = useCallback(async (newSettings: GameSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.log("[SETTINGS] Failed to persist settings:", error);
    }
  }, []);

  const updateSettings = useCallback((partial: Partial<GameSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...partial };
      persistSettings(newSettings);
      return newSettings;
    });
  }, [persistSettings]);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_GAME_SETTINGS);
    persistSettings(DEFAULT_GAME_SETTINGS);
  }, [persistSettings]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetToDefaults, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
