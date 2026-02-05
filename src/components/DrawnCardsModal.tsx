import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { Card, Player } from "../types";
import { SUIT_SYMBOLS } from "../../constants/Cards";
import { Colors } from "../../constants/Colors";

interface DrawnCardsModalProps {
  visible: boolean;
  onClose: () => void;
  playerCards: Card[][];
  players: Player[];
}

export default function DrawnCardsModal({
  visible,
  onClose,
  playerCards,
  players,
}: DrawnCardsModalProps) {
  const allCards = playerCards.flat();
  const totalDrawn = allCards.length;

  const suitCounts = {
    hearts: allCards.filter((c) => c.suit === "hearts").length,
    diamonds: allCards.filter((c) => c.suit === "diamonds").length,
    clubs: allCards.filter((c) => c.suit === "clubs").length,
    spades: allCards.filter((c) => c.suit === "spades").length,
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Drawn Cards</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>CLOSE</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {players.map((player, playerIndex) => {
              const cards = playerCards[playerIndex] ?? [];
              if (cards.length === 0) return null;
              return (
                <View key={player.id} style={styles.playerSection}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <View style={styles.cardsRow}>
                    {cards.map((card, cardIndex) => {
                      const suitSymbol = SUIT_SYMBOLS[card.suit];
                      const chipColor =
                        card.suit === "hearts" || card.suit === "diamonds"
                          ? Colors.red
                          : Colors.white;
                      return (
                        <View key={cardIndex} style={styles.cardChip}>
                          <Text style={[styles.chipText, { color: chipColor }]}>
                            {card.value}{suitSymbol}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerTotal}>
              {totalDrawn} of 52 cards drawn
            </Text>
            <Text style={styles.footerSuits}>
              {SUIT_SYMBOLS.hearts} {suitCounts.hearts}{"  "}
              {SUIT_SYMBOLS.diamonds} {suitCounts.diamonds}{"  "}
              {SUIT_SYMBOLS.clubs} {suitCounts.clubs}{"  "}
              {SUIT_SYMBOLS.spades} {suitCounts.spades}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceLight,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
  },
  closeText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  scrollView: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  playerSection: {
    marginTop: 20,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  cardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cardChip: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
  },
  chipText: {
    fontSize: 16,
    fontWeight: "800",
  },
  footer: {
    alignItems: "center",
    paddingTop: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceLight,
    gap: 4,
  },
  footerTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  footerSuits: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
});
