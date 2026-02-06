import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGame } from "../src/context/GameContext";
import { useMultiplayer } from "../src/context/MultiplayerContext";
import PyramidCard from "../src/components/PyramidCard";
import PyramidResultModal from "../src/components/PyramidResultModal";
import ActionButton from "../src/components/ActionButton";
import { Colors } from "../constants/Colors";
import { useResponsive } from "../src/hooks/useResponsive";

const PYRAMID_ROWS = [[0], [1, 2], [3, 4, 5], [6, 7], [8]];
const ROW_LABELS = ["GIVE 1", "TAKE 2", "GIVE 3", "TAKE 4", "GIVE 5"];

export default function Pyramid() {
  const { state, dispatch } = useGame();
  const { isMultiplayer, isHost, syncedGameState, syncGameState, sendAction } = useMultiplayer();
  const [showModal, setShowModal] = useState(false);
  const [flippingRow, setFlippingRow] = useState<number | null>(null);
  const [lastRevealedRow, setLastRevealedRow] = useState<number | null>(null);
  const { fs, sw, sh } = useResponsive();

  // Use synced state in multiplayer mode
  const effectiveState = isMultiplayer && syncedGameState ? syncedGameState : state;

  // Sync game state from Firebase in multiplayer mode
  useEffect(() => {
    if (isMultiplayer && syncedGameState) {
      dispatch({ type: "SYNC_STATE", state: syncedGameState });
    }
  }, [isMultiplayer, syncedGameState, dispatch]);

  // Host: Sync state to Firebase after local state changes
  useEffect(() => {
    if (isMultiplayer && isHost && state.phase === "pyramid") {
      syncGameState(state);
    }
  }, [isMultiplayer, isHost, state, syncGameState]);

  const allRevealed = effectiveState.pyramidRevealed.every(Boolean);

  const handleRowPress = async (rowIdx: number) => {
    if (flippingRow !== null) return;

    // In multiplayer, only host can reveal rows
    if (isMultiplayer && !isHost) return;

    setFlippingRow(rowIdx);

    if (isMultiplayer && !isHost) {
      await sendAction({ type: "REVEAL_PYRAMID_ROW" });
    } else {
      dispatch({ type: "REVEAL_PYRAMID_ROW" });
    }

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
  };

  const handleSeeResults = () => {
    router.replace("/pyramid-complete");
  };

  if (effectiveState.phase !== "pyramid") {
    return null;
  }

  // Filter results for the last revealed row
  const modalResults =
    lastRevealedRow !== null
      ? effectiveState.pyramidResults.filter((r) => r.row === lastRevealedRow)
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
              const isActiveRow = rowIdx === effectiveState.pyramidCurrentRow;
              const labelColor =
                ROW_LABELS[rowIdx].startsWith("GIVE") ? Colors.green : Colors.red;

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
                      card={effectiveState.pyramidCards[cardIdx]}
                      revealed={effectiveState.pyramidRevealed[cardIdx]}
                      active={isActiveRow && !allRevealed && canInteract}
                    />
                  ))}
                </View>
              );

              return (
                <View key={rowIdx} style={styles.rowContainer}>
                  <Text style={[styles.rowLabel, { color: labelColor, fontSize: fs(11) }]}>
                    {ROW_LABELS[rowIdx]}
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

          {/* See Results button */}
          {allRevealed && (
            <View style={styles.footer}>
              <ActionButton
                title="See Results"
                variant="primary"
                onPress={handleSeeResults}
              />
            </View>
          )}
        </View>
      </SafeAreaView>

      <PyramidResultModal
        visible={showModal}
        results={modalResults}
        onClose={handleCloseModal}
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
});
