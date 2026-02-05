import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { Colors } from "../../constants/Colors";
import { Guess, Card } from "../types";
import { SUIT_SYMBOLS } from "../../constants/Cards";
import { useResponsive } from "../hooks/useResponsive";

interface ResultBannerProps {
  correct: boolean;
  guess: Guess;
  card: Card;
}

export default function ResultBanner({
  correct,
  guess,
  card,
}: ResultBannerProps) {
  const { fs, s } = useResponsive();
  const suitSymbol = SUIT_SYMBOLS[card.suit];
  const guessLabels: Record<Guess, string> = {
    smoke: "Smoke (Black)",
    fire: "Fire (Red)",
    higher: "Higher",
    lower: "Lower",
    inside: "Inside",
    outside: "Outside",
    hearts: "Hearts \u2665",
    diamonds: "Diamonds \u2666",
    clubs: "Clubs \u2663",
    spades: "Spades \u2660",
  };
  const guessLabel = guessLabels[guess];
  const cardLabel = `${card.value}${suitSymbol}`;

  return (
    <Animated.View
      entering={FadeInDown.duration(400).springify()}
      style={[
        styles.container,
        {
          backgroundColor: correct ? Colors.green : Colors.red,
          padding: s(20),
          marginTop: s(20),
        },
      ]}
    >
      <Animated.Text
        entering={FadeInUp.delay(200).duration(300)}
        style={[styles.resultText, { fontSize: fs(28) }]}
      >
        {correct ? "CORRECT!" : "WRONG!"}
      </Animated.Text>
      <Text style={[styles.actionText, { fontSize: fs(18) }]}>
        {correct ? "Give a drink to someone!" : "Take a drink!"}
      </Text>
      <Text style={[styles.detailText, { fontSize: fs(13) }]}>
        You guessed {guessLabel} — Card was {cardLabel}
        {(guess === "smoke" || guess === "fire") &&
          ` (${card.color === "red" ? "Fire" : "Smoke"})`}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
  },
  resultText: {
    fontWeight: "900",
    color: Colors.white,
    letterSpacing: 3,
  },
  actionText: {
    fontWeight: "700",
    color: Colors.white,
  },
  detailText: {
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
});
