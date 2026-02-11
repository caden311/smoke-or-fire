import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { useMultiplayer } from "../src/context/MultiplayerContext";
import { useGameState } from "../src/hooks/useGameState";
import { useGameActions } from "../src/hooks/useGameActions";
import FlippableCard from "../src/components/FlippableCard";
import CardFace from "../src/components/CardFace";
import ActionButton from "../src/components/ActionButton";
import ResultBanner from "../src/components/ResultBanner";
import { Colors } from "../constants/Colors";
import { Guess, GameState, DrinkAssignment } from "../src/types";
import { getCardNumericValue } from "../src/utils/deck";
import { successHaptic, errorHaptic, mediumHaptic } from "../src/utils/haptics";
import { SUIT_SYMBOLS } from "../constants/Cards";
import DrawnCardsModal from "../src/components/DrawnCardsModal";
import GiveDrinksModal from "../src/components/GiveDrinksModal";
import { useResponsive } from "../src/hooks/useResponsive";

// Validate that game state has all required data before rendering
function isGameStateReady(state: GameState | null): state is GameState {
  if (!state) return false;
  if (!Array.isArray(state.players) || state.players.length === 0) return false;
  if (!Array.isArray(state.playerCards)) return false;
  if (!Array.isArray(state.turnResults)) return false;
  if (state.currentPlayerIndex < 0 || state.currentPlayerIndex >= state.players.length) return false;
  return true;
}

export default function GameRound() {
  const { isMultiplayer, isHost, playerId } = useMultiplayer();
  const { state, isLoading, isMyTurn, currentPlayer } = useGameState();
  const { dispatch } = useGameActions();

  const [guessState, setGuessState] = useState<'idle' | 'submitting' | 'guessed'>('idle');
  const [showDrawnCards, setShowDrawnCards] = useState(false);
  const [showGiveDrinksModal, setShowGiveDrinksModal] = useState(false);
  const { fs, sw, sh, s, previousCardScale, previousCardWidth, previousCardHeight, contentPadding, isSmallScreen } = useResponsive();

  // Track player/round changes to reset guess state
  const prevPlayerRef = useRef<number | null>(null);
  const prevRoundRef = useRef<number | null>(null);

  // Effect 1: Navigate on phase change (works for both local and multiplayer)
  useEffect(() => {
    if (!state) return;
    if (state.phase === "round-complete") {
      router.replace("/round-complete");
    } else if (state.phase === "pyramid") {
      router.replace("/pyramid");
    }
  }, [state?.phase]);

  // Effect 2: Reset guess state on turn/round change
  useEffect(() => {
    if (!isGameStateReady(state)) return;

    const playerChanged = prevPlayerRef.current !== null &&
                          prevPlayerRef.current !== state.currentPlayerIndex;
    const roundChanged = prevRoundRef.current !== null &&
                         prevRoundRef.current !== state.roundNumber;

    if (playerChanged || roundChanged) {
      setGuessState('idle');
    }

    prevPlayerRef.current = state.currentPlayerIndex;
    prevRoundRef.current = state.roundNumber;
  }, [state?.currentPlayerIndex, state?.roundNumber]);

  // Effect 3: Confirm guess when card appears (for non-host in multiplayer)
  useEffect(() => {
    if (!isMultiplayer || !isGameStateReady(state)) return;

    // When submitting and card appears, confirm the guess
    if (guessState === 'submitting' && state.currentCard != null) {
      console.log('[GAME] Guess confirmed via card appearance');
      setGuessState('guessed');
    }
  }, [isMultiplayer, guessState, state?.currentCard]);

  // Effect 4: Trigger haptic when result appears
  useEffect(() => {
    if (!isGameStateReady(state)) return;
    if (guessState !== 'guessed') return;

    const lastResult = state.turnResults[state.turnResults.length - 1];
    if (lastResult) {
      const timer = setTimeout(() => {
        if (lastResult.correct) {
          successHaptic();
        } else {
          errorHaptic();
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [guessState, state?.turnResults?.length]);

  // Show loading state while waiting for valid game data
  if (isLoading || !isGameStateReady(state)) {
    return (
      <LinearGradient colors={[Colors.background, "#0A0A1A"]} style={styles.gradient}>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.textSecondary} />
            <Text style={styles.loadingText}>Loading game...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Redirect if not in playing phase
  if (state.phase !== "playing") {
    return null;
  }

  // === SAFE TO ACCESS state properties below this point ===

  const isLastPlayer = state.currentPlayerIndex === state.players.length - 1;
  const lastResult = state.turnResults[state.turnResults.length - 1] ?? null;

  // Check if current player won (correct guess) for give drinks feature
  const didWinThisTurn = lastResult?.correct === true;

  // Other players for drink assignment (exclude current player)
  const otherPlayers = state.players.filter(p => p.id !== currentPlayer?.id);

  // Card flip logic: show card when it exists in state
  const shouldShowFlipped = state.currentCard != null;

  const isHigherOrLower = state.roundType === "higher_or_lower";
  const isInsideOrOutside = state.roundType === "inside_or_outside";
  const isGuessTheSuit = state.roundType === "guess_the_suit";
  const hasPreviousCards = (isHigherOrLower || isInsideOrOutside) && guessState === 'idle';
  const playerCardHistory = state.playerCards[state.currentPlayerIndex] ?? [];
  const previousCard = playerCardHistory[playerCardHistory.length - 1] ?? null;

  const sortedPreviousCards = isInsideOrOutside && playerCardHistory.length >= 2
    ? [playerCardHistory[0], playerCardHistory[1]].sort(
        (a, b) => getCardNumericValue(a.value) - getCardNumericValue(b.value)
      )
    : [];

  const handleGuess = async (guess: Guess) => {
    console.log('[GAME] handleGuess', { guess, isHost, isMyTurn });
    mediumHaptic();

    setGuessState('submitting');
    await dispatch({ type: "MAKE_GUESS", guess });

    // For local game or host, immediately confirm
    if (!isMultiplayer || isHost) {
      setGuessState('guessed');
    }
    // For non-host, Effect 3 will confirm when card appears
  };

  const handleNextPlayer = async () => {
    // In multiplayer, current player can advance their own turn
    if (isMultiplayer && !isMyTurn) return;

    await dispatch({ type: "NEXT_TURN" });
    // Navigation handled by Effect 1 when phase changes
  };

  const handleGiveDrinks = () => {
    setShowGiveDrinksModal(true);
  };

  const handleConfirmDrinks = async (assignments: DrinkAssignment[]) => {
    setShowGiveDrinksModal(false);
    // Combine drink assignment and turn advance into single action
    // This prevents the non-host pendingAction overwrite bug in multiplayer
    await dispatch({
      type: "ASSIGN_DRINKS",
      assignments,
      advanceTurn: true,
    });
  };

  const handleSkipDrinks = async () => {
    setShowGiveDrinksModal(false);
    await dispatch({ type: "NEXT_TURN" });
  };

  // Determine what UI to show
  const showWaitingForOther = isMultiplayer && !isMyTurn && guessState === 'idle';
  const showSubmitting = guessState === 'submitting';
  const showGuessButtons = guessState === 'idle' && !showWaitingForOther;
  const showResult = guessState === 'guessed';

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
                <Text style={styles.viewCardsIconText}>&#127183;</Text>
              </Pressable>
            )}
          </View>

          {/* Player Name */}
          <Animated.View
            key={currentPlayer?.id}
            entering={FadeIn.duration(300)}
            style={[styles.playerSection, { marginBottom: 20 }]}
          >
            <Text style={[styles.playerName, { fontSize: fs(36) }]}>{currentPlayer?.name}</Text>
            <Text style={[styles.promptText, { fontSize: fs(18) }]}>
              {showResult
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
          {isHigherOrLower && previousCard && guessState === 'idle' && (
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
          {isInsideOrOutside && sortedPreviousCards.length === 2 && guessState === 'idle' && (
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
            <FlippableCard card={state.currentCard} flipped={shouldShowFlipped} />
          </View>

          {/* Waiting for other player */}
          {showWaitingForOther && (
            <View style={styles.waitingOverlay}>
              <ActivityIndicator size="large" color={Colors.textSecondary} />
              <Text style={[styles.waitingText, { fontSize: fs(18), marginTop: sh(16) }]}>
                Waiting for {currentPlayer?.name}...
              </Text>
            </View>
          )}

          {/* Submitting guess */}
          {showSubmitting && (
            <View style={styles.waitingOverlay}>
              <ActivityIndicator size="large" color={Colors.textSecondary} />
              <Text style={[styles.waitingText, { fontSize: fs(18), marginTop: sh(16) }]}>
                Submitting guess...
              </Text>
            </View>
          )}

          {/* Guess buttons */}
          {showGuessButtons && (
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
          )}

          {/* Result and Next button */}
          {showResult && (
            <View style={styles.resultSection}>
              {lastResult && (
                <ResultBanner
                  correct={lastResult.correct}
                  guess={lastResult.guess}
                  card={lastResult.card}
                  drinks={lastResult.drinks}
                />
              )}
              <View style={styles.nextButtonContainer}>
                {/* In multiplayer, winning player can give drinks */}
                {isMultiplayer && didWinThisTurn && isMyTurn && otherPlayers.length > 0 ? (
                  <ActionButton
                    title="Give Drinks"
                    variant="primary"
                    onPress={handleGiveDrinks}
                  />
                ) : (
                  <ActionButton
                    title={isLastPlayer ? "See Results" : "Next Player"}
                    variant="primary"
                    onPress={handleNextPlayer}
                  />
                )}
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

      {/* Give Drinks Modal (multiplayer only) */}
      {isMultiplayer && currentPlayer && (
        <GiveDrinksModal
          visible={showGiveDrinksModal}
          totalDrinks={1}
          currentPlayer={currentPlayer}
          otherPlayers={otherPlayers}
          roundNumber={state.roundNumber}
          onConfirm={handleConfirmDrinks}
          onSkip={handleSkipDrinks}
        />
      )}
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
  waitingOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  waitingText: {
    color: Colors.textSecondary,
    textAlign: "center",
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
});
