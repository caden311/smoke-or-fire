import React, { useState } from "react";
import { View, TextInput, Pressable, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { lightHaptic } from "../utils/haptics";

interface PlayerInputProps {
  onAdd: (name: string) => void;
}

export default function PlayerInput({ onAdd }: PlayerInputProps) {
  const [name, setName] = useState("");
  const { colors } = useTheme();

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    lightHaptic();
    onAdd(trimmed);
    setName("");
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            color: colors.textPrimary,
            borderColor: colors.divider,
          },
        ]}
        value={name}
        onChangeText={setName}
        placeholder="Enter name"
        placeholderTextColor={colors.textMuted}
        onSubmitEditing={handleAdd}
        returnKeyType="done"
        autoCapitalize="words"
        maxLength={20}
      />
      <Pressable
        style={[
          styles.addButton,
          { backgroundColor: colors.fire },
          !name.trim() && styles.addButtonDisabled,
        ]}
        onPress={handleAdd}
        disabled={!name.trim()}
      >
        <Text style={styles.addButtonText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
});
