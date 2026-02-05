import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { Card } from "../types";
import { useCardAnimation } from "../hooks/useCardAnimation";
import { SUIT_SYMBOLS } from "../../constants/Cards";
import { Colors } from "../../constants/Colors";
import { useResponsive } from "../hooks/useResponsive";

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
  const { pyramidCard } = useResponsive();

  const cardWidth = pyramidCard.width;
  const cardHeight = pyramidCard.height;
  const ratio = cardWidth / 80;

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
        { width: cardWidth, height: cardHeight, alignItems: "center", justifyContent: "center" },
        !active && !revealed && styles.dimmed,
      ]}
    >
      {/* Back of card */}
      <Animated.View style={[{ width: cardWidth, height: cardHeight }, backAnimatedStyle]}>
        <View
          style={[
            styles.back,
            {
              width: cardWidth,
              height: cardHeight,
              borderRadius: Math.round(10 * ratio),
              padding: Math.round(4 * ratio),
            },
          ]}
        >
          <View
            style={[
              styles.backInner,
              { borderRadius: Math.round(7 * ratio) },
            ]}
          >
            <View
              style={[
                styles.backDiamond,
                {
                  width: Math.round(14 * ratio),
                  height: Math.round(14 * ratio),
                },
              ]}
            />
          </View>
        </View>
      </Animated.View>

      {/* Front of card */}
      <Animated.View style={[{ width: cardWidth, height: cardHeight }, frontAnimatedStyle]}>
        <View
          style={[
            styles.face,
            {
              width: cardWidth,
              height: cardHeight,
              borderRadius: Math.round(10 * ratio),
            },
          ]}
        >
          <Text
            style={[
              styles.faceValue,
              {
                color: suitColor,
                fontSize: Math.round(24 * ratio),
                lineHeight: Math.round(28 * ratio),
              },
            ]}
          >
            {card.value}
          </Text>
          <Text
            style={[
              styles.faceSuit,
              {
                color: suitColor,
                fontSize: Math.round(20 * ratio),
                lineHeight: Math.round(24 * ratio),
              },
            ]}
          >
            {suitSymbol}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  dimmed: {
    opacity: 0.5,
  },
  back: {
    backgroundColor: Colors.cardBack,
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
    borderWidth: 1.5,
    borderColor: Colors.cardBackAccent,
    alignItems: "center",
    justifyContent: "center",
  },
  backDiamond: {
    backgroundColor: Colors.cardBackAccent,
    transform: [{ rotate: "45deg" }],
  },
  face: {
    backgroundColor: Colors.cardFace,
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
    fontWeight: "800",
  },
  faceSuit: {},
});
