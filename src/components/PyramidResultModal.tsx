import React from "react";
import { View, Text, Modal, Pressable, StyleSheet, ScrollView } from "react-native";
import { PyramidRevealResult } from "../types";
import { SUIT_SYMBOLS } from "../../constants/Cards";
import { Colors } from "../../constants/Colors";
import { useResponsive } from "../hooks/useResponsive";

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
  const { fs, sw, sh, s } = useResponsive();

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
        <View style={[styles.content, { paddingHorizontal: sw(24), paddingTop: sh(28), paddingBottom: sh(40) }]}>
          {/* Card header — show all cards from the row */}
          <View style={[styles.cardRow, { gap: s(16) }]}>
            {results.map((r, i) => {
              const symbol = SUIT_SYMBOLS[r.card.suit];
              const color = r.card.color === "red" ? Colors.red : Colors.white;
              return (
                <Text key={i} style={[styles.cardDisplay, { color, fontSize: fs(48) }]}>
                  {r.card.value}{symbol}
                </Text>
              );
            })}
          </View>

          {/* Action badge */}
          <View
            style={[
              styles.actionBadge,
              {
                backgroundColor: actionColor,
                paddingHorizontal: sw(20),
                paddingVertical: sh(8),
              },
            ]}
          >
            <Text style={[styles.actionText, { fontSize: fs(18) }]}>{actionLabel}</Text>
          </View>

          {/* Match list */}
          {aggregatedMatches.length > 0 ? (
            <ScrollView style={styles.matchList} showsVerticalScrollIndicator={false}>
              {aggregatedMatches.map((entry, index) => (
                <View key={index} style={[styles.matchRow, { paddingHorizontal: sw(16), paddingVertical: sh(12) }]}>
                  <Text style={[styles.matchName, { fontSize: fs(17) }]}>{entry.playerName}</Text>
                  <View style={styles.matchRight}>
                    <Text style={[styles.matchDrinks, { color: actionColor, fontSize: fs(16) }]}>
                      {entry.totalDrinks} {entry.totalDrinks === 1 ? "drink" : "drinks"}
                    </Text>
                    {entry.matchCount > 1 && (
                      <Text style={[styles.doubleTag, { fontSize: fs(13) }]}>({entry.matchCount}x)</Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={[styles.noMatches, { fontSize: fs(17) }]}>No matches</Text>
          )}

          {/* Continue button */}
          <Pressable
            style={[styles.continueButton, { paddingHorizontal: sw(32), paddingVertical: sh(14) }]}
            onPress={onClose}
          >
            <Text style={[styles.continueText, { fontSize: fs(16) }]}>CONTINUE</Text>
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
    alignItems: "center",
    maxHeight: "60%",
  },
  cardRow: {
    flexDirection: "row",
  },
  cardDisplay: {
    fontWeight: "900",
  },
  actionBadge: {
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 20,
  },
  actionText: {
    color: Colors.white,
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
    marginBottom: 8,
  },
  matchName: {
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  matchRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  matchDrinks: {
    fontWeight: "800",
  },
  doubleTag: {
    color: Colors.textSecondary,
    fontWeight: "700",
  },
  noMatches: {
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  continueButton: {
    marginTop: 16,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
  },
  continueText: {
    color: Colors.white,
    fontWeight: "800",
    letterSpacing: 2,
  },
});
