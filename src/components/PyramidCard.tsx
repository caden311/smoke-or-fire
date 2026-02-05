import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { Card } from "../types";
import { useCardAnimation } from "../hooks/useCardAnimation";
import { SUIT_SYMBOLS } from "../../constants/Cards";
import { Colors } from "../../constants/Colors";

interface PyramidCardProps {
  card: Card;
  revealed: boolean;
  active: boolean;
}

export default function PyramidCard({
  card,
  revealed,
  active,
}: PyramidCardProps) {
  const { flip, reset, frontAnimatedStyle, backAnimatedStyle } =
    useCardAnimation();

  React.useEffect(() => {
    if (revealed) {
      flip();
    } else {
      reset();
    }
  }, [revealed, flip, reset]);

  const suitSymbol = SUIT_SYMBOLS[card.suit];
  const suitColor = card.color === "red" ? Colors.red : "#333333";

  return (
    <View
      style={[
        styles.container,
        !active && !revealed && styles.dimmed,
      ]}
    >
      {/* Back of card */}
      <Animated.View style={[styles.cardWrapper, backAnimatedStyle]}>
        <View style={styles.back}>
          <View style={styles.backInner}>
            <View style={styles.backDiamond} />
          </View>
        </View>
      </Animated.View>

      {/* Front of card */}
      <Animated.View style={[styles.cardWrapper, frontAnimatedStyle]}>
        <View style={styles.face}>
          <Text style={[styles.faceValue, { color: suitColor }]}>
            {card.value}
          </Text>
          <Text style={[styles.faceSuit, { color: suitColor }]}>
            {suitSymbol}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const CARD_WIDTH = 80;
const CARD_HEIGHT = 116;

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  dimmed: {
    opacity: 0.5,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  back: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: Colors.cardBack,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1.5,
    borderColor: Colors.cardBackAccent,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  backInner: {
    flex: 1,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.cardBackAccent,
    alignItems: "center",
    justifyContent: "center",
  },
  backDiamond: {
    width: 14,
    height: 14,
    backgroundColor: Colors.cardBackAccent,
    transform: [{ rotate: "45deg" }],
  },
  face: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: Colors.cardFace,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  faceValue: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 28,
  },
  faceSuit: {
    fontSize: 20,
    lineHeight: 24,
  },
});
