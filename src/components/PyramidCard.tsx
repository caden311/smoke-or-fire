import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Card, PyramidMatch } from "../types";
import { useCardAnimation } from "../hooks/useCardAnimation";
import { SUIT_SYMBOLS } from "../../constants/Cards";
import { useTheme } from "../context/ThemeContext";
import { useResponsive } from "../hooks/useResponsive";

interface PyramidCardProps {
  card: Card;
  revealed: boolean;
  active: boolean;
  matches?: PyramidMatch[];
  action?: "give" | "take";
}

export default function PyramidCard({
  card,
  revealed,
  active,
  matches = [],
  action = "give",
}: PyramidCardProps) {
  const { flip, reset, frontAnimatedStyle, backAnimatedStyle } =
    useCardAnimation();
  const { pyramidCard } = useResponsive();
  const { colors } = useTheme();

  const cardWidth = pyramidCard.width;
  const cardHeight = pyramidCard.height;
  const ratio = cardWidth / 80;

  // Font size for match names (scales with card size)
  const matchFontSize = Math.round(10 * ratio);
  const matchColor = action === "give" ? colors.success : colors.fire;

  React.useEffect(() => {
    if (revealed) {
      flip();
    } else {
      reset();
    }
  }, [revealed, flip, reset]);

  const suitSymbol = SUIT_SYMBOLS[card.suit];
  const suitColor = card.color === "red" ? colors.cardSuitRed : colors.cardSuitBlack;

  return (
    <View
      style={[
        styles.container,
        !active && !revealed && styles.dimmed,
      ]}
    >
      {/* Card wrapper */}
      <View style={{ width: cardWidth, height: cardHeight, alignItems: "center", justifyContent: "center" }}>
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
                backgroundColor: colors.cardBack,
                borderColor: colors.cardBackAccent,
              },
            ]}
          >
            <View
              style={[
                styles.backInner,
                { borderRadius: Math.round(7 * ratio), borderColor: colors.cardBackAccent },
              ]}
            >
              <View
                style={[
                  styles.backDiamond,
                  {
                    width: Math.round(14 * ratio),
                    height: Math.round(14 * ratio),
                    backgroundColor: colors.cardBackAccent,
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
                backgroundColor: colors.cardFace,
                borderColor: colors.cardFaceBorder,
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

      {/* Inline match display */}
      {revealed && matches.length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(300).duration(300)}
          style={[styles.matchesContainer, { maxWidth: cardWidth + 20 }]}
        >
          {matches.slice(0, 3).map((match, idx) => (
            <Text
              key={`${match.player.id}-${idx}`}
              style={[
                styles.matchText,
                { fontSize: matchFontSize, color: matchColor },
              ]}
              numberOfLines={1}
            >
              {match.player.name}{match.matchCount > 1 ? ` (${match.matchCount}x)` : ""}
            </Text>
          ))}
          {matches.length > 3 && (
            <Text
              style={[
                styles.matchText,
                { fontSize: matchFontSize, color: colors.textSecondary },
              ]}
            >
              +{matches.length - 3} more
            </Text>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  dimmed: {
    opacity: 0.5,
  },
  matchesContainer: {
    marginTop: 4,
    alignItems: "center",
  },
  matchText: {
    fontWeight: "600",
    textAlign: "center",
  },
  back: {
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  backInner: {
    flex: 1,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  backDiamond: {
    transform: [{ rotate: "45deg" }],
  },
  face: {
    borderWidth: 1.5,
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
