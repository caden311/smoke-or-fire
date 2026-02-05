import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors } from "../../constants/Colors";

export default function CardBack() {
  return (
    <View style={styles.card}>
      <View style={styles.innerBorder}>
        <View style={styles.pattern}>
          {/* Decorative diamond pattern */}
          <View style={styles.diamond} />
          <View style={styles.diamondRow}>
            <View style={styles.diamondSmall} />
            <View style={styles.diamondSmall} />
          </View>
          <View style={styles.diamond} />
          <View style={styles.diamondRow}>
            <View style={styles.diamondSmall} />
            <View style={styles.diamondSmall} />
          </View>
          <View style={styles.diamond} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 180,
    height: 260,
    backgroundColor: Colors.cardBack,
    borderRadius: 16,
    padding: 8,
    borderWidth: 2,
    borderColor: Colors.cardBackAccent,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  innerBorder: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.cardBackAccent,
    padding: 8,
  },
  pattern: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  diamond: {
    width: 20,
    height: 20,
    backgroundColor: Colors.cardBackAccent,
    transform: [{ rotate: "45deg" }],
  },
  diamondRow: {
    flexDirection: "row",
    gap: 24,
  },
  diamondSmall: {
    width: 14,
    height: 14,
    backgroundColor: Colors.cardBackAccent,
    transform: [{ rotate: "45deg" }],
  },
});
