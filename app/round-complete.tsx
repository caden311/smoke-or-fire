import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useGame } from "../src/context/GameContext";
import ActionButton from "../src/components/ActionButton";
import { Colors } from "../constants/Colors";
import { SUIT_SYMBOLS } from "../constants/Cards";

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
  const { state, dispatch } = useGame();

  const correctCount = state.turnResults.filter((r) => r.correct).length;
  const totalPlayers = state.turnResults.length;
  const isLastRound = state.roundNumber >= 4;

  const handlePlayAgain = () => {
    dispatch({ type: "RESET" });
    router.replace("/");
  };

  const handleNextRound = () => {
    dispatch({ type: "NEXT_ROUND" });
    router.replace("/game");
  };

  return (
    <LinearGradient
      colors={[Colors.background, "#0A1A0A"]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Round {state.roundNumber} Complete</Text>
            <Text style={styles.statsText}>
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
                  style={styles.resultRow}
                >
                  <View style={styles.resultLeft}>
                    <Text style={styles.resultName}>{result.player.name}</Text>
                    <Text style={styles.resultGuess}>
                      Guessed {GUESS_LABELS[result.guess] ?? result.guess}
                    </Text>
                  </View>

                  <View style={styles.resultRight}>
                    <Text style={[styles.resultCard, { color: suitColor }]}>
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
                        },
                      ]}
                    >
                      <Text style={styles.resultBadgeText}>
                        {result.correct ? "GAVE" : "TOOK"}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </ScrollView>

          {/* Actions */}
          <View style={styles.footer}>
            {isLastRound ? (
              <ActionButton
                title="Play Again"
                onPress={handlePlayAgain}
                variant="primary"
              />
            ) : (
              <ActionButton
                title="Next Round"
                onPress={handleNextRound}
                variant="success"
              />
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
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  statsText: {
    fontSize: 18,
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  resultLeft: {
    flex: 1,
  },
  resultName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  resultGuess: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  resultRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resultCard: {
    fontSize: 22,
    fontWeight: "800",
  },
  resultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resultBadgeText: {
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
