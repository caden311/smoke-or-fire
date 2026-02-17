import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

interface CardBackProps {
  width?: number;
  height?: number;
}

export default function CardBack({ width = 136, height = 220 }: CardBackProps) {
  const { colors } = useTheme();
  const ratio = width / 136;

  return (
    <View
      style={[
        styles.card,
        {
          width,
          height,
          borderRadius: Math.round(16 * ratio),
          padding: Math.round(8 * ratio),
          backgroundColor: colors.cardBack,
          borderColor: colors.cardBackAccent,
        },
      ]}
    >
      <View
        style={[
          styles.innerBorder,
          {
            borderRadius: Math.round(10 * ratio),
            padding: Math.round(8 * ratio),
            borderColor: colors.cardBackAccent,
          },
        ]}
      >
        <View style={[styles.pattern, { gap: Math.round(8 * ratio) }]}>
          <View
            style={[
              styles.diamond,
              {
                width: Math.round(20 * ratio),
                height: Math.round(20 * ratio),
                backgroundColor: colors.cardBackAccent,
              },
            ]}
          />
          <View style={[styles.diamondRow, { gap: Math.round(24 * ratio) }]}>
            <View
              style={[
                styles.diamondSmall,
                {
                  width: Math.round(14 * ratio),
                  height: Math.round(14 * ratio),
                  backgroundColor: colors.cardBackAccent,
                },
              ]}
            />
            <View
              style={[
                styles.diamondSmall,
                {
                  width: Math.round(14 * ratio),
                  height: Math.round(14 * ratio),
                  backgroundColor: colors.cardBackAccent,
                },
              ]}
            />
          </View>
          <View
            style={[
              styles.diamond,
              {
                width: Math.round(20 * ratio),
                height: Math.round(20 * ratio),
                backgroundColor: colors.cardBackAccent,
              },
            ]}
          />
          <View style={[styles.diamondRow, { gap: Math.round(24 * ratio) }]}>
            <View
              style={[
                styles.diamondSmall,
                {
                  width: Math.round(14 * ratio),
                  height: Math.round(14 * ratio),
                  backgroundColor: colors.cardBackAccent,
                },
              ]}
            />
            <View
              style={[
                styles.diamondSmall,
                {
                  width: Math.round(14 * ratio),
                  height: Math.round(14 * ratio),
                  backgroundColor: colors.cardBackAccent,
                },
              ]}
            />
          </View>
          <View
            style={[
              styles.diamond,
              {
                width: Math.round(20 * ratio),
                height: Math.round(20 * ratio),
                backgroundColor: colors.cardBackAccent,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  innerBorder: {
    flex: 1,
    borderWidth: 2,
  },
  pattern: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  diamond: {
    transform: [{ rotate: "45deg" }],
  },
  diamondRow: {
    flexDirection: "row",
  },
  diamondSmall: {
    transform: [{ rotate: "45deg" }],
  },
});
