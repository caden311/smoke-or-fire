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
import { SUIT_SYMBOLS } from "../constants/Cards";
import { useResponsive } from "../src/hooks/useResponsive";

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
  const { isMultiplayer, isHost, syncedGameState, syncGameState, sendAction } = useMultiplayer();
  const { fs, sw, sh } = useResponsive();

  // Use synced state in multiplayer mode
  const effectiveState = isMultiplayer && syncedGameState ? syncedGameState : state;

  // Sync game state from Firebase in multiplayer mode
  useEffect(() => {
    if (isMultiplayer && syncedGameState) {
      dispatch({ type: "SYNC_STATE", state: syncedGameState });
      // Navigate to game if phase changed back to playing
      if (syncedGameState.phase === "playing") {
        router.replace("/game");
      } else if (syncedGameState.phase === "pyramid") {
        router.replace("/pyramid");
      }
    }
  }, [isMultiplayer, syncedGameState, dispatch]);

  const correctCount = effectiveState.turnResults.filter((r) => r.correct).length;
  const totalPlayers = effectiveState.turnResults.length;
  const isLastRound = effectiveState.roundNumber >= 4;

  const handleFinalRound = async () => {
    if (isMultiplayer && !isHost) {
      await sendAction({ type: "START_PYRAMID" });
    } else {
      dispatch({ type: "START_PYRAMID" });
      if (isMultiplayer && isHost) {
        // Sync will happen in effect
      }
    }
    router.replace("/pyramid");
  };

  const handleNextRound = async () => {
    if (isMultiplayer && !isHost) {
      await sendAction({ type: "NEXT_ROUND" });
    } else {
      dispatch({ type: "NEXT_ROUND" });
      if (isMultiplayer && isHost) {
        // Need to sync after dispatch
        setTimeout(() => syncGameState(state), 0);
      }
    }
    router.replace("/game");
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
            <Text style={[styles.title, { fontSize: fs(32) }]}>Round {effectiveState.roundNumber} Complete</Text>
            <Text style={[styles.statsText, { fontSize: fs(18) }]}>
              {correctCount} of {totalPlayers} correct
            </Text>
          </View>

          {/* Results List */}
          <ScrollView
            style={styles.resultsList}
            showsVerticalScrollIndicator={false}
          >
            {effectiveState.turnResults.map((result, index) => {
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
            {isMultiplayer && !isHost ? (
              <Text style={[styles.waitingText, { fontSize: fs(16) }]}>
                Waiting for host to continue...
              </Text>
            ) : isLastRound ? (
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
});
