import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Player } from "../types";
import { Colors } from "../../constants/Colors";
import { lightHaptic } from "../utils/haptics";

interface PlayerListProps {
  players: Player[];
  onRemove: (id: string) => void;
}

export default function PlayerList({ players, onRemove }: PlayerListProps) {
  if (players.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Add at least 2 players to start</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
      {players.map((player, index) => (
        <View key={player.id} style={styles.playerRow}>
          <View style={styles.playerInfo}>
            <Text style={styles.playerNumber}>{index + 1}</Text>
            <Text style={styles.playerName}>{player.name}</Text>
          </View>
          <Pressable
            style={styles.removeButton}
            onPress={() => {
              lightHaptic();
              onRemove(player.id);
            }}
          >
            <Text style={styles.removeText}>✕</Text>
          </Pressable>
        </View>
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
    color: Colors.textSecondary,
    fontSize: 16,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
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
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    width: 24,
  },
  playerName: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "600",
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
});
