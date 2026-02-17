import React, { useState, useMemo } from "react";
import { View, Text, Modal, Pressable, StyleSheet, ScrollView } from "react-native";
import { Player, DrinkAssignment } from "../types";
import { useTheme } from "../context/ThemeContext";
import { useResponsive } from "../hooks/useResponsive";
import { mediumHaptic } from "../utils/haptics";

interface GiveDrinksModalProps {
  visible: boolean;
  totalDrinks: number;
  currentPlayer: Player;
  otherPlayers: Player[];
  roundNumber: number;
  onConfirm: (assignments: DrinkAssignment[]) => void;
  onSkip: () => void;
  allowSkip?: boolean;
}

export default function GiveDrinksModal({
  visible,
  totalDrinks,
  currentPlayer,
  otherPlayers,
  roundNumber,
  onConfirm,
  onSkip,
  allowSkip = true,
}: GiveDrinksModalProps) {
  const { fs, sw, sh, s } = useResponsive();
  const { colors } = useTheme();

  // Track drinks assigned to each player by their ID
  const [assignments, setAssignments] = useState<Record<string, number>>({});

  // Reset assignments when modal opens
  React.useEffect(() => {
    if (visible) {
      setAssignments({});
    }
  }, [visible]);

  const totalAssigned = useMemo(() => {
    return Object.values(assignments).reduce((sum, val) => sum + val, 0);
  }, [assignments]);

  const remaining = totalDrinks - totalAssigned;

  const handleIncrement = (playerId: string) => {
    if (remaining <= 0) return;
    mediumHaptic();
    setAssignments(prev => ({
      ...prev,
      [playerId]: (prev[playerId] || 0) + 1,
    }));
  };

  const handleDecrement = (playerId: string) => {
    if (!assignments[playerId] || assignments[playerId] <= 0) return;
    mediumHaptic();
    setAssignments(prev => ({
      ...prev,
      [playerId]: prev[playerId] - 1,
    }));
  };

  const handleConfirm = () => {
    const timestamp = Date.now();
    const drinkAssignments: DrinkAssignment[] = otherPlayers
      .filter(player => assignments[player.id] && assignments[player.id] > 0)
      .map(player => ({
        id: `${currentPlayer.id}-${player.id}-${timestamp}`,
        fromPlayerId: currentPlayer.id,
        fromPlayerName: currentPlayer.name,
        toPlayerId: player.id,
        toPlayerName: player.name,
        amount: assignments[player.id],
        timestamp,
        roundNumber,
      }));

    onConfirm(drinkAssignments);
  };

  const canConfirm = totalAssigned === totalDrinks;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onSkip}
    >
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.content, { paddingHorizontal: sw(24), paddingTop: sh(28), paddingBottom: sh(40), backgroundColor: colors.surface }]}>
          {/* Header */}
          <Text style={[styles.title, { fontSize: fs(24), color: colors.textPrimary }]}>Give Drinks</Text>
          <Text style={[styles.subtitle, { fontSize: fs(16), marginTop: sh(8), color: colors.textSecondary }]}>
            You won! Assign {totalDrinks} {totalDrinks === 1 ? "drink" : "drinks"}
          </Text>

          {/* Remaining counter */}
          <View style={[styles.remainingBadge, {
            backgroundColor: remaining === 0 ? colors.success : colors.surfaceLight,
            paddingHorizontal: sw(16),
            paddingVertical: sh(8),
            marginTop: sh(16),
          }]}>
            <Text style={[styles.remainingText, { fontSize: fs(14) }]}>
              {remaining === 0 ? "All drinks assigned!" : `${remaining} remaining`}
            </Text>
          </View>

          {/* Player list */}
          <ScrollView style={styles.playerList} showsVerticalScrollIndicator={false}>
            {otherPlayers.map((player) => {
              const count = assignments[player.id] || 0;
              return (
                <View key={player.id} style={[styles.playerRow, { paddingHorizontal: sw(16), paddingVertical: sh(14), backgroundColor: colors.surfaceLight }]}>
                  <Text style={[styles.playerName, { fontSize: fs(17), color: colors.textPrimary }]}>{player.name}</Text>
                  <View style={styles.stepperContainer}>
                    <Pressable
                      style={[
                        styles.stepperButton,
                        { backgroundColor: colors.surface },
                        count === 0 && styles.stepperButtonDisabled,
                      ]}
                      onPress={() => handleDecrement(player.id)}
                      disabled={count === 0}
                    >
                      <Text style={[styles.stepperButtonText, { fontSize: fs(20), color: colors.textPrimary }]}>-</Text>
                    </Pressable>
                    <Text style={[styles.countText, { fontSize: fs(18), minWidth: sw(32), color: colors.textPrimary }]}>{count}</Text>
                    <Pressable
                      style={[
                        styles.stepperButton,
                        { backgroundColor: colors.surface },
                        remaining === 0 && styles.stepperButtonDisabled,
                      ]}
                      onPress={() => handleIncrement(player.id)}
                      disabled={remaining === 0}
                    >
                      <Text style={[styles.stepperButtonText, { fontSize: fs(20), color: colors.textPrimary }]}>+</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Buttons */}
          <View style={[styles.buttonRow, { gap: s(12), marginTop: sh(20) }]}>
            {allowSkip && (
              <Pressable
                style={[styles.skipButton, { paddingHorizontal: sw(24), paddingVertical: sh(14), backgroundColor: colors.surfaceLight }]}
                onPress={onSkip}
              >
                <Text style={[styles.skipButtonText, { fontSize: fs(16), color: colors.textSecondary }]}>SKIP</Text>
              </Pressable>
            )}
            <Pressable
              style={[
                styles.confirmButton,
                { backgroundColor: colors.success },
                !canConfirm && styles.confirmButtonDisabled,
                { paddingHorizontal: sw(32), paddingVertical: sh(14) }
              ]}
              onPress={handleConfirm}
              disabled={!canConfirm}
            >
              <Text style={[styles.confirmButtonText, { fontSize: fs(16) }]}>CONFIRM</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    alignItems: "center",
    maxHeight: "70%",
  },
  title: {
    fontWeight: "900",
  },
  subtitle: {
    textAlign: "center",
  },
  remainingBadge: {
    borderRadius: 12,
  },
  remainingText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  playerList: {
    width: "100%",
    maxHeight: 280,
    marginTop: 16,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    marginBottom: 8,
  },
  playerName: {
    fontWeight: "700",
    flex: 1,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonDisabled: {
    opacity: 0.3,
  },
  stepperButtonText: {
    fontWeight: "800",
  },
  countText: {
    fontWeight: "800",
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  skipButton: {
    borderRadius: 12,
  },
  skipButtonText: {
    fontWeight: "800",
    letterSpacing: 2,
  },
  confirmButton: {
    borderRadius: 12,
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: 2,
  },
});
