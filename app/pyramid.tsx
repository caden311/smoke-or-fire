import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGame } from "../src/context/GameContext";
import PyramidCard from "../src/components/PyramidCard";
import PyramidResultModal from "../src/components/PyramidResultModal";
import ActionButton from "../src/components/ActionButton";
import { Colors } from "../constants/Colors";

const PYRAMID_ROWS = [[0], [1, 2], [3, 4, 5], [6, 7], [8]];
const ROW_LABELS = ["GIVE 1", "TAKE 2", "GIVE 3", "TAKE 4", "GIVE 5"];

export default function Pyramid() {
  const { state, dispatch } = useGame();
  const [showModal, setShowModal] = useState(false);
  const [flippingRow, setFlippingRow] = useState<number | null>(null);
  const [lastRevealedRow, setLastRevealedRow] = useState<number | null>(null);

  const allRevealed = state.pyramidRevealed.every(Boolean);

  const handleRowPress = (rowIdx: number) => {
    if (flippingRow !== null) return;
    setFlippingRow(rowIdx);
    dispatch({ type: "REVEAL_PYRAMID_ROW" });

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

  if (state.phase !== "pyramid") {
    return null;
  }

  // Filter results for the last revealed row
  const modalResults =
    lastRevealedRow !== null
      ? state.pyramidResults.filter((r) => r.row === lastRevealedRow)
      : [];

  return (
    <LinearGradient
      colors={[Colors.background, "#0A0A1A"]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>FINAL ROUND</Text>
            <Text style={styles.subtitle}>Tap a row to reveal</Text>
          </View>

          {/* Diamond Grid */}
          <View style={styles.pyramidContainer}>
            {PYRAMID_ROWS.map((rowIndices, rowIdx) => {
              const isActiveRow = rowIdx === state.pyramidCurrentRow;
              const labelColor =
                ROW_LABELS[rowIdx].startsWith("GIVE") ? Colors.green : Colors.red;

              const cardRow = (
                <View
                  style={[
                    styles.row,
                    isActiveRow && !allRevealed && styles.activeRow,
                  ]}
                >
                  {rowIndices.map((cardIdx) => (
                    <PyramidCard
                      key={cardIdx}
                      card={state.pyramidCards[cardIdx]}
                      revealed={state.pyramidRevealed[cardIdx]}
                      active={isActiveRow && !allRevealed}
                    />
                  ))}
                </View>
              );

              return (
                <View key={rowIdx} style={styles.rowContainer}>
                  <Text style={[styles.rowLabel, { color: labelColor }]}>
                    {ROW_LABELS[rowIdx]}
                  </Text>
                  {isActiveRow && !allRevealed ? (
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  pyramidContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  rowContainer: {
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  activeRow: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  rowLabel: {
    fontSize: 11,
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
