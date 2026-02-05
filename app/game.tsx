import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
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

export default function GameRound() {
  const { state, dispatch } = useGame();
  const [hasGuessed, setHasGuessed] = useState(false);
  const [showDrawnCards, setShowDrawnCards] = useState(false);

  const currentPlayer = state.players[state.currentPlayerIndex];
  const isLastPlayer = state.currentPlayerIndex === state.players.length - 1;
  const lastResult = state.turnResults[state.turnResults.length - 1];
  const isHigherOrLower = state.roundType === "higher_or_lower";
  const isInsideOrOutside = state.roundType === "inside_or_outside";
  const isGuessTheSuit = state.roundType === "guess_the_suit";
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
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.roundText}>Round {state.roundNumber}</Text>
            <Text style={styles.progressText}>
              Player {state.currentPlayerIndex + 1} of {state.players.length}
            </Text>
            {state.playerCards.some((cards) => cards.length > 0) && (
              <ActionButton
                title="View Cards"
                variant="ghost"
                onPress={() => setShowDrawnCards(true)}
                style={styles.viewCardsButton}
                textStyle={styles.viewCardsText}
              />
            )}
          </View>

          {/* Player Name */}
          <Animated.View
            key={currentPlayer.id}
            entering={FadeIn.duration(300)}
            style={styles.playerSection}
          >
            <Text style={styles.playerName}>{currentPlayer.name}</Text>
            <Text style={styles.promptText}>
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
            <View style={styles.previousCardSection}>
              <Text style={styles.previousCardLabel}>Your last card:</Text>
              <View style={styles.previousCardWrapper}>
                <CardFace card={previousCard} />
              </View>
            </View>
          )}

          {/* Previous Cards (Inside or Outside round) */}
          {isInsideOrOutside && sortedPreviousCards.length === 2 && !hasGuessed && (
            <View style={styles.previousCardSection}>
              <Text style={styles.previousCardLabel}>Your cards:</Text>
              <View style={styles.previousCardsRow}>
                <View style={styles.previousCardWrapper}>
                  <CardFace card={sortedPreviousCards[0]} />
                </View>
                <Text style={styles.cardDash}>to</Text>
                <View style={styles.previousCardWrapper}>
                  <CardFace card={sortedPreviousCards[1]} />
                </View>
              </View>
            </View>
          )}

          {/* Card */}
          <View style={styles.cardSection}>
            <FlippableCard card={state.currentCard} flipped={hasGuessed} />
          </View>

          {/* Guess Buttons or Result */}
          {!hasGuessed ? (
            isGuessTheSuit ? (
              <View style={styles.buttonGrid}>
                <View style={styles.buttonGridRow}>
                  <ActionButton
                    title={SUIT_SYMBOLS.hearts}
                    variant="hearts"
                    onPress={() => handleGuess("hearts")}
                    style={styles.suitButton}
                    textStyle={styles.suitButtonText}
                  />
                  <ActionButton
                    title={SUIT_SYMBOLS.diamonds}
                    variant="diamonds"
                    onPress={() => handleGuess("diamonds")}
                    style={styles.suitButton}
                    textStyle={styles.suitButtonText}
                  />
                </View>
                <View style={styles.buttonGridRow}>
                  <ActionButton
                    title={SUIT_SYMBOLS.clubs}
                    variant="clubs"
                    onPress={() => handleGuess("clubs")}
                    style={styles.suitButton}
                    textStyle={styles.suitButtonText}
                  />
                  <ActionButton
                    title={SUIT_SYMBOLS.spades}
                    variant="spades"
                    onPress={() => handleGuess("spades")}
                    style={styles.suitButton}
                    textStyle={styles.suitButtonText}
                  />
                </View>
              </View>
            ) : (
            <View style={styles.buttonRow}>
              {isInsideOrOutside ? (
                <>
                  <ActionButton
                    title="INSIDE"
                    variant="inside"
                    onPress={() => handleGuess("inside")}
                    style={styles.guessButton}
                  />
                  <ActionButton
                    title="OUTSIDE"
                    variant="outside"
                    onPress={() => handleGuess("outside")}
                    style={styles.guessButton}
                  />
                </>
              ) : isHigherOrLower ? (
                <>
                  <ActionButton
                    title="HIGHER"
                    variant="higher"
                    onPress={() => handleGuess("higher")}
                    style={styles.guessButton}
                  />
                  <ActionButton
                    title="LOWER"
                    variant="lower"
                    onPress={() => handleGuess("lower")}
                    style={styles.guessButton}
                  />
                </>
              ) : (
                <>
                  <ActionButton
                    title="SMOKE"
                    variant="smoke"
                    onPress={() => handleGuess("smoke")}
                    style={styles.guessButton}
                  />
                  <ActionButton
                    title="FIRE"
                    variant="fire"
                    onPress={() => handleGuess("fire")}
                    style={styles.guessButton}
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
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 8,
  },
  viewCardsButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 0,
  },
  viewCardsText: {
    fontSize: 13,
    letterSpacing: 1,
  },
  roundText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 3,
  },
  progressText: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 4,
  },
  playerSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  playerName: {
    fontSize: 36,
    fontWeight: "900",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  promptText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 4,
    minHeight: 24,
  },
  previousCardSection: {
    alignItems: "center",
    marginBottom: 8,
  },
  previousCardLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "700",
  },
  previousCardWrapper: {
    transform: [{ scale: 0.6 }],
  },
  previousCardsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cardDash: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: "700",
    marginHorizontal: -16,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  cardSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  buttonGrid: {
    gap: 12,
    marginTop: 16,
  },
  buttonGridRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 16,
  },
  guessButton: {
    flex: 1,
    maxWidth: 160,
  },
  suitButton: {
    flex: 1,
    maxWidth: 160,
    paddingVertical: 20,
  },
  suitButtonText: {
    fontSize: 32,
    textTransform: "none",
    letterSpacing: 0,
  },
  resultSection: {
    flex: 1,
  },
  nextButtonContainer: {
    alignItems: "center",
    marginTop: 20,
  },
});
