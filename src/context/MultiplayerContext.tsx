import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isFirebaseConfigured } from "../services/firebase";
import {
  Room,
  RoomPlayer,
  createRoom,
  joinRoom,
  leaveRoom,
  startGame as startGameService,
  subscribeToRoom,
} from "../services/multiplayer";
import { GameState } from "../types";

const PLAYER_ID_KEY = "@smoke_or_fire_player_id";

function generatePlayerId(): string {
  return "player_" + Math.random().toString(36).substring(2, 15);
}

interface MultiplayerContextValue {
  // Connection state
  isMultiplayer: boolean;
  isFirebaseReady: boolean;
  roomCode: string | null;
  playerId: string;
  isHost: boolean;

  // Room state
  room: Room | null;
  players: RoomPlayer[];
  connectionStatus: "disconnected" | "connecting" | "connected";

  // Actions
  hostGame: (playerName: string) => Promise<string>;
  joinGame: (roomCode: string, playerName: string) => Promise<void>;
  leaveGame: () => Promise<void>;
  startMultiplayerGame: (initialState: GameState) => Promise<void>;

  // Get current player info
  getCurrentPlayer: () => RoomPlayer | null;
}

const MultiplayerContext = createContext<MultiplayerContextValue | null>(null);

export function MultiplayerProvider({ children }: { children: React.ReactNode }) {
  const [playerId, setPlayerId] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");

  const unsubscribeRoomRef = useRef<(() => void) | null>(null);

  const isFirebaseReady = isFirebaseConfigured();
  const isMultiplayer = roomCode !== null;

  // Initialize player ID
  useEffect(() => {
    async function loadOrCreatePlayerId() {
      try {
        let id = await AsyncStorage.getItem(PLAYER_ID_KEY);
        if (!id) {
          id = generatePlayerId();
          await AsyncStorage.setItem(PLAYER_ID_KEY, id);
        }
        setPlayerId(id);
      } catch {
        // Fallback if AsyncStorage fails
        setPlayerId(generatePlayerId());
      }
    }
    loadOrCreatePlayerId();
  }, []);

  // Cleanup subscription when leaving room
  const cleanupSubscription = useCallback(() => {
    unsubscribeRoomRef.current?.();
    unsubscribeRoomRef.current = null;
  }, []);

  // Subscribe to room changes
  const subscribeToRoomChanges = useCallback((code: string) => {
    cleanupSubscription();

    setConnectionStatus("connecting");

    unsubscribeRoomRef.current = subscribeToRoom(code, (roomData) => {
      console.log('[MP] Room update', { roomCode: code, status: roomData?.status, hostId: roomData?.hostId });
      if (roomData) {
        setRoom(roomData);
        setConnectionStatus("connected");
        setIsHost(roomData.hostId === playerId);
      } else {
        // Room was deleted
        setRoom(null);
        setRoomCode(null);
        setConnectionStatus("disconnected");
        cleanupSubscription();
      }
    });
  }, [playerId, cleanupSubscription]);

  const hostGame = useCallback(async (playerName: string): Promise<string> => {
    if (!playerId) throw new Error("Player ID not initialized");

    const code = await createRoom(playerId, playerName);
    setRoomCode(code);
    setIsHost(true);
    subscribeToRoomChanges(code);
    return code;
  }, [playerId, subscribeToRoomChanges]);

  const joinGame = useCallback(async (code: string, playerName: string): Promise<void> => {
    if (!playerId) throw new Error("Player ID not initialized");

    const roomData = await joinRoom(code.toUpperCase(), playerId, playerName);
    if (!roomData) {
      throw new Error("Room not found");
    }

    setRoomCode(code.toUpperCase());
    setIsHost(false);
    subscribeToRoomChanges(code.toUpperCase());
  }, [playerId, subscribeToRoomChanges]);

  const leaveGame = useCallback(async (): Promise<void> => {
    if (roomCode && playerId) {
      await leaveRoom(roomCode, playerId);
    }
    cleanupSubscription();
    setRoomCode(null);
    setRoom(null);
    setIsHost(false);
    setConnectionStatus("disconnected");
  }, [roomCode, playerId, cleanupSubscription]);

  const startMultiplayerGame = useCallback(async (initialState: GameState): Promise<void> => {
    console.log('[MP] startMultiplayerGame called', { roomCode, isHost, statePhase: initialState.phase });
    if (!roomCode || !isHost) {
      throw new Error("Only host can start the game");
    }
    await startGameService(roomCode, playerId, initialState);
  }, [roomCode, isHost, playerId]);

  const getCurrentPlayer = useCallback((): RoomPlayer | null => {
    if (!room || !playerId) return null;
    return room.players[playerId] || null;
  }, [room, playerId]);

  const players = room ? Object.values(room.players) : [];

  const value: MultiplayerContextValue = {
    isMultiplayer,
    isFirebaseReady,
    roomCode,
    playerId,
    isHost,
    room,
    players,
    connectionStatus,
    hostGame,
    joinGame,
    leaveGame,
    startMultiplayerGame,
    getCurrentPlayer,
  };

  return (
    <MultiplayerContext.Provider value={value}>
      {children}
    </MultiplayerContext.Provider>
  );
}

export function useMultiplayer(): MultiplayerContextValue {
  const context = useContext(MultiplayerContext);
  if (!context) {
    throw new Error("useMultiplayer must be used within a MultiplayerProvider");
  }
  return context;
}
