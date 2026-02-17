import React from "react";
import { Text, StyleSheet } from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";
import { Guess, Card } from "../types";
import { SUIT_SYMBOLS } from "../../constants/Cards";
import { useResponsive } from "../hooks/useResponsive";

interface ResultBannerProps {
  correct: boolean;
  guess: Guess;
  card: Card;
  drinks: number;
}

export default function ResultBanner({
  correct,
  guess,
  card,
  drinks,
}: ResultBannerProps) {
  const { fs, s } = useResponsive();
  const { colors } = useTheme();
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
          backgroundColor: correct ? colors.success : colors.fire,
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
        {correct
          ? `Give ${drinks} drink${drinks !== 1 ? "s" : ""} to someone!`
          : `Take ${drinks} drink${drinks !== 1 ? "s" : ""}!`}
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
    color: "#FFFFFF",
    letterSpacing: 3,
  },
  actionText: {
    fontWeight: "700",
    color: "#FFFFFF",
  },
  detailText: {
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
});
