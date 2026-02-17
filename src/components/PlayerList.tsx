import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { Player } from "../types";
import { useTheme } from "../context/ThemeContext";
import { lightHaptic } from "../utils/haptics";

interface PlayerListProps {
  players: Player[];
  onRemove: (id: string) => void;
}

export default function PlayerList({ players, onRemove }: PlayerListProps) {
  const { colors } = useTheme();

  if (players.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Add at least 2 players to start</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
      {players.map((player, index) => (
        <Animated.View
          key={player.id}
          entering={FadeInRight.delay(index * 100).duration(300)}
          style={[styles.playerRow, { backgroundColor: colors.surface }]}
        >
          <View style={styles.playerInfo}>
            <Text style={[styles.playerNumber, { color: colors.textSecondary }]}>{index + 1}</Text>
            <Text style={[styles.playerName, { color: colors.textPrimary }]}>{player.name}</Text>
          </View>
          <Pressable
            style={[styles.removeButton, { backgroundColor: colors.surfaceLight }]}
            onPress={() => {
              lightHaptic();
              onRemove(player.id);
            }}
          >
            <Text style={[styles.removeText, { color: colors.textSecondary }]}>&#10005;</Text>
          </Pressable>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playerNumber: {
    fontSize: 14,
    fontWeight: "600",
    width: 24,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "600",
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
