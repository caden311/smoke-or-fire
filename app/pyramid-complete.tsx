import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useGame } from "../src/context/GameContext";
import { useMultiplayer } from "../src/context/MultiplayerContext";
import ActionButton from "../src/components/ActionButton";
import { Colors } from "../constants/Colors";
import { useResponsive } from "../src/hooks/useResponsive";

export default function PyramidComplete() {
  const { state, dispatch } = useGame();
  const { isMultiplayer, syncedGameState, leaveGame } = useMultiplayer();
  const { fs, sw, sh } = useResponsive();

  // Use synced state in multiplayer mode
  const effectiveState = isMultiplayer && syncedGameState ? syncedGameState : state;

  // Sync game state from Firebase in multiplayer mode
  useEffect(() => {
    if (isMultiplayer && syncedGameState) {
      dispatch({ type: "SYNC_STATE", state: syncedGameState });
    }
  }, [isMultiplayer, syncedGameState, dispatch]);

  // Compute per-player totals
  const playerTotals = effectiveState.players.map((player) => {
    let gave = 0;
    let took = 0;
    for (const result of effectiveState.pyramidResults) {
      for (const match of result.matches) {
        if (match.player.id === player.id) {
          if (match.action === "give") {
            gave += match.drinks;
          } else {
            took += match.drinks;
          }
        }
      }
    }
    return { player, gave, took };
  });

  const handlePlayAgain = async () => {
    if (isMultiplayer) {
      await leaveGame();
    }
    dispatch({ type: "RESET" });
    router.replace("/");
  };

  return (
    <LinearGradient
      colors={[Colors.background, "#12061F"]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, { paddingHorizontal: sw(24) }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { fontSize: fs(28) }]}>PYRAMID COMPLETE</Text>
          </View>

          {/* Player results */}
          <ScrollView
            style={styles.resultsList}
            showsVerticalScrollIndicator={false}
          >
            {playerTotals.map((entry, index) => (
              <Animated.View
                key={entry.player.id}
                entering={FadeInDown.delay(index * 100).duration(300)}
                style={[styles.resultRow, { paddingHorizontal: sw(16), paddingVertical: sh(14) }]}
              >
                <Text style={[styles.playerName, { fontSize: fs(18) }]}>{entry.player.name}</Text>
                <View style={styles.badges}>
                  <View style={[styles.badge, { backgroundColor: Colors.green, paddingHorizontal: sw(10), paddingVertical: sh(4) }]}>
                    <Text style={[styles.badgeText, { fontSize: fs(12) }]}>
                      Gave {entry.gave}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: Colors.red, paddingHorizontal: sw(10), paddingVertical: sh(4) }]}>
                    <Text style={[styles.badgeText, { fontSize: fs(12) }]}>
                      Took {entry.took}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </ScrollView>

          {/* Play Again */}
          <View style={styles.footer}>
            <ActionButton
              title="Play Again"
              variant="primary"
              onPress={handlePlayAgain}
            />
          </View>
        </View>
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
    paddingTop: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontWeight: "900",
    color: Colors.textPrimary,
    letterSpacing: 3,
  },
  resultsList: {
    flex: 1,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  playerName: {
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
  },
  badges: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    borderRadius: 8,
  },
  badgeText: {
    color: Colors.white,
    fontWeight: "800",
    letterSpacing: 1,
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
