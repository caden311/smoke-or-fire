import React, { useState, useEffect, useMemo } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMultiplayer } from "../src/context/MultiplayerContext";
import { useGameState } from "../src/hooks/useGameState";
import { useGameActions } from "../src/hooks/useGameActions";
import { useTheme } from "../src/context/ThemeContext";
import { useSettings } from "../src/context/SettingsContext";
import PyramidCard from "../src/components/PyramidCard";
import GiveDrinksModal from "../src/components/GiveDrinksModal";
import { useResponsive } from "../src/hooks/useResponsive";
import { DrinkAssignment, PyramidMatch } from "../src/types";

const PYRAMID_ROWS = [[0], [1, 2], [3, 4, 5], [6, 7], [8]];
const ROW_ACTIONS: ("give" | "take")[] = ["give", "take", "give", "take", "give"];

export default function Pyramid() {
  const { isMultiplayer, isHost, playerId } = useMultiplayer();
  const { state, isLoading } = useGameState();
  const { dispatch } = useGameActions();
  const { colors } = useTheme();
  const { settings } = useSettings();
  const isChallenge = settings.gameMode === 'challenge';

  const [flippingRow, setFlippingRow] = useState<number | null>(null);
  const [showDrinkAssignment, setShowDrinkAssignment] = useState(false);
  const { fs, sw, sh } = useResponsive();

  // Build lookup of matches by card index from pyramidResults
  const matchesByCardIndex = useMemo(() => {
    if (!state) return {} as Record<number, PyramidMatch[]>;
    const map: Record<number, PyramidMatch[]> = {};
    for (const result of state.pyramidResults) {
      map[result.cardIndex] = result.matches;
    }
    return map;
  }, [state?.pyramidResults]);

  // Calculate cumulative drinks to give and take
  const drinkTally = useMemo(() => {
    if (!state) return { give: 0, take: 0 };
    let give = 0;
    let take = 0;
    for (const result of state.pyramidResults) {
      for (const match of result.matches) {
        if (result.action === "give") {
          give += match.drinks;
        } else {
          take += match.drinks;
        }
      }
    }
    return { give, take };
  }, [state?.pyramidResults]);

  // Drink assignment state - all players with drinks can assign simultaneously
  const inDrinkAssignmentPhase = state && state.pyramidPendingAssigners.length > 0;

  // Find my entry in the pending assigners list
  const myAssignerEntry = useMemo(() => {
    if (!state || !inDrinkAssignmentPhase) return null;
    // In local mode, use the first pending assigner (pass-and-play)
    if (!isMultiplayer) {
      return state.pyramidPendingAssigners[0] ?? null;
    }
    // In multiplayer, find my entry
    return state.pyramidPendingAssigners.find(a => a.playerId === playerId) ?? null;
  }, [state?.pyramidPendingAssigners, isMultiplayer, playerId, inDrinkAssignmentPhase]);

  // I can assign if I'm in the pending assigners list
  const isMyTurnToAssign = myAssignerEntry !== null;

  const myDrinksToGive = myAssignerEntry?.drinksToGive ?? 0;

  // Get current assigning player object (for the modal)
  const currentAssigningPlayer = useMemo(() => {
    if (!state || !myAssignerEntry) return null;
    return state.players.find(p => p.id === myAssignerEntry.playerId) ?? null;
  }, [state, myAssignerEntry]);

  // Other players (excluding the one assigning drinks)
  const otherPlayers = useMemo(() => {
    if (!state || !myAssignerEntry) return [];
    return state.players.filter(p => p.id !== myAssignerEntry.playerId);
  }, [state, myAssignerEntry]);

  // List of remaining assigners (for waiting message)
  const remainingAssignerNames = useMemo(() => {
    if (!state || !inDrinkAssignmentPhase) return [];
    return state.pyramidPendingAssigners.map(a => a.playerName);
  }, [state?.pyramidPendingAssigners, inDrinkAssignmentPhase]);

  // All cards revealed and all drink assignments complete
  const allRevealed = state?.pyramidRevealed.every(Boolean) ?? false;
  const allAssignmentsComplete = allRevealed && state?.pyramidPendingAssigners.length === 0;

  // Show drink assignment modal when all cards revealed and player has drinks to assign
  // Only applies to multiplayer - local mode doesn't use drink assignment modal
  useEffect(() => {
    if (isMultiplayer && allRevealed && isMyTurnToAssign && !showDrinkAssignment) {
      setShowDrinkAssignment(true);
    }
  }, [isMultiplayer, allRevealed, isMyTurnToAssign, showDrinkAssignment]);

  // Show loading state
  if (isLoading || !state) {
    return (
      <LinearGradient colors={[colors.background, colors.backgroundGradientEnd]} style={styles.gradient}>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.textSecondary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading pyramid...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (state.phase !== "pyramid") {
    return null;
  }

  const handleRowPress = async (rowIdx: number) => {
    if (flippingRow !== null) return;

    // Only host can reveal rows in multiplayer
    if (isMultiplayer && !isHost) return;

    setFlippingRow(rowIdx);

    await dispatch({ type: "REVEAL_PYRAMID_ROW" });

    // Clear flipping state after animation completes
    setTimeout(() => {
      setFlippingRow(null);
    }, 650);
  };

  const handleSeeResults = () => {
    router.replace("/pyramid-complete");
  };

  const handleConfirmDrinks = async (assignments: DrinkAssignment[]) => {
    const myPlayerId = myAssignerEntry?.playerId;
    console.log('[PYRAMID] Confirming drink assignments', {
      assignmentCount: assignments.length,
      playerId: myPlayerId,
      remainingAssigners: state?.pyramidPendingAssigners.length,
    });
    setShowDrinkAssignment(false);
    await dispatch({
      type: "ASSIGN_DRINKS",
      assignments,
      completePyramidAssignment: myPlayerId,
    });
  };

  const canInteract = !isMultiplayer || isHost;

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundGradientEnd]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, { paddingHorizontal: sw(16) }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { fontSize: fs(28), color: colors.textPrimary }]}>FINAL ROUND</Text>
            <Text style={[styles.subtitle, { fontSize: fs(14), color: colors.textSecondary }]}>
              {isMultiplayer && !isHost ? "Watch as the host reveals cards" : "Tap a row to reveal"}
            </Text>
          </View>

          {/* Running Tally Badge */}
          {(drinkTally.give > 0 || drinkTally.take > 0) && (
            <View style={styles.tallyContainer}>
              {drinkTally.give > 0 && (
                <View style={[styles.tallyBadge, { backgroundColor: colors.success + "20" }]}>
                  <Text style={[styles.tallyText, { color: colors.success, fontSize: fs(12) }]}>
                    {isChallenge ? `Give ${drinkTally.give} dare${drinkTally.give !== 1 ? 's' : ''}` : `Give: ${drinkTally.give}`}
                  </Text>
                </View>
              )}
              {drinkTally.take > 0 && (
                <View style={[styles.tallyBadge, { backgroundColor: colors.fire + "20" }]}>
                  <Text style={[styles.tallyText, { color: colors.fire, fontSize: fs(12) }]}>
                    {isChallenge ? `Tell ${drinkTally.take} truth${drinkTally.take !== 1 ? 's' : ''}` : `Take: ${drinkTally.take}`}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Diamond Grid */}
          <View style={[styles.pyramidContainer, { gap: sh(8) }]}>
            {PYRAMID_ROWS.map((rowIndices, rowIdx) => {
              const isActiveRow = rowIdx === state.pyramidCurrentRow;
              const rowAction = ROW_ACTIONS[rowIdx];
              const rowDrinks = state.settings.pyramidDrinks[rowIdx] ?? (rowIdx + 1);
              const rowLabel = isChallenge
                ? (rowAction === "give" ? "DARE" : "TRUTH")
                : `${rowAction.toUpperCase()} ${rowDrinks}`;
              const labelColor = rowAction === "give" ? colors.success : colors.fire;

              const cardRow = (
                <View
                  style={[
                    styles.row,
                    { gap: sw(8) },
                    isActiveRow && !allRevealed && styles.activeRow,
                  ]}
                >
                  {rowIndices.map((cardIdx) => (
                    <PyramidCard
                      key={cardIdx}
                      card={state.pyramidCards[cardIdx]}
                      revealed={state.pyramidRevealed[cardIdx]}
                      active={isActiveRow && !allRevealed && canInteract}
                      matches={matchesByCardIndex[cardIdx] || []}
                      action={rowAction}
                    />
                  ))}
                </View>
              );

              return (
                <View key={rowIdx} style={styles.rowContainer}>
                  <Text style={[styles.rowLabel, { color: labelColor, fontSize: fs(11) }]}>
                    {rowLabel}
                  </Text>
                  <View style={styles.rowCards}>
                    {isActiveRow && !allRevealed && canInteract ? (
                      <Pressable onPress={() => handleRowPress(rowIdx)}>
                        {cardRow}
                      </Pressable>
                    ) : (
                      cardRow
                    )}
                  </View>
                  <View style={styles.rowLabelSpacer} />
                </View>
              );
            })}
          </View>

          {/* Waiting message for multiplayer non-assigners */}
          {allRevealed && inDrinkAssignmentPhase && isMultiplayer && !isMyTurnToAssign && remainingAssignerNames.length > 0 && (
            <View style={styles.waitingContainer}>
              <Text style={[styles.waitingText, { fontSize: fs(16), color: colors.textSecondary }]}>
                Waiting for {remainingAssignerNames.join(", ")} to assign {isChallenge ? 'dares' : 'drinks'}...
              </Text>
            </View>
          )}
        </View>

        {/* Floating arrow button — visible when all revealed and no pending assignments */}
        {allRevealed && (!isMultiplayer || !inDrinkAssignmentPhase) && canInteract && (
          <Pressable
            style={[styles.arrowButton, { backgroundColor: colors.fire }]}
            onPress={handleSeeResults}
          >
            <Text style={styles.arrowText}>›</Text>
          </Pressable>
        )}
      </SafeAreaView>

      {currentAssigningPlayer && isMultiplayer && (
        <GiveDrinksModal
          visible={showDrinkAssignment && isMyTurnToAssign}
          totalDrinks={myDrinksToGive}
          currentPlayer={currentAssigningPlayer}
          otherPlayers={otherPlayers}
          roundNumber={5}
          onConfirm={handleConfirmDrinks}
          onSkip={() => {}}
          allowSkip={false}
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
    marginBottom: 20,
  },
  title: {
    fontWeight: "900",
    letterSpacing: 4,
  },
  subtitle: {
    marginTop: 4,
  },
  tallyContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 12,
  },
  tallyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tallyText: {
    fontWeight: "700",
  },
  pyramidContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  activeRow: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  rowLabel: {
    fontWeight: "800",
    letterSpacing: 1,
    textAlign: "right",
    width: 64,
    paddingRight: 8,
  },
  rowCards: {
    alignItems: "center",
  },
  rowLabelSpacer: {
    width: 64,
  },
  arrowButton: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  arrowText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 36,
    marginLeft: 3,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
  },
  waitingContainer: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  waitingText: {
    textAlign: "center",
    fontWeight: "600",
  },
});
