import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Colors } from "../../constants/Colors";
import { lightHaptic } from "../utils/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ActionButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "smoke" | "fire" | "higher" | "lower" | "inside" | "outside" | "success" | "ghost" | "hearts" | "diamonds" | "clubs" | "spades";
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function ActionButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  style,
  textStyle,
}: ActionButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    lightHaptic();
    onPress();
  };

  const bgColor = {
    primary: Colors.red,
    smoke: Colors.surfaceLight,
    fire: Colors.red,
    higher: Colors.green,
    lower: Colors.surfaceLight,
    inside: Colors.green,
    outside: Colors.surfaceLight,
    success: Colors.green,
    ghost: "transparent",
    hearts: Colors.red,
    diamonds: Colors.red,
    clubs: Colors.surfaceLight,
    spades: Colors.surfaceLight,
  }[variant];

  const textColor = {
    primary: Colors.white,
    smoke: Colors.white,
    fire: Colors.white,
    higher: Colors.white,
    lower: Colors.white,
    inside: Colors.white,
    outside: Colors.white,
    success: Colors.white,
    ghost: Colors.textSecondary,
    hearts: Colors.white,
    diamonds: Colors.white,
    clubs: Colors.white,
    spades: Colors.white,
  }[variant];

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.button,
        { backgroundColor: bgColor },
        variant === "ghost" && styles.ghostBorder,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      <Text
        style={[styles.text, { color: textColor }, disabled && styles.disabledText, textStyle]}
      >
        {title}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  text: {
    fontSize: 18,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  ghostBorder: {
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
  },
  disabled: {
    opacity: 0.4,
  },
  disabledText: {
    opacity: 0.6,
  },
});
