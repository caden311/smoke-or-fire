import React from "react";
import { View, Text, Modal, Pressable, StyleSheet, ScrollView } from "react-native";
import { PyramidRevealResult } from "../types";
import { SUIT_SYMBOLS } from "../../constants/Cards";
import { Colors } from "../../constants/Colors";

interface PyramidResultModalProps {
  visible: boolean;
  results: PyramidRevealResult[];
  onClose: () => void;
}

export default function PyramidResultModal({
  visible,
  results,
  onClose,
}: PyramidResultModalProps) {
  if (results.length === 0) return null;

  const { action, amount } = results[0];
  const actionColor = action === "give" ? Colors.green : Colors.red;
  const actionLabel = `${action.toUpperCase()} ${amount}`;

  // Aggregate matches across all cards in the row: sum drinks per player
  const playerDrinkMap = new Map<string, { playerName: string; totalDrinks: number; matchCount: number }>();
  for (const result of results) {
    for (const match of result.matches) {
      const existing = playerDrinkMap.get(match.player.id);
      if (existing) {
        existing.totalDrinks += match.drinks;
        existing.matchCount += match.matchCount;
      } else {
        playerDrinkMap.set(match.player.id, {
          playerName: match.player.name,
          totalDrinks: match.drinks,
          matchCount: match.matchCount,
        });
      }
    }
  }
  const aggregatedMatches = Array.from(playerDrinkMap.values());

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.content}>
          {/* Card header — show all cards from the row */}
          <View style={styles.cardRow}>
            {results.map((r, i) => {
              const symbol = SUIT_SYMBOLS[r.card.suit];
              const color = r.card.color === "red" ? Colors.red : Colors.white;
              return (
                <Text key={i} style={[styles.cardDisplay, { color }]}>
                  {r.card.value}{symbol}
                </Text>
              );
            })}
          </View>

          {/* Action badge */}
          <View style={[styles.actionBadge, { backgroundColor: actionColor }]}>
            <Text style={styles.actionText}>{actionLabel}</Text>
          </View>

          {/* Match list */}
          {aggregatedMatches.length > 0 ? (
            <ScrollView style={styles.matchList} showsVerticalScrollIndicator={false}>
              {aggregatedMatches.map((entry, index) => (
                <View key={index} style={styles.matchRow}>
                  <Text style={styles.matchName}>{entry.playerName}</Text>
                  <View style={styles.matchRight}>
                    <Text style={[styles.matchDrinks, { color: actionColor }]}>
                      {entry.totalDrinks} {entry.totalDrinks === 1 ? "drink" : "drinks"}
                    </Text>
                    {entry.matchCount > 1 && (
                      <Text style={styles.doubleTag}>({entry.matchCount}x)</Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noMatches}>No matches</Text>
          )}

          {/* Continue button */}
          <Pressable style={styles.continueButton} onPress={onClose}>
            <Text style={styles.continueText}>CONTINUE</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    alignItems: "center",
    maxHeight: "60%",
  },
  cardRow: {
    flexDirection: "row",
    gap: 16,
  },
  cardDisplay: {
    fontSize: 48,
    fontWeight: "900",
  },
  actionBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 20,
  },
  actionText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 2,
  },
  matchList: {
    width: "100%",
    maxHeight: 200,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  matchName: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  matchRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  matchDrinks: {
    fontSize: 16,
    fontWeight: "800",
  },
  doubleTag: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "700",
  },
  noMatches: {
    fontSize: 17,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  continueButton: {
    marginTop: 16,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  continueText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2,
  },
});
