import React, { useEffect } from "react";
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
import { SUIT_SYMBOLS } from "../constants/Cards";
import { useResponsive } from "../src/hooks/useResponsive";
import { DrinkAssignment } from "../src/types";

const GUESS_LABELS: Record<string, string> = {
  smoke: "Smoke",
  fire: "Fire",
  higher: "Higher",
  lower: "Lower",
  inside: "Inside",
  outside: "Outside",
  hearts: "Hearts \u2665",
  diamonds: "Diamonds \u2666",
  clubs: "Clubs \u2663",
  spades: "Spades \u2660",
};

export default function RoundComplete() {
  const { isMultiplayer, isHost } = useMultiplayer();
  const { state, isLoading } = useGameState();
  const { dispatch } = useGameActions();
  const { fs, sw, sh, s } = useResponsive();

  // Navigate when phase changes
  useEffect(() => {
    if (!state) return;

    if (state.phase === "playing") {
      router.replace("/game");
    } else if (state.phase === "pyramid") {
      router.replace("/pyramid");
    }
  }, [state?.phase]);

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

  // If not in round-complete phase, don't render (navigation will handle redirect)
  if (state.phase !== "round-complete") {
    return null;
  }

  const correctCount = state.turnResults.filter((r) => r.correct).length;
  const totalPlayers = state.turnResults.length;
  const isLastRound = state.roundNumber >= 4;

  // Filter drink assignments for this round (multiplayer only)
  const roundDrinkAssignments: DrinkAssignment[] = isMultiplayer
    ? (state.pendingDrinkAssignments || []).filter(
        (a) => a.roundNumber === state.roundNumber && a.amount > 0
      )
    : [];

  const handleFinalRound = async () => {
    await dispatch({ type: "START_PYRAMID" });
    // Navigation handled by phase change effect
  };

  const handleNextRound = async () => {
    await dispatch({ type: "NEXT_ROUND" });
    // Navigation handled by phase change effect
  };

  // Only host can advance the game in multiplayer
  const showNextButton = !isMultiplayer || isHost;

  return (
    <LinearGradient
      colors={[Colors.background, "#12061F"]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, { paddingHorizontal: sw(24) }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { fontSize: fs(32) }]}>Round {state.roundNumber} Complete</Text>
            <Text style={[styles.statsText, { fontSize: fs(18) }]}>
              {correctCount} of {totalPlayers} correct
            </Text>
          </View>

          {/* Results List */}
          <ScrollView
            style={styles.resultsList}
            showsVerticalScrollIndicator={false}
          >
            {state.turnResults.map((result, index) => {
              const suitSymbol = SUIT_SYMBOLS[result.card.suit];
              const suitColor =
                result.card.color === "red" ? Colors.red : Colors.white;

              return (
                <Animated.View
                  key={index}
                  entering={FadeInDown.delay(index * 100).duration(300)}
                  style={[styles.resultRow, { paddingHorizontal: sw(16), paddingVertical: sh(14) }]}
                >
                  <View style={styles.resultLeft}>
                    <Text style={[styles.resultName, { fontSize: fs(18) }]}>{result.player.name}</Text>
                    <Text style={[styles.resultGuess, { fontSize: fs(13) }]}>
                      Guessed {GUESS_LABELS[result.guess] ?? result.guess}
                    </Text>
                  </View>

                  <View style={styles.resultRight}>
                    <Text style={[styles.resultCard, { color: suitColor, fontSize: fs(22) }]}>
                      {result.card.value}
                      {suitSymbol}
                    </Text>
                    <View
                      style={[
                        styles.resultBadge,
                        {
                          backgroundColor: result.correct
                            ? Colors.green
                            : Colors.red,
                          paddingHorizontal: sw(10),
                          paddingVertical: sh(4),
                        },
                      ]}
                    >
                      <Text style={[styles.resultBadgeText, { fontSize: fs(12) }]}>
                        {result.correct ? "GAVE" : "TOOK"} {result.drinks ?? 1}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              );
            })}

            {/* Drinks Given Section - Multiplayer Only */}
            {isMultiplayer && roundDrinkAssignments.length > 0 && (
              <View style={[styles.drinksSection, { marginTop: sh(20), paddingTop: sh(16) }]}>
                <Text style={[styles.drinksSectionTitle, { fontSize: fs(14), marginBottom: sh(12) }]}>
                  Drinks Given
                </Text>
                {roundDrinkAssignments.map((assignment, index) => (
                  <Animated.View
                    key={assignment.id}
                    entering={FadeInDown.delay(state.turnResults.length * 100 + index * 80).duration(250)}
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

          {/* Actions */}
          <View style={styles.footer}>
            {showNextButton ? (
              isLastRound ? (
                <ActionButton
                  title="Final Round"
                  onPress={handleFinalRound}
                  variant="success"
                />
              ) : (
                <ActionButton
                  title="Next Round"
                  onPress={handleNextRound}
                  variant="success"
                />
              )
            ) : (
              <Text style={[styles.waitingText, { fontSize: fs(16) }]}>
                Waiting for host to continue...
              </Text>
            )}
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
    letterSpacing: 2,
  },
  statsText: {
    color: Colors.textSecondary,
    marginTop: 8,
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
  resultLeft: {
    flex: 1,
  },
  resultName: {
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  resultGuess: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  resultRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resultCard: {
    fontWeight: "800",
  },
  resultBadge: {
    borderRadius: 8,
  },
  resultBadgeText: {
    color: Colors.white,
    fontWeight: "800",
    letterSpacing: 1,
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  waitingText: {
    color: Colors.textSecondary,
    fontStyle: "italic",
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
