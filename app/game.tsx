import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { useGame } from "../src/context/GameContext";
import { useMultiplayer } from "../src/context/MultiplayerContext";
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
import { GameState } from "../src/types";

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
  const { state, dispatch } = useGame();
  const {
    isMultiplayer,
    isMyTurn,
    syncedGameState,
    syncGameState,
    sendAction,
    isHost,
    pendingAction,
    clearPending,
  } = useMultiplayer();
  const [hasGuessed, setHasGuessed] = useState(false);
  const [showDrawnCards, setShowDrawnCards] = useState(false);
  const { fs, sw, sh, s, previousCardScale, previousCardWidth, previousCardHeight, contentPadding, isSmallScreen } = useResponsive();

  // Determine effective state - use synced state in multiplayer mode
  const effectiveState = isMultiplayer && syncedGameState ? syncedGameState : state;

  // Show loading state while waiting for valid game data (prevents iOS crash)
  if (!isGameStateReady(effectiveState)) {
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

  // Sync game state from Firebase in multiplayer mode
  useEffect(() => {
    if (isMultiplayer && syncedGameState) {
      dispatch({ type: "SYNC_STATE", state: syncedGameState });
    }
  }, [isMultiplayer, syncedGameState, dispatch]);

  // Host: Process pending actions from other players
  useEffect(() => {
    if (isMultiplayer && isHost && pendingAction) {
      // Apply the action locally
      dispatch(pendingAction.action);
      // Clear the pending action
      clearPending();
    }
  }, [isMultiplayer, isHost, pendingAction, dispatch, clearPending]);

  // Host: Sync state to Firebase after local state changes
  useEffect(() => {
    if (isMultiplayer && isHost && state.phase === "playing") {
      syncGameState(state);
    }
  }, [isMultiplayer, isHost, state, syncGameState]);

  const currentPlayer = effectiveState.players[effectiveState.currentPlayerIndex];
  const isLastPlayer = effectiveState.currentPlayerIndex === effectiveState.players.length - 1;
  const lastResult = effectiveState.turnResults[effectiveState.turnResults.length - 1];
  const isHigherOrLower = effectiveState.roundType === "higher_or_lower";
  const isInsideOrOutside = effectiveState.roundType === "inside_or_outside";
  const isGuessTheSuit = effectiveState.roundType === "guess_the_suit";
  const hasPreviousCards = (isHigherOrLower || isInsideOrOutside) && !hasGuessed;
  const playerCardHistory = effectiveState.playerCards[effectiveState.currentPlayerIndex] ?? [];
  const previousCard = playerCardHistory[playerCardHistory.length - 1] ?? null;

  // Multiplayer: Check if it's this player's turn
  const myTurn = isMyTurn(effectiveState.currentPlayerIndex, effectiveState.players);

  const sortedPreviousCards = isInsideOrOutside && playerCardHistory.length >= 2
    ? [playerCardHistory[0], playerCardHistory[1]].sort(
        (a, b) => getCardNumericValue(a.value) - getCardNumericValue(b.value)
      )
    : [];

  // Reset flip state when player or round changes
  useEffect(() => {
    setHasGuessed(false);
  }, [effectiveState.currentPlayerIndex, effectiveState.roundNumber]);

  const handleGuess = async (guess: Guess) => {
    mediumHaptic();

    if (isMultiplayer && !isHost) {
      // Non-host: send action to host
      await sendAction({ type: "MAKE_GUESS", guess });
    } else {
      // Local game or host: dispatch directly
      dispatch({ type: "MAKE_GUESS", guess });
    }
    setHasGuessed(true);

    // Haptic after flip animation completes
    setTimeout(() => {
      if (effectiveState.deck.length > 0) {
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

  const handleNextPlayer = async () => {
    if (isMultiplayer && !isHost) {
      // Non-host: send action to host
      await sendAction({ type: "NEXT_TURN" });
    } else {
      // Local game or host: dispatch directly
      dispatch({ type: "NEXT_TURN" });
    }

    if (isLastPlayer) {
      router.replace("/round-complete");
    }
  };

  // Redirect if not in playing phase
  if (effectiveState.phase !== "playing") {
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
            {effectiveState.playerCards.some((cards) => cards.length > 0) && (
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
            <FlippableCard card={effectiveState.currentCard} flipped={hasGuessed} />
          </View>

          {/* Multiplayer: Waiting for other player */}
          {isMultiplayer && !myTurn && !hasGuessed ? (
            <View style={styles.waitingOverlay}>
              <ActivityIndicator size="large" color={Colors.textSecondary} />
              <Text style={[styles.waitingText, { fontSize: fs(18), marginTop: sh(16) }]}>
                Waiting for {currentPlayer?.name}...
              </Text>
            </View>
          ) : !hasGuessed ? (
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
        playerCards={effectiveState.playerCards}
        players={effectiveState.players}
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
