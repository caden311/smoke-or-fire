import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { useGame } from "../src/context/GameContext";
import FlippableCard from "../src/components/FlippableCard";
import CardFace from "../src/components/CardFace";
import ActionButton from "../src/components/ActionButton";
import ResultBanner from "../src/components/ResultBanner";
import { Colors } from "../constants/Colors";
import { Guess } from "../src/types";
import { getCardNumericValue } from "../src/utils/deck";
import { successHaptic, errorHaptic, mediumHaptic } from "../src/utils/haptics";
import { SUIT_SYMBOLS } from "../constants/Cards";
import DrawnCardsModal from "../src/components/DrawnCardsModal";
import { useResponsive } from "../src/hooks/useResponsive";

export default function GameRound() {
  const { state, dispatch } = useGame();
  const [hasGuessed, setHasGuessed] = useState(false);
  const [showDrawnCards, setShowDrawnCards] = useState(false);
  const { fs, sw, sh, s, previousCardScale, previousCardWidth, previousCardHeight, contentPadding, isSmallScreen } = useResponsive();

  const currentPlayer = state.players[state.currentPlayerIndex];
  const isLastPlayer = state.currentPlayerIndex === state.players.length - 1;
  const lastResult = state.turnResults[state.turnResults.length - 1];
  const isHigherOrLower = state.roundType === "higher_or_lower";
  const isInsideOrOutside = state.roundType === "inside_or_outside";
  const isGuessTheSuit = state.roundType === "guess_the_suit";
  const hasPreviousCards = (isHigherOrLower || isInsideOrOutside) && !hasGuessed;
  const playerCardHistory = state.playerCards[state.currentPlayerIndex] ?? [];
  const previousCard = playerCardHistory[playerCardHistory.length - 1] ?? null;

  const sortedPreviousCards = isInsideOrOutside && playerCardHistory.length >= 2
    ? [playerCardHistory[0], playerCardHistory[1]].sort(
        (a, b) => getCardNumericValue(a.value) - getCardNumericValue(b.value)
      )
    : [];

  // Reset flip state when player or round changes
  useEffect(() => {
    setHasGuessed(false);
  }, [state.currentPlayerIndex, state.roundNumber]);

  const handleGuess = (guess: Guess) => {
    mediumHaptic();
    dispatch({ type: "MAKE_GUESS", guess });
    setHasGuessed(true);

    // Haptic after flip animation completes
    setTimeout(() => {
      if (state.deck.length > 0) {
        // We need to check the result after the state update
        // The result will be available in the next render
      }
    }, 600);
  };

  // Trigger haptic when result appears
  useEffect(() => {
    if (hasGuessed && lastResult) {
      const timer = setTimeout(() => {
        if (lastResult.correct) {
          successHaptic();
        } else {
          errorHaptic();
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [hasGuessed, lastResult]);

  const handleNextPlayer = () => {
    if (isLastPlayer) {
      dispatch({ type: "NEXT_TURN" });
      router.replace("/round-complete");
    } else {
      dispatch({ type: "NEXT_TURN" });
    }
  };

  // Redirect if not in playing phase
  if (state.phase !== "playing") {
    return null;
  }

  return (
    <LinearGradient
      colors={[Colors.background, "#0A0A1A"]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, { paddingHorizontal: contentPadding }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.roundText, { fontSize: fs(16) }]}>Round {state.roundNumber}</Text>
            <Text style={[styles.progressText, { fontSize: fs(14) }]}>
              Player {state.currentPlayerIndex + 1} of {state.players.length}
            </Text>
            {state.playerCards.some((cards) => cards.length > 0) && (
              <Pressable
                onPress={() => setShowDrawnCards(true)}
                style={styles.viewCardsIcon}
                hitSlop={8}
              >
                <Text style={styles.viewCardsIconText}>🃏</Text>
              </Pressable>
            )}
          </View>

          {/* Player Name */}
          <Animated.View
            key={currentPlayer.id}
            entering={FadeIn.duration(300)}
            style={[styles.playerSection, { marginBottom: 20 }]}
          >
            <Text style={[styles.playerName, { fontSize: fs(36) }]}>{currentPlayer.name}</Text>
            <Text style={[styles.promptText, { fontSize: fs(18) }]}>
              {hasGuessed
                ? ""
                : isGuessTheSuit
                  ? "Guess the Suit"
                  : isInsideOrOutside
                    ? "Inside or Outside?"
                    : isHigherOrLower
                      ? "Higher or Lower?"
                      : "Smoke or Fire?"}
            </Text>
          </Animated.View>

          {/* Previous Card (Higher or Lower round) */}
          {isHigherOrLower && previousCard && !hasGuessed && (
            <View style={[styles.previousCardSection, { marginBottom: 20 }]}>
              <Text style={[styles.previousCardLabel, { fontSize: fs(14), marginBottom: 20 }]}>Your last card:</Text>
              <View style={{
                width: previousCardWidth,
                height: previousCardHeight,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <View style={{ transform: [{ scale: previousCardScale }] }}>
                  <CardFace card={previousCard} />
                </View>
              </View>
            </View>
          )}

          {/* Previous Cards (Inside or Outside round) */}
          {isInsideOrOutside && sortedPreviousCards.length === 2 && !hasGuessed && (
            <View style={[styles.previousCardSection, { marginBottom: 20 }]}>
              <Text style={[styles.previousCardLabel, { fontSize: fs(14), marginBottom: 20 }]}>Your cards:</Text>
              <View style={styles.previousCardsRow}>
                <View style={{
                  width: previousCardWidth,
                  height: previousCardHeight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <View style={{ transform: [{ scale: previousCardScale }] }}>
                    <CardFace card={sortedPreviousCards[0]} />
                  </View>
                </View>
                <Text style={[styles.cardDash, { fontSize: fs(16), marginHorizontal: 20 }]}>to</Text>
                <View style={{
                  width: previousCardWidth,
                  height: previousCardHeight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <View style={{ transform: [{ scale: previousCardScale }] }}>
                    <CardFace card={sortedPreviousCards[1]} />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Card */}
          <View style={[styles.cardSection, { paddingVertical: hasPreviousCards && isSmallScreen ? sh(12) : sh(24) }]}>
            <FlippableCard card={state.currentCard} flipped={hasGuessed} />
          </View>

          {/* Guess Buttons or Result */}
          {!hasGuessed ? (
            isGuessTheSuit ? (
              <View style={[styles.buttonGrid, { gap: s(12), marginTop: isSmallScreen ? 8 : 16 }]}>
                <View style={[styles.buttonGridRow, { gap: s(12) }]}>
                  <ActionButton
                    title={SUIT_SYMBOLS.hearts}
                    variant="hearts"
                    onPress={() => handleGuess("hearts")}
                    style={{ flex: 1, maxWidth: sw(160), paddingVertical: sh(20) }}
                    textStyle={{ fontSize: fs(32), textTransform: "none", letterSpacing: 0 }}
                  />
                  <ActionButton
                    title={SUIT_SYMBOLS.diamonds}
                    variant="diamonds"
                    onPress={() => handleGuess("diamonds")}
                    style={{ flex: 1, maxWidth: sw(160), paddingVertical: sh(20) }}
                    textStyle={{ fontSize: fs(32), textTransform: "none", letterSpacing: 0 }}
                  />
                </View>
                <View style={[styles.buttonGridRow, { gap: s(12) }]}>
                  <ActionButton
                    title={SUIT_SYMBOLS.clubs}
                    variant="clubs"
                    onPress={() => handleGuess("clubs")}
                    style={{ flex: 1, maxWidth: sw(160), paddingVertical: sh(20) }}
                    textStyle={{ fontSize: fs(32), textTransform: "none", letterSpacing: 0 }}
                  />
                  <ActionButton
                    title={SUIT_SYMBOLS.spades}
                    variant="spades"
                    onPress={() => handleGuess("spades")}
                    style={{ flex: 1, maxWidth: sw(160), paddingVertical: sh(20) }}
                    textStyle={{ fontSize: fs(32), textTransform: "none", letterSpacing: 0 }}
                  />
                </View>
              </View>
            ) : (
            <View style={[styles.buttonRow, { gap: s(16), marginTop: isSmallScreen ? 8 : 16 }]}>
              {isInsideOrOutside ? (
                <>
                  <ActionButton
                    title="INSIDE"
                    variant="inside"
                    onPress={() => handleGuess("inside")}
                    style={{ flex: 1, maxWidth: sw(160) }}
                  />
                  <ActionButton
                    title="OUTSIDE"
                    variant="outside"
                    onPress={() => handleGuess("outside")}
                    style={{ flex: 1, maxWidth: sw(160) }}
                  />
                </>
              ) : isHigherOrLower ? (
                <>
                  <ActionButton
                    title="HIGHER"
                    variant="higher"
                    onPress={() => handleGuess("higher")}
                    style={{ flex: 1, maxWidth: sw(160) }}
                  />
                  <ActionButton
                    title="LOWER"
                    variant="lower"
                    onPress={() => handleGuess("lower")}
                    style={{ flex: 1, maxWidth: sw(160) }}
                  />
                </>
              ) : (
                <>
                  <ActionButton
                    title="SMOKE"
                    variant="smoke"
                    onPress={() => handleGuess("smoke")}
                    style={{ flex: 1, maxWidth: sw(160) }}
                  />
                  <ActionButton
                    title="FIRE"
                    variant="fire"
                    onPress={() => handleGuess("fire")}
                    style={{ flex: 1, maxWidth: sw(160) }}
                  />
                </>
              )}
            </View>
            )
          ) : (
            <View style={styles.resultSection}>
              {lastResult && (
                <ResultBanner
                  correct={lastResult.correct}
                  guess={lastResult.guess}
                  card={lastResult.card}
                />
              )}
              <View style={styles.nextButtonContainer}>
                <ActionButton
                  title={isLastPlayer ? "See Results" : "Next Player"}
                  variant="primary"
                  onPress={handleNextPlayer}
                />
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>

      <DrawnCardsModal
        visible={showDrawnCards}
        onClose={() => setShowDrawnCards(false)}
        playerCards={state.playerCards}
        players={state.players}
      />
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
    paddingTop: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
  },
  viewCardsIcon: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  viewCardsIconText: {
    fontSize: 22,
  },
  roundText: {
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 3,
  },
  progressText: {
    color: Colors.gray,
    marginTop: 4,
  },
  playerSection: {
    alignItems: "center",
  },
  playerName: {
    fontWeight: "900",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  promptText: {
    color: Colors.textSecondary,
    marginTop: 4,
    minHeight: 24,
  },
  previousCardSection: {
    alignItems: "center",
    marginBottom: 8,
  },
  previousCardLabel: {
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "700",
  },
  previousCardsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cardDash: {
    color: Colors.textSecondary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  cardSection: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonGrid: {
  },
  buttonGridRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  resultSection: {
    flex: 1,
  },
  nextButtonContainer: {
    alignItems: "center",
    marginTop: 20,
  },
});
