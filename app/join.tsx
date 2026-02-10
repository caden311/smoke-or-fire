import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMultiplayer } from "../src/context/MultiplayerContext";
import ActionButton from "../src/components/ActionButton";
import { Colors } from "../constants/Colors";
import { useResponsive } from "../src/hooks/useResponsive";

export default function JoinGame() {
  const { fs, sh, sw } = useResponsive();
  const { joinGame, isFirebaseReady } = useMultiplayer();
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { room } = useLocalSearchParams<{ room?: string }>();

  useEffect(() => {
    if (room && typeof room === "string") {
      const code = room.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
      if (code.length === 4) {
        setRoomCode(code);
      }
    }
  }, [room]);

  const handleJoin = async () => {
    const code = roomCode.trim().toUpperCase();
    const name = playerName.trim();

    if (!code || code.length !== 4) {
      setError("Enter a 4-letter room code");
      return;
    }
    if (!name) {
      setError("Enter your name");
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      await joinGame(code, name);
      router.replace("/host");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to join room";
      setError(message);
      setIsJoining(false);
    }
  };

  const handleBack = () => {
    router.replace("/");
  };

  const canJoin = roomCode.trim().length === 4 && playerName.trim().length > 0;

  if (!isFirebaseReady) {
    return (
      <LinearGradient
        colors={[Colors.background, "#1A0A0A"]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container}>
          <View style={[styles.content, { paddingHorizontal: sw(24) }]}>
            <View style={styles.errorContainer}>
              <Text style={[styles.errorTitle, { fontSize: fs(24) }]}>
                Multiplayer Not Available
              </Text>
              <Text style={[styles.errorText, { fontSize: fs(14) }]}>
                Firebase is not configured. Edit src/services/firebase.ts to enable
                multiplayer mode.
              </Text>
              <ActionButton
                title="Back"
                variant="ghost"
                onPress={handleBack}
                style={{ marginTop: sh(24) }}
              />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[Colors.background, "#1A0A0A"]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={{ paddingHorizontal: sw(24), flex: 1 }}>
            {/* Header */}
            <View style={[styles.header, { marginBottom: sh(32) }]}>
              <Text style={[styles.title, { fontSize: fs(32) }]}>
                Join Game
              </Text>
              <Text style={[styles.subtitle, { fontSize: fs(14) }]}>
                Enter the room code shared by the host
              </Text>
            </View>

            {/* Room Code Input */}
            <View style={[styles.inputSection, { marginBottom: sh(24) }]}>
              <Text style={[styles.inputLabel, { fontSize: fs(14) }]}>
                Room Code
              </Text>
              <TextInput
                style={[styles.codeInput, { fontSize: fs(32) }]}
                value={roomCode}
                onChangeText={(text) => {
                  setRoomCode(text.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4));
                  setError(null);
                }}
                placeholder="ABCD"
                placeholderTextColor={Colors.gray}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={4}
              />
            </View>

            {/* Player Name Input */}
            <View style={[styles.inputSection, { marginBottom: sh(24) }]}>
              <Text style={[styles.inputLabel, { fontSize: fs(14) }]}>
                Your Name
              </Text>
              <TextInput
                style={[styles.nameInput, { fontSize: fs(18) }]}
                value={playerName}
                onChangeText={(text) => {
                  setPlayerName(text);
                  setError(null);
                }}
                placeholder="Enter your name"
                placeholderTextColor={Colors.gray}
                autoCapitalize="words"
                maxLength={20}
                onSubmitEditing={handleJoin}
                returnKeyType="join"
              />
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorMessage}>
                <Text style={[styles.errorMessageText, { fontSize: fs(14) }]}>
                  {error}
                </Text>
              </View>
            )}

            {/* Spacer */}
            <View style={{ flex: 1 }} />

            {/* Footer Buttons */}
            <View style={[styles.footer, { paddingVertical: sh(20) }]}>
              <ActionButton
                title={isJoining ? "Joining..." : "Join Game"}
                onPress={handleJoin}
                disabled={!canJoin || isJoining}
              />
              <ActionButton
                title="Back"
                variant="ghost"
                onPress={handleBack}
                style={{ marginTop: sh(12) }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    alignItems: "center",
  },
  title: {
    fontWeight: "900",
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: 8,
  },
  inputSection: {
  },
  inputLabel: {
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "600",
    marginBottom: 8,
  },
  codeInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    color: Colors.textPrimary,
    fontWeight: "900",
    letterSpacing: 12,
    textAlign: "center",
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
  },
  nameInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
  },
  errorMessage: {
    backgroundColor: "rgba(230, 57, 70, 0.15)",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.red,
  },
  errorMessageText: {
    color: Colors.red,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontWeight: "900",
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  errorText: {
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
