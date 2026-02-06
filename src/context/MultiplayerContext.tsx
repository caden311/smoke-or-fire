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
  PendingAction,
  createRoom,
  joinRoom,
  leaveRoom,
  startGame as startGameService,
  updateGameState,
  submitAction,
  clearPendingAction,
  subscribeToRoom,
  subscribeToGameState,
  subscribeToPendingAction,
  getRoom,
  deleteRoom,
} from "../services/multiplayer";
import { GameState, GameAction } from "../types";

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
  syncGameState: (state: GameState) => Promise<void>;
  sendAction: (action: GameAction) => Promise<void>;

  // For host: pending actions from other players
  pendingAction: PendingAction | null;
  clearPending: () => Promise<void>;

  // Synced game state (from Firebase)
  syncedGameState: GameState | null;

  // Get current player info
  getCurrentPlayer: () => RoomPlayer | null;
  isMyTurn: (currentPlayerIndex: number, players: { id: string }[]) => boolean;
}

const MultiplayerContext = createContext<MultiplayerContextValue | null>(null);

export function MultiplayerProvider({ children }: { children: React.ReactNode }) {
  const [playerId, setPlayerId] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [syncedGameState, setSyncedGameState] = useState<GameState | null>(null);

  const unsubscribeRoomRef = useRef<(() => void) | null>(null);
  const unsubscribeGameStateRef = useRef<(() => void) | null>(null);
  const unsubscribePendingActionRef = useRef<(() => void) | null>(null);

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

  // Cleanup subscriptions when leaving room
  const cleanupSubscriptions = useCallback(() => {
    unsubscribeRoomRef.current?.();
    unsubscribeGameStateRef.current?.();
    unsubscribePendingActionRef.current?.();
    unsubscribeRoomRef.current = null;
    unsubscribeGameStateRef.current = null;
    unsubscribePendingActionRef.current = null;
  }, []);

  // Subscribe to room changes
  const subscribeToRoomChanges = useCallback((code: string) => {
    cleanupSubscriptions();

    setConnectionStatus("connecting");

    // Subscribe to room
    unsubscribeRoomRef.current = subscribeToRoom(code, (roomData) => {
      if (roomData) {
        setRoom(roomData);
        setConnectionStatus("connected");
        setIsHost(roomData.hostId === playerId);
      } else {
        // Room was deleted
        setRoom(null);
        setRoomCode(null);
        setConnectionStatus("disconnected");
        cleanupSubscriptions();
      }
    });

    // Subscribe to game state
    unsubscribeGameStateRef.current = subscribeToGameState(code, (state) => {
      setSyncedGameState(state);
    });
  }, [playerId, cleanupSubscriptions]);

  // Host subscribes to pending actions
  useEffect(() => {
    if (isHost && roomCode) {
      unsubscribePendingActionRef.current = subscribeToPendingAction(roomCode, (action) => {
        setPendingAction(action);
      });
    }
    return () => {
      unsubscribePendingActionRef.current?.();
    };
  }, [isHost, roomCode]);

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
    cleanupSubscriptions();
    setRoomCode(null);
    setRoom(null);
    setIsHost(false);
    setPendingAction(null);
    setSyncedGameState(null);
    setConnectionStatus("disconnected");
  }, [roomCode, playerId, cleanupSubscriptions]);

  const startMultiplayerGame = useCallback(async (initialState: GameState): Promise<void> => {
    if (!roomCode || !isHost) {
      throw new Error("Only host can start the game");
    }
    await startGameService(roomCode, playerId, initialState);
  }, [roomCode, isHost, playerId]);

  const syncGameState = useCallback(async (state: GameState): Promise<void> => {
    if (!roomCode || !isHost) return;
    await updateGameState(roomCode, state);
  }, [roomCode, isHost]);

  const sendAction = useCallback(async (action: GameAction): Promise<void> => {
    if (!roomCode || isHost) return;
    await submitAction(roomCode, playerId, action);
  }, [roomCode, isHost, playerId]);

  const clearPending = useCallback(async (): Promise<void> => {
    if (!roomCode || !isHost) return;
    await clearPendingAction(roomCode);
    setPendingAction(null);
  }, [roomCode, isHost]);

  const getCurrentPlayer = useCallback((): RoomPlayer | null => {
    if (!room || !playerId) return null;
    return room.players[playerId] || null;
  }, [room, playerId]);

  const isMyTurn = useCallback((currentPlayerIndex: number, players: { id: string }[]): boolean => {
    if (!isMultiplayer) return true;
    if (players.length === 0) return false;
    const currentPlayer = players[currentPlayerIndex];
    return currentPlayer?.id === playerId;
  }, [isMultiplayer, playerId]);

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
    syncGameState,
    sendAction,
    pendingAction,
    clearPending,
    syncedGameState,
    getCurrentPlayer,
    isMyTurn,
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
