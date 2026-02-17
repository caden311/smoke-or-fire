import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "../types";
import { SUIT_SYMBOLS } from "../../constants/Cards";
import { useTheme } from "../context/ThemeContext";

interface CardFaceProps {
  card: Card;
  width?: number;
  height?: number;
}

export default function CardFace({ card, width = 136, height = 220 }: CardFaceProps) {
  const { colors } = useTheme();
  const suitSymbol = SUIT_SYMBOLS[card.suit];
  const suitColor = card.color === "red" ? colors.cardSuitRed : colors.cardSuitBlack;
  const ratio = width / 136;

  return (
    <View
      style={[
        styles.card,
        {
          width,
          height,
          borderRadius: Math.round(16 * ratio),
          padding: Math.round(12 * ratio),
          backgroundColor: colors.cardFace,
          borderColor: colors.cardFaceBorder,
        },
      ]}
    >
      <View
        style={[
          styles.cornerTopLeft,
          { top: Math.round(10 * ratio), left: Math.round(12 * ratio) },
        ]}
      >
        <Text
          style={[
            styles.cornerValue,
            { color: suitColor, fontSize: Math.round(20 * ratio), lineHeight: Math.round(22 * ratio) },
          ]}
        >
          {card.value}
        </Text>
        <Text
          style={[
            styles.cornerSuit,
            { color: suitColor, fontSize: Math.round(16 * ratio), lineHeight: Math.round(18 * ratio) },
          ]}
        >
          {suitSymbol}
        </Text>
      </View>

      <Text
        style={[
          styles.centerSuit,
          { color: suitColor, fontSize: Math.round(64 * ratio) },
        ]}
      >
        {suitSymbol}
      </Text>

      <View
        style={[
          styles.cornerBottomRight,
          { bottom: Math.round(10 * ratio), right: Math.round(12 * ratio) },
        ]}
      >
        <Text
          style={[
            styles.cornerSuit,
            { color: suitColor, fontSize: Math.round(16 * ratio), lineHeight: Math.round(18 * ratio) },
          ]}
        >
          {suitSymbol}
        </Text>
        <Text
          style={[
            styles.cornerValue,
            { color: suitColor, fontSize: Math.round(20 * ratio), lineHeight: Math.round(22 * ratio) },
          ]}
        >
          {card.value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cornerTopLeft: {
    position: "absolute",
    alignItems: "center",
  },
  cornerBottomRight: {
    position: "absolute",
    alignItems: "center",
    transform: [{ rotate: "180deg" }],
  },
  cornerValue: {
    fontWeight: "800",
  },
  cornerSuit: {},
  centerSuit: {},
});
