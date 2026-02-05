import React from "react";
import { View, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import CardFace from "./CardFace";
import CardBack from "./CardBack";
import { Card } from "../types";
import { useCardAnimation } from "../hooks/useCardAnimation";

interface FlippableCardProps {
  card: Card | null;
  flipped: boolean;
  onFlipComplete?: () => void;
}

export default function FlippableCard({
  card,
  flipped,
}: FlippableCardProps) {
  const { flip, reset, frontAnimatedStyle, backAnimatedStyle } =
    useCardAnimation();

  React.useEffect(() => {
    if (flipped) {
      flip();
    } else {
      reset();
    }
  }, [flipped, flip, reset]);

  return (
    <View style={styles.container}>
      {/* Back of card — visible initially */}
      <Animated.View style={[styles.cardWrapper, backAnimatedStyle]}>
        <CardBack />
      </Animated.View>

      {/* Front of card — visible after flip */}
      <Animated.View style={[styles.cardWrapper, frontAnimatedStyle]}>
        {card ? <CardFace card={card} /> : <CardBack />}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 136,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  cardWrapper: {
    width: 136,
    height: 220,
  },
});
