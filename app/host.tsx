import React, { useEffect } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Share, Platform, Alert } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMultiplayer } from "../src/context/MultiplayerContext";
import { useRemoteGame } from "../src/context/RemoteGameContext";
import ActionButton from "../src/components/ActionButton";
import { Colors } from "../constants/Colors";
import { useResponsive } from "../src/hooks/useResponsive";
import { createDeck, shuffleDeck } from "../src/utils/deck";
import { lightHaptic } from "../src/utils/haptics";

export default function HostLobby() {
  const { fs, sh, sw } = useResponsive();
  const {
    roomCode,
    players,
    isHost,
    room,
    connectionStatus,
    leaveGame,
    startMultiplayerGame,
  } = useMultiplayer();
  const { state: remoteState } = useRemoteGame();

  // When game state appears in Firebase, navigate to game
  useEffect(() => {
    console.log('[HOST] Navigation check', {
      roomStatus: room?.status,
      hasRemoteState: !!remoteState,
      remotePhase: remoteState?.phase,
    });

    // Navigate when we have game state with playing phase
    if (remoteState?.phase === "playing") {
      router.replace("/game");
    }
  }, [room?.status, remoteState?.phase]);

  const handleStartGame = async () => {
    if (players.length < 2) return;

    // Create initial game state with all players from the room
    const deck = shuffleDeck(createDeck());
    const initialState = {
      players: players.map((p) => ({ id: p.id, name: p.name })),
      deck,
      currentPlayerIndex: 0,
      roundNumber: 1,
      phase: "playing" as const,
      turnResults: [],
      currentCard: null,
      currentGuess: null,
      roundType: "smoke_or_fire" as const,
      playerCards: players.map(() => []),
      pyramidCards: [],
      pyramidRevealed: [],
      pyramidCurrentRow: 0,
      pyramidResults: [],
      pendingDrinkAssignments: [],
    };

    console.log('[HOST] Starting game with state:', {
      players: initialState.players.length,
      deckSize: initialState.deck.length,
      phase: initialState.phase,
    });

    await startMultiplayerGame(initialState);
    // Navigation will happen via effect when Firebase updates
  };

  const handleLeave = async () => {
    await leaveGame();
    router.replace("/");
  };

  const handleShare = async () => {
    if (!roomCode) return;

    lightHaptic();

    const deepLink = `smoke-or-fire://join?room=${roomCode}`;
    const message = `Join my Smoke or Fire game!\n\nRoom Code: ${roomCode}\n\nOpen this link to join: ${deepLink}`;

    try {
      if (Platform.OS === "web") {
        await navigator.clipboard.writeText(message);
        Alert.alert("Copied!", "Invite link copied to clipboard");
        return;
      }

      await Share.share({
        message,
        url: Platform.OS === "ios" ? deepLink : undefined,
        title: "Join Smoke or Fire",
      });
    } catch (error) {
      console.log("[HOST] Share error:", error);
    }
  };

  const canStart = isHost && players.length >= 2;

  return (
    <LinearGradient
      colors={[Colors.background, "#1A0A0A"]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, { paddingHorizontal: sw(24) }]}>
          {/* Header */}
          <View style={[styles.header, { marginBottom: sh(32) }]}>
            <Text style={[styles.title, { fontSize: fs(28) }]}>
              {isHost ? "Game Lobby" : "Waiting for Host"}
            </Text>
            {connectionStatus === "connecting" && (
              <View style={styles.connectingRow}>
                <ActivityIndicator size="small" color={Colors.textSecondary} />
                <Text style={[styles.connectingText, { fontSize: fs(14) }]}>
                  Connecting...
                </Text>
              </View>
            )}
          </View>

          {/* Room Code Display */}
          {roomCode && (
            <View style={[styles.codeSection, { marginBottom: sh(32) }]}>
              <Text style={[styles.codeLabel, { fontSize: fs(14) }]}>
                Room Code
              </Text>
              <Text style={[styles.roomCode, { fontSize: fs(48) }]}>
                {roomCode}
              </Text>
              <Text style={[styles.codeHint, { fontSize: fs(12) }]}>
                Share this code with friends
              </Text>
              <ActionButton
                title="Share Invite"
                variant="success"
                onPress={handleShare}
                style={{ marginTop: sh(16) }}
              />
            </View>
          )}

          {/* Players List */}
          <View style={styles.playersSection}>
            <Text style={[styles.playersLabel, { fontSize: fs(16), marginBottom: sh(16) }]}>
              Players ({players.length})
            </Text>
            <FlatList
              data={players}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <View style={[styles.playerRow, { paddingVertical: sh(12) }]}>
                  <View style={styles.playerInfo}>
                    <Text style={[styles.playerName, { fontSize: fs(18) }]}>
                      {item.name}
                    </Text>
                    {room?.hostId === item.id && (
                      <View style={styles.hostBadge}>
                        <Text style={[styles.hostBadgeText, { fontSize: fs(10) }]}>
                          HOST
                        </Text>
                      </View>
                    )}
                  </View>
                  <View
                    style={[
                      styles.readyIndicator,
                      item.ready && styles.readyIndicatorActive,
                    ]}
                  />
                </View>
              )}
              style={styles.playersList}
              contentContainerStyle={{ paddingBottom: sh(16) }}
            />
          </View>

          {/* Footer Buttons */}
          <View style={[styles.footer, { paddingVertical: sh(20) }]}>
            {isHost ? (
              <ActionButton
                title="Start Game"
                onPress={handleStartGame}
                disabled={!canStart}
              />
            ) : (
              <Text style={[styles.waitingText, { fontSize: fs(16) }]}>
                Waiting for host to start...
              </Text>
            )}
            <ActionButton
              title="Leave"
              variant="ghost"
              onPress={handleLeave}
              style={{ marginTop: sh(12) }}
            />
          </View>
        </View>
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
  connectingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  connectingText: {
    color: Colors.textSecondary,
  },
  codeSection: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 32,
  },
  codeLabel: {
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "600",
  },
  roomCode: {
    fontWeight: "900",
    color: Colors.white,
    letterSpacing: 12,
    marginVertical: 8,
  },
  codeHint: {
    color: Colors.gray,
  },
  playersSection: {
    flex: 1,
  },
  playersLabel: {
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "700",
  },
  playersList: {
    flex: 1,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playerName: {
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  hostBadge: {
    backgroundColor: Colors.red,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  hostBadgeText: {
    color: Colors.white,
    fontWeight: "700",
  },
  readyIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.gray,
  },
  readyIndicatorActive: {
    backgroundColor: Colors.green,
  },
  footer: {
    alignItems: "center",
  },
  waitingText: {
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
});
