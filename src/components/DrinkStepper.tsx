import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Colors } from "../../constants/Colors";
import { useResponsive } from "../hooks/useResponsive";
import { lightHaptic } from "../utils/haptics";

interface DrinkStepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function DrinkStepper({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
}: DrinkStepperProps) {
  const { fs, sw, sh } = useResponsive();

  const handleDecrement = () => {
    if (value > min) {
      lightHaptic();
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      lightHaptic();
      onChange(value + 1);
    }
  };

  return (
    <View style={[styles.container, { paddingHorizontal: sw(16), paddingVertical: sh(14) }]}>
      <Text style={[styles.label, { fontSize: fs(16) }]}>{label}</Text>
      <View style={styles.stepperContainer}>
        <Pressable
          style={[styles.stepperButton, value <= min && styles.stepperButtonDisabled]}
          onPress={handleDecrement}
          disabled={value <= min}
        >
          <Text style={[styles.stepperButtonText, { fontSize: fs(20) }]}>-</Text>
        </Pressable>
        <Text style={[styles.valueText, { fontSize: fs(18), minWidth: sw(40) }]}>{value}</Text>
        <Pressable
          style={[styles.stepperButton, value >= max && styles.stepperButtonDisabled]}
          onPress={handleIncrement}
          disabled={value >= max}
        >
          <Text style={[styles.stepperButtonText, { fontSize: fs(20) }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  label: {
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonDisabled: {
    opacity: 0.3,
  },
  stepperButtonText: {
    color: Colors.white,
    fontWeight: "800",
  },
  valueText: {
    color: Colors.white,
    fontWeight: "800",
    textAlign: "center",
  },
});
