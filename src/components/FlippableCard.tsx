import React from "react";
import { View, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import CardFace from "./CardFace";
import CardBack from "./CardBack";
import { Card } from "../types";
import { useCardAnimation } from "../hooks/useCardAnimation";
import { useResponsive } from "../hooks/useResponsive";

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
  const { mainCard } = useResponsive();

  React.useEffect(() => {
    if (flipped) {
      flip();
    } else {
      reset();
    }
  }, [flipped, flip, reset]);

  return (
    <View style={[styles.container, { width: mainCard.width, height: mainCard.height }]}>
      {/* Back of card — visible initially */}
      <Animated.View style={[styles.cardWrapper, { width: mainCard.width, height: mainCard.height }, backAnimatedStyle]}>
        <CardBack width={mainCard.width} height={mainCard.height} />
      </Animated.View>

      {/* Front of card — visible after flip */}
      <Animated.View style={[styles.cardWrapper, { width: mainCard.width, height: mainCard.height }, frontAnimatedStyle]}>
        {card ? (
          <CardFace card={card} width={mainCard.width} height={mainCard.height} />
        ) : (
          <CardBack width={mainCard.width} height={mainCard.height} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardWrapper: {},
});
