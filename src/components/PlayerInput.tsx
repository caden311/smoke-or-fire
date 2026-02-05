import React, { useState } from "react";
import { View, TextInput, Pressable, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/Colors";
import { lightHaptic } from "../utils/haptics";

interface PlayerInputProps {
  onAdd: (name: string) => void;
}

export default function PlayerInput({ onAdd }: PlayerInputProps) {
  const [name, setName] = useState("");

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
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter player name"
        placeholderTextColor={Colors.gray}
        onSubmitEditing={handleAdd}
        returnKeyType="done"
        autoCapitalize="words"
        maxLength={20}
      />
      <Pressable
        style={[styles.addButton, !name.trim() && styles.addButtonDisabled]}
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
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.red,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: "700",
  },
});
