import React from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGame } from "../src/context/GameContext";
import PlayerInput from "../src/components/PlayerInput";
import PlayerList from "../src/components/PlayerList";
import ActionButton from "../src/components/ActionButton";
import { Colors } from "../constants/Colors";
import { useResponsive } from "../src/hooks/useResponsive";

export default function PlayerRegistration() {
  const { state, dispatch } = useGame();
  const { fs, sh } = useResponsive();

  const handleAddPlayer = (name: string) => {
    dispatch({ type: "ADD_PLAYER", name });
  };

  const handleRemovePlayer = (id: string) => {
    dispatch({ type: "REMOVE_PLAYER", id });
  };

  const handleStartGame = () => {
    dispatch({ type: "START_GAME" });
    router.replace("/game");
  };

  const canStart = state.players.length >= 2;

  return (
    <LinearGradient
      colors={[Colors.background, "#1A0A0A"]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.header, { marginBottom: sh(32) }]}>
            <Text style={[styles.title, { fontSize: fs(40) }]}>
              <Text style={styles.titleSmoke}>SMOKE </Text>
              <Text style={[styles.titleOr, { fontSize: fs(28) }]}>OR </Text>
              <Text style={styles.titleFire}>FIRE</Text>
            </Text>
            <Text style={[styles.subtitle, { fontSize: fs(16) }]}>
              {state.players.length} player{state.players.length !== 1 ? "s" : ""} added
            </Text>
          </View>

          <PlayerInput onAdd={handleAddPlayer} />

          <PlayerList
            players={state.players}
            onRemove={handleRemovePlayer}
          />

          <View style={styles.footer}>
            <ActionButton
              title="Start Game"
              onPress={handleStartGame}
              disabled={!canStart}
            />
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
  title: {
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: 8,
  },
  titleSmoke: {
    color: Colors.white,
  },
  titleOr: {
    color: Colors.textSecondary,
  },
  titleFire: {
    color: Colors.red,
  },
  subtitle: {
    color: Colors.textSecondary,
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
