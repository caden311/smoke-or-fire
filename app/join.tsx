import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMultiplayer } from "../src/context/MultiplayerContext";
import { useTheme } from "../src/context/ThemeContext";
import ActionButton from "../src/components/ActionButton";
import { useResponsive } from "../src/hooks/useResponsive";

export default function JoinGame() {
  const { fs, sh, sw } = useResponsive();
  const { colors } = useTheme();
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
        colors={[colors.background, colors.backgroundGradientEnd]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container}>
          <View style={[styles.content, { paddingHorizontal: sw(24) }]}>
            <View style={styles.errorContainer}>
              <Text style={[styles.errorTitle, { fontSize: fs(24), color: colors.textPrimary }]}>
                Multiplayer Not Available
              </Text>
              <Text style={[styles.errorText, { fontSize: fs(14), color: colors.textSecondary }]}>
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
      colors={[colors.background, colors.backgroundGradientEnd]}
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
              <Text style={[styles.title, { fontSize: fs(32), color: colors.textPrimary }]}>
                Join Game
              </Text>
              <Text style={[styles.subtitle, { fontSize: fs(14), color: colors.textSecondary }]}>
                Enter the room code shared by the host
              </Text>
            </View>

            {/* Room Code Input */}
            <View style={[styles.inputSection, { marginBottom: sh(24) }]}>
              <Text style={[styles.inputLabel, { fontSize: fs(14), color: colors.textSecondary }]}>
                Room Code
              </Text>
              <TextInput
                style={[
                  styles.codeInput,
                  {
                    fontSize: fs(32),
                    backgroundColor: colors.surface,
                    color: colors.textPrimary,
                    borderColor: colors.divider,
                  },
                ]}
                value={roomCode}
                onChangeText={(text) => {
                  setRoomCode(text.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4));
                  setError(null);
                }}
                placeholder="ABCD"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={4}
              />
            </View>

            {/* Player Name Input */}
            <View style={[styles.inputSection, { marginBottom: sh(24) }]}>
              <Text style={[styles.inputLabel, { fontSize: fs(14), color: colors.textSecondary }]}>
                Your Name
              </Text>
              <TextInput
                style={[
                  styles.nameInput,
                  {
                    fontSize: fs(18),
                    backgroundColor: colors.surface,
                    color: colors.textPrimary,
                    borderColor: colors.divider,
                  },
                ]}
                value={playerName}
                onChangeText={(text) => {
                  setPlayerName(text);
                  setError(null);
                }}
                placeholder="Enter your name"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                maxLength={20}
                onSubmitEditing={handleJoin}
                returnKeyType="join"
              />
            </View>

            {/* Error Message */}
            {error && (
              <View style={[styles.errorMessage, { borderColor: colors.fire }]}>
                <Text style={[styles.errorMessageText, { fontSize: fs(14), color: colors.fire }]}>
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
    letterSpacing: 2,
  },
  subtitle: {
    marginTop: 8,
  },
  inputSection: {
  },
  inputLabel: {
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "600",
    marginBottom: 8,
  },
  codeInput: {
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontWeight: "900",
    letterSpacing: 12,
    textAlign: "center",
    borderWidth: 1,
  },
  nameInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    letterSpacing: 0,
  },
  errorMessage: {
    backgroundColor: "rgba(230, 57, 70, 0.15)",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  errorMessageText: {
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
    marginBottom: 16,
    textAlign: "center",
  },
  errorText: {
    textAlign: "center",
    lineHeight: 22,
  },
});
