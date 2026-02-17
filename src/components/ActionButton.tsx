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
import { useTheme } from "../context/ThemeContext";
import { lightHaptic } from "../utils/haptics";
import { useResponsive } from "../hooks/useResponsive";

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
  const { fs, sw, sh } = useResponsive();
  const { colors } = useTheme();

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
    primary: colors.fire,
    smoke: colors.buttonSecondary,
    fire: colors.fire,
    higher: colors.success,
    lower: colors.buttonSecondary,
    inside: colors.success,
    outside: colors.buttonSecondary,
    success: colors.success,
    ghost: "transparent",
    hearts: colors.fire,
    diamonds: colors.fire,
    clubs: colors.buttonSecondary,
    spades: colors.buttonSecondary,
  }[variant];

  const txtColor = {
    primary: "#FFFFFF",
    smoke: colors.textPrimary,
    fire: "#FFFFFF",
    higher: "#FFFFFF",
    lower: colors.textPrimary,
    inside: "#FFFFFF",
    outside: colors.textPrimary,
    success: "#FFFFFF",
    ghost: colors.textSecondary,
    hearts: "#FFFFFF",
    diamonds: "#FFFFFF",
    clubs: colors.textPrimary,
    spades: colors.textPrimary,
  }[variant];

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: bgColor,
          paddingVertical: sh(16),
          paddingHorizontal: sw(32),
          minWidth: sw(120),
        },
        variant === "ghost" && { borderWidth: 1, borderColor: colors.divider },
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: txtColor, fontSize: fs(18) },
          disabled && styles.disabledText,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  disabled: {
    opacity: 0.4,
  },
  disabledText: {
    opacity: 0.6,
  },
});
