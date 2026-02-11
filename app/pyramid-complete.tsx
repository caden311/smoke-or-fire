import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useMultiplayer } from "../src/context/MultiplayerContext";
import { useGameState } from "../src/hooks/useGameState";
import { useGameActions } from "../src/hooks/useGameActions";
import ActionButton from "../src/components/ActionButton";
import { Colors } from "../constants/Colors";
import { useResponsive } from "../src/hooks/useResponsive";

export default function PyramidComplete() {
  const { leaveGame } = useMultiplayer();
  const { state, isLoading } = useGameState();
  const { dispatch } = useGameActions();
  const { fs, sw, sh } = useResponsive();

  // Show loading state
  if (isLoading || !state) {
    return (
      <LinearGradient colors={[Colors.background, "#12061F"]} style={styles.gradient}>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.textSecondary} />
            <Text style={styles.loadingText}>Loading results...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Compute per-player totals from pyramid results (potential drinks)
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

  // Compute actual drink assignments received per player
  const drinksReceived = state.players.map((player) => {
    const received = state.pendingDrinkAssignments.filter(
      (a) => a.toPlayerId === player.id && a.roundNumber === 5
    );
    const totalReceived = received.reduce((sum, a) => sum + a.amount, 0);
    const fromPlayers = received.map((a) => ({
      fromName: a.fromPlayerName,
      amount: a.amount,
    }));
    return { player, totalReceived, fromPlayers };
  });

  // Get all pyramid drink assignments for the arrow-style display
  const pyramidAssignments = state.pendingDrinkAssignments.filter(
    (a) => a.roundNumber === 5 && a.amount > 0
  );

  const handlePlayAgain = async () => {
    await leaveGame();
    await dispatch({ type: "RESET" });
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
            {playerTotals.map((entry, index) => {
              const received = drinksReceived.find(r => r.player.id === entry.player.id);
              return (
                <Animated.View
                  key={entry.player.id}
                  entering={FadeInDown.delay(index * 100).duration(300)}
                  style={[styles.resultRow, { paddingHorizontal: sw(16), paddingVertical: sh(14) }]}
                >
                  <View style={styles.playerInfo}>
                    <Text style={[styles.playerName, { fontSize: fs(18) }]}>{entry.player.name}</Text>
                    {received && received.totalReceived > 0 && (
                      <Text style={[styles.receivedText, { fontSize: fs(12) }]}>
                        Received {received.totalReceived} from {received.fromPlayers.map(f => f.fromName).join(", ")}
                      </Text>
                    )}
                  </View>
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
              );
            })}

            {/* Drinks Given Section */}
            {pyramidAssignments.length > 0 && (
              <View style={[styles.drinksSection, { marginTop: sh(20), paddingTop: sh(16) }]}>
                <Text style={[styles.drinksSectionTitle, { fontSize: fs(14), marginBottom: sh(12) }]}>
                  Drinks Given
                </Text>
                {pyramidAssignments.map((assignment, index) => (
                  <Animated.View
                    key={assignment.id}
                    entering={FadeInDown.delay(playerTotals.length * 100 + index * 80).duration(250)}
                    style={[styles.drinkRow, { paddingHorizontal: sw(16), paddingVertical: sh(10) }]}
                  >
                    <Text style={[styles.drinkText, { fontSize: fs(16) }]}>
                      {assignment.fromPlayerName} → {assignment.toPlayerName}
                    </Text>
                    <Text style={[styles.drinkAmount, { fontSize: fs(14) }]}>
                      {assignment.amount} {assignment.amount === 1 ? "drink" : "drinks"}
                    </Text>
                  </Animated.View>
                ))}
              </View>
            )}
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
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  receivedText: {
    color: Colors.textSecondary,
    marginTop: 2,
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 16,
    fontSize: 18,
  },
  drinksSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray,
  },
  drinksSectionTitle: {
    color: Colors.textSecondary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2,
    textAlign: "center",
  },
  drinkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 10,
    marginBottom: 6,
  },
  drinkText: {
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  drinkAmount: {
    color: Colors.gold,
    fontWeight: "700",
  },
});
