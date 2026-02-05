import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useGame } from "../src/context/GameContext";
import ActionButton from "../src/components/ActionButton";
import { Colors } from "../constants/Colors";

export default function PyramidComplete() {
  const { state, dispatch } = useGame();

  // Compute per-player totals
  const playerTotals = state.players.map((player) => {
    let gave = 0;
    let took = 0;
    for (const result of state.pyramidResults) {
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

  const handlePlayAgain = () => {
    dispatch({ type: "RESET" });
    router.replace("/");
  };

  return (
    <LinearGradient
      colors={[Colors.background, "#12061F"]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>PYRAMID COMPLETE</Text>
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
                style={styles.resultRow}
              >
                <Text style={styles.playerName}>{entry.player.name}</Text>
                <View style={styles.badges}>
                  <View style={[styles.badge, { backgroundColor: Colors.green }]}>
                    <Text style={styles.badgeText}>
                      Gave {entry.gave}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: Colors.red }]}>
                    <Text style={styles.badgeText}>
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
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
  },
  badges: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
