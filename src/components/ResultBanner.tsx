import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { Colors } from "../../constants/Colors";
import { Guess, Card } from "../types";
import { SUIT_SYMBOLS } from "../../constants/Cards";

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
        { backgroundColor: correct ? Colors.green : Colors.red },
      ]}
    >
      <Animated.Text
        entering={FadeInUp.delay(200).duration(300)}
        style={styles.resultText}
      >
        {correct ? "CORRECT!" : "WRONG!"}
      </Animated.Text>
      <Text style={styles.actionText}>
        {correct ? "Give a drink to someone!" : "Take a drink!"}
      </Text>
      <Text style={styles.detailText}>
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
    padding: 20,
    alignItems: "center",
    gap: 8,
    marginTop: 20,
  },
  resultText: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.white,
    letterSpacing: 3,
  },
  actionText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
  },
  detailText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
});
