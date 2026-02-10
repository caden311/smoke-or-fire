import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { GameState, GameAction, Player } from "../types";
import { gameReducer, initialState } from "./GameContext";
import { useMultiplayer } from "./MultiplayerContext";
import {
  subscribeToGameState,
  subscribeToPendingAction,
  updateGameState,
  submitAction,
  clearPendingAction,
  PendingAction,
} from "../services/multiplayer";

interface RemoteGameContextValue {
  // State from Firebase subscription
  state: GameState | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  dispatchRemote: (action: GameAction) => Promise<void>;

  // Computed helpers
  isMyTurn: boolean;
  currentPlayer: Player | null;
}

const RemoteGameContext = createContext<RemoteGameContextValue | null>(null);

export function RemoteGameProvider({ children }: { children: React.ReactNode }) {
  const { isMultiplayer, isHost, roomCode, playerId } = useMultiplayer();

  const [state, setState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track last processed action to prevent duplicate processing
  const lastProcessedActionRef = useRef<number | null>(null);

  // Refs for unsubscribe functions
  const unsubscribeGameStateRef = useRef<(() => void) | null>(null);
  const unsubscribePendingActionRef = useRef<(() => void) | null>(null);

  // Subscribe to game state from Firebase
  useEffect(() => {
    if (!isMultiplayer || !roomCode) {
      setState(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    console.log('[RGC] Subscribing to gameState', { roomCode, isHost });

    unsubscribeGameStateRef.current = subscribeToGameState(roomCode, (gameState) => {
      console.log('[RGC] Game state received', {
        hasState: !!gameState,
        phase: gameState?.phase,
        currentCard: gameState?.currentCard ? `${gameState.currentCard.value} of ${gameState.currentCard.suit}` : null,
        playerCardsLengths: gameState?.playerCards?.map(cards => cards.length),
        roundNumber: gameState?.roundNumber,
      });

      setState(gameState);
      setIsLoading(false);
    });

    return () => {
      console.log('[RGC] Unsubscribing from gameState');
      unsubscribeGameStateRef.current?.();
      unsubscribeGameStateRef.current = null;
    };
  }, [isMultiplayer, roomCode, isHost]);

  // Host: Subscribe to pending actions and process them
  useEffect(() => {
    if (!isMultiplayer || !isHost || !roomCode) {
      return;
    }

    console.log('[RGC] Host subscribing to pendingAction', { roomCode });

    unsubscribePendingActionRef.current = subscribeToPendingAction(roomCode, async (pendingAction) => {
      if (!pendingAction) return;

      // Prevent processing the same action twice
      if (lastProcessedActionRef.current === pendingAction.timestamp) {
        console.log('[RGC] Skipping duplicate pending action');
        return;
      }
      lastProcessedActionRef.current = pendingAction.timestamp;

      console.log('[RGC] Host processing pending action', pendingAction.action);

      // Get current state from Firebase (source of truth)
      // We use our local state cache since it's subscribed to Firebase
      const currentState = state;
      if (!currentState) {
        console.error('[RGC] Cannot process action - no current state');
        await clearPendingAction(roomCode);
        return;
      }

      // Run the reducer to get new state
      const newState = gameReducer(currentState, pendingAction.action);

      // Write new state to Firebase
      await updateGameState(roomCode, newState);

      // Clear the pending action
      await clearPendingAction(roomCode);
    });

    return () => {
      console.log('[RGC] Host unsubscribing from pendingAction');
      unsubscribePendingActionRef.current?.();
      unsubscribePendingActionRef.current = null;
    };
  }, [isMultiplayer, isHost, roomCode, state]);

  // Unified dispatch function
  const dispatchRemote = useCallback(async (action: GameAction) => {
    if (!roomCode) {
      console.error('[RGC] Cannot dispatch - no room code');
      return;
    }

    console.log('[RGC] dispatchRemote', { action: action.type, isHost });

    if (isHost) {
      // Host: Run reducer locally and write to Firebase
      const currentState = state;
      if (!currentState) {
        console.error('[RGC] Cannot dispatch - no current state');
        return;
      }

      const newState = gameReducer(currentState, action);
      await updateGameState(roomCode, newState);
    } else {
      // Non-host: Send action as intent for host to process
      await submitAction(roomCode, playerId, action);
    }
  }, [isHost, roomCode, playerId, state]);

  // Compute isMyTurn
  const isMyTurn = state
    ? state.players[state.currentPlayerIndex]?.id === playerId
    : false;

  // Compute currentPlayer
  const currentPlayer = state
    ? state.players[state.currentPlayerIndex] ?? null
    : null;

  const value: RemoteGameContextValue = {
    state,
    isLoading,
    error,
    dispatchRemote,
    isMyTurn,
    currentPlayer,
  };

  return (
    <RemoteGameContext.Provider value={value}>
      {children}
    </RemoteGameContext.Provider>
  );
}

export function useRemoteGame(): RemoteGameContextValue {
  const context = useContext(RemoteGameContext);
  if (!context) {
    throw new Error("useRemoteGame must be used within a RemoteGameProvider");
  }
  return context;
}
