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
import { useTheme } from "../context/ThemeContext";

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
  const { colors } = useTheme();
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
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Drawn Cards</Text>
            <Pressable onPress={onClose} style={[styles.closeButton, { borderColor: colors.divider }]}>
              <Text style={[styles.closeText, { color: colors.textSecondary }]}>CLOSE</Text>
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
                  <Text style={[styles.playerName, { color: colors.textPrimary }]}>{player.name}</Text>
                  <View style={styles.cardsRow}>
                    {cards.map((card, cardIndex) => {
                      const suitSymbol = SUIT_SYMBOLS[card.suit];
                      const chipColor =
                        card.suit === "hearts" || card.suit === "diamonds"
                          ? colors.cardSuitRed
                          : colors.textPrimary;
                      return (
                        <View key={cardIndex} style={[styles.cardChip, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
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

          <View style={[styles.footer, { borderTopColor: colors.divider }]}>
            <Text style={[styles.footerTotal, { color: colors.textSecondary }]}>
              {totalDrawn} of 52 cards drawn
            </Text>
            <Text style={[styles.footerSuits, { color: colors.textPrimary }]}>
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
    justifyContent: "flex-end",
  },
  container: {
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
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  closeText: {
    fontSize: 13,
    fontWeight: "800",
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
    marginBottom: 10,
  },
  cardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cardChip: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
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
    gap: 4,
  },
  footerTotal: {
    fontSize: 14,
    fontWeight: "700",
  },
  footerSuits: {
    fontSize: 16,
    fontWeight: "700",
  },
});
