import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useTheme, ThemeMode } from "../context/ThemeContext";
import { useResponsive } from "../hooks/useResponsive";
import { lightHaptic } from "../utils/haptics";

const OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function ThemeSelector() {
  const { mode, setMode, colors } = useTheme();
  const { fs } = useResponsive();
  const [containerWidth, setContainerWidth] = useState(0);

  const selectedIndex = OPTIONS.findIndex((opt) => opt.value === mode);
  const indicatorPosition = useSharedValue(0);

  const optionWidth = containerWidth > 0 ? (containerWidth - 8) / OPTIONS.length : 0;

  React.useEffect(() => {
    if (containerWidth > 0) {
      indicatorPosition.value = withSpring(selectedIndex * optionWidth, {
        damping: 15,
        stiffness: 150,
      });
    }
  }, [selectedIndex, optionWidth, containerWidth, indicatorPosition]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorPosition.value }],
    };
  });

  const handleSelect = (value: ThemeMode) => {
    lightHaptic();
    setMode(value);
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface }]}
      onLayout={handleLayout}
    >
      {/* Animated indicator */}
      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: optionWidth,
              backgroundColor: colors.fire,
            },
            animatedIndicatorStyle,
          ]}
        />
      )}

      {/* Options */}
      {OPTIONS.map((option) => (
        <Pressable
          key={option.value}
          style={styles.option}
          onPress={() => handleSelect(option.value)}
        >
          <Text
            style={[
              styles.optionText,
              {
                fontSize: fs(14),
                color: mode === option.value ? "#FFFFFF" : colors.textSecondary,
              },
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    position: "relative",
    overflow: "hidden",
  },
  indicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 8,
  },
  option: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  optionText: {
    fontWeight: "700",
  },
});
