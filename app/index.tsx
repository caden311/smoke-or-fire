import React, { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGame } from "../src/context/GameContext";
import { useMultiplayer } from "../src/context/MultiplayerContext";
import { useSettings } from "../src/context/SettingsContext";
import { useTheme } from "../src/context/ThemeContext";
import PlayerInput from "../src/components/PlayerInput";
import PlayerList from "../src/components/PlayerList";
import ActionButton from "../src/components/ActionButton";
import { useResponsive } from "../src/hooks/useResponsive";

export default function PlayerRegistration() {
  const { state, dispatch } = useGame();
  const { isFirebaseReady, hostGame } = useMultiplayer();
  const { settings } = useSettings();
  const { colors } = useTheme();
  const { fs, sh, sw } = useResponsive();
  const [isHosting, setIsHosting] = useState(false);

  const handleAddPlayer = (name: string) => {
    dispatch({ type: "ADD_PLAYER", name });
  };

  const handleRemovePlayer = (id: string) => {
    dispatch({ type: "REMOVE_PLAYER", id });
  };

  const handleStartGame = () => {
    dispatch({ type: "START_GAME", settings });
    router.replace("/game");
  };

  const handleOpenSettings = () => {
    router.replace("/settings");
  };

  const handleHostGame = async () => {
    const name = state.players[0]?.name || "Host";
    setIsHosting(true);
    try {
      await hostGame(name);
      router.replace("/host");
    } catch (error) {
      setIsHosting(false);
    }
  };

  const handleJoinGame = () => {
    router.replace("/join");
  };

  const canStart = state.players.length >= 2;

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundGradientEnd]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.header, { marginBottom: sh(32) }]}>
            <Text style={[styles.title, { fontSize: fs(40) }]}>
              <Text style={[styles.titleSmoke, { color: colors.textPrimary }]}>SMOKE </Text>
              <Text style={[styles.titleOr, { fontSize: fs(28), color: colors.textSecondary }]}>OR </Text>
              <Text style={[styles.titleFire, { color: colors.fire }]}>FIRE</Text>
            </Text>
            <Text style={[styles.subtitle, { fontSize: fs(16), color: colors.textSecondary }]}>
              {state.players.length} player{state.players.length !== 1 ? "s" : ""} added
            </Text>
          </View>

          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <PlayerInput onAdd={handleAddPlayer} />
            </View>
            <Pressable
              onPress={handleOpenSettings}
              style={[styles.settingsButton, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.settingsIcon, { fontSize: fs(24), color: colors.textSecondary }]}>&#9881;</Text>
            </Pressable>
          </View>

          <PlayerList
            players={state.players}
            onRemove={handleRemovePlayer}
          />

          <View style={styles.footer}>
            <ActionButton
              title="Start Local Game"
              onPress={handleStartGame}
              disabled={!canStart}
            />

            {isFirebaseReady && (
              <View style={[styles.multiplayerSection, { marginTop: sh(24) }]}>
                <View style={styles.dividerRow}>
                  <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                  <Text style={[styles.dividerText, { fontSize: fs(12), color: colors.textMuted }]}>
                    OR PLAY ONLINE
                  </Text>
                  <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                </View>

                <View style={[styles.multiplayerButtons, { gap: sw(12), marginTop: sh(16) }]}>
                  <ActionButton
                    title="Host Game"
                    variant="success"
                    onPress={handleHostGame}
                    disabled={isHosting || state.players.length === 0}
                    style={{ flex: 1 }}
                    textStyle={{ textAlign: "center" }}
                  />
                  <ActionButton
                    title="Join Game"
                    variant="ghost"
                    onPress={handleJoinGame}
                    style={{ flex: 1 }}
                    textStyle={{ textAlign: "center" }}
                  />
                </View>
                {state.players.length === 0 && (
                  <Text style={[styles.hostHint, { fontSize: fs(11), marginTop: sh(8), color: colors.textMuted }]}>
                    Add your name above to host a game
                  </Text>
                )}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    alignItems: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  settingsButton: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  settingsIcon: {},
  title: {
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: 8,
  },
  titleSmoke: {},
  titleOr: {},
  titleFire: {},
  subtitle: {},
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  multiplayerSection: {
    width: "100%",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontWeight: "600",
    letterSpacing: 1,
  },
  multiplayerButtons: {
    flexDirection: "row",
  },
  hostHint: {
    textAlign: "center",
  },
});
