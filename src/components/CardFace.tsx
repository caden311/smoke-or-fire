import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "../types";
import { SUIT_SYMBOLS } from "../../constants/Cards";
import { Colors } from "../../constants/Colors";

interface CardFaceProps {
  card: Card;
}

export default function CardFace({ card }: CardFaceProps) {
  const suitSymbol = SUIT_SYMBOLS[card.suit];
  const suitColor = card.color === "red" ? Colors.red : "#333333";

  return (
    <View style={styles.card}>
      <View style={styles.cornerTopLeft}>
        <Text style={[styles.cornerValue, { color: suitColor }]}>
          {card.value}
        </Text>
        <Text style={[styles.cornerSuit, { color: suitColor }]}>
          {suitSymbol}
        </Text>
      </View>

      <Text style={[styles.centerSuit, { color: suitColor }]}>
        {suitSymbol}
      </Text>

      <View style={styles.cornerBottomRight}>
        <Text style={[styles.cornerSuit, { color: suitColor }]}>
          {suitSymbol}
        </Text>
        <Text style={[styles.cornerValue, { color: suitColor }]}>
          {card.value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 180,
    height: 260,
    backgroundColor: Colors.cardFace,
    borderRadius: 16,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cornerTopLeft: {
    position: "absolute",
    top: 10,
    left: 12,
    alignItems: "center",
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: 10,
    right: 12,
    alignItems: "center",
    transform: [{ rotate: "180deg" }],
  },
  cornerValue: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 22,
  },
  cornerSuit: {
    fontSize: 16,
    lineHeight: 18,
  },
  centerSuit: {
    fontSize: 64,
  },
});
