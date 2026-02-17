import React, { useState, useEffect, useMemo } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMultiplayer } from "../src/context/MultiplayerContext";
import { useGameState } from "../src/hooks/useGameState";
import { useGameActions } from "../src/hooks/useGameActions";
import PyramidCard from "../src/components/PyramidCard";
import PyramidResultModal from "../src/components/PyramidResultModal";
import GiveDrinksModal from "../src/components/GiveDrinksModal";
import ActionButton from "../src/components/ActionButton";
import { Colors } from "../constants/Colors";
import { useResponsive } from "../src/hooks/useResponsive";
import { DrinkAssignment } from "../src/types";

const PYRAMID_ROWS = [[0], [1, 2], [3, 4, 5], [6, 7], [8]];
const ROW_ACTIONS = ["GIVE", "TAKE", "GIVE", "TAKE", "GIVE"];

export default function Pyramid() {
  const { isMultiplayer, isHost, playerId } = useMultiplayer();
  const { state, isLoading } = useGameState();
  const { dispatch } = useGameActions();

  const [showModal, setShowModal] = useState(false);
  const [flippingRow, setFlippingRow] = useState<number | null>(null);
  const [lastRevealedRow, setLastRevealedRow] = useState<number | null>(null);
  const [showDrinkAssignment, setShowDrinkAssignment] = useState(false);
  const { fs, sw, sh } = useResponsive();

  // Track when pyramid row changes to show modal for non-host
  const prevCurrentRowRef = React.useRef<number | null>(null);

  // Effect: Show modal when row is revealed (for non-host watching)
  useEffect(() => {
    if (!state || !isMultiplayer || isHost) return;

    const currentRow = state.pyramidCurrentRow;
    const prevRow = prevCurrentRowRef.current;

    // If row advanced, show the modal for the newly revealed row
    if (prevRow !== null && currentRow > prevRow) {
      const revealedRow = currentRow - 1;
      setLastRevealedRow(revealedRow);
      setShowModal(true);
    }

    prevCurrentRowRef.current = currentRow;
  }, [state?.pyramidCurrentRow, isMultiplayer, isHost]);

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

  // Edge case: Show drink modal when all revealed but no result modal is showing
  // This handles the case where a player has drinks to assign but the result modal
  // was never shown to them (e.g., they're not the host and already dismissed their modal)
  // Only applies to multiplayer - local mode doesn't use drink assignment modal
  useEffect(() => {
    if (isMultiplayer && allRevealed && isMyTurnToAssign && !showModal && !showDrinkAssignment) {
      setShowDrinkAssignment(true);
    }
  }, [isMultiplayer, allRevealed, isMyTurnToAssign, showModal, showDrinkAssignment]);

  // Navigate to results when all cards revealed and all assignments done
  useEffect(() => {
    if (allAssignmentsComplete) {
      router.replace("/pyramid-complete");
    }
  }, [allAssignmentsComplete]);

  // Show loading state
  if (isLoading || !state) {
    return (
      <LinearGradient colors={[Colors.background, "#0A0A1A"]} style={styles.gradient}>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.textSecondary} />
            <Text style={styles.loadingText}>Loading pyramid...</Text>
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

    // Show modal after flip animation
    setTimeout(() => {
      setLastRevealedRow(rowIdx);
      setShowModal(true);
      setFlippingRow(null);
    }, 650);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setLastRevealedRow(null);

    // After closing result modal, check if I need to assign drinks (multiplayer only)
    // Small delay to ensure modal is fully dismissed before showing next one
    if (isMultiplayer && isMyTurnToAssign && !showDrinkAssignment) {
      setTimeout(() => {
        setShowDrinkAssignment(true);
      }, 100);
    }
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

  // Filter results for the last revealed row
  const modalResults =
    lastRevealedRow !== null
      ? state.pyramidResults.filter((r) => r.row === lastRevealedRow)
      : [];

  const canInteract = !isMultiplayer || isHost;

  return (
    <LinearGradient
      colors={[Colors.background, "#0A0A1A"]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, { paddingHorizontal: sw(16) }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { fontSize: fs(28) }]}>FINAL ROUND</Text>
            <Text style={[styles.subtitle, { fontSize: fs(14) }]}>
              {isMultiplayer && !isHost ? "Watch as the host reveals cards" : "Tap a row to reveal"}
            </Text>
          </View>

          {/* Diamond Grid */}
          <View style={[styles.pyramidContainer, { gap: sh(8) }]}>
            {PYRAMID_ROWS.map((rowIndices, rowIdx) => {
              const isActiveRow = rowIdx === state.pyramidCurrentRow;
              const rowAction = ROW_ACTIONS[rowIdx];
              const rowDrinks = state.settings.pyramidDrinks[rowIdx] ?? (rowIdx + 1);
              const rowLabel = `${rowAction} ${rowDrinks}`;
              const labelColor = rowAction === "GIVE" ? Colors.green : Colors.red;

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
                    />
                  ))}
                </View>
              );

              return (
                <View key={rowIdx} style={styles.rowContainer}>
                  <Text style={[styles.rowLabel, { color: labelColor, fontSize: fs(11) }]}>
                    {rowLabel}
                  </Text>
                  {isActiveRow && !allRevealed && canInteract ? (
                    <Pressable onPress={() => handleRowPress(rowIdx)}>
                      {cardRow}
                    </Pressable>
                  ) : (
                    cardRow
                  )}
                </View>
              );
            })}
          </View>

          {/* Footer: Drink assignment or See Results */}
          {allRevealed && (
            <View style={styles.footer}>
              {inDrinkAssignmentPhase && isMultiplayer ? (
                // Multiplayer: Show waiting message if I'm not assigning
                !isMyTurnToAssign && remainingAssignerNames.length > 0 && (
                  <View style={styles.waitingContainer}>
                    <Text style={[styles.waitingText, { fontSize: fs(16) }]}>
                      Waiting for {remainingAssignerNames.join(", ")} to assign drinks...
                    </Text>
                  </View>
                )
              ) : (
                // Local mode OR all assignments complete: show results button
                <ActionButton
                  title="See Results"
                  variant="primary"
                  onPress={handleSeeResults}
                />
              )}
            </View>
          )}
        </View>
      </SafeAreaView>

      <PyramidResultModal
        visible={showModal}
        results={modalResults}
        onClose={handleCloseModal}
      />

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
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  pyramidContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  rowContainer: {
    alignItems: "center",
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
    textAlign: "center",
    marginBottom: 4,
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
  waitingContainer: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  waitingText: {
    color: Colors.textSecondary,
    textAlign: "center",
    fontWeight: "600",
  },
});
