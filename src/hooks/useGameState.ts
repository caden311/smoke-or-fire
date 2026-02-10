import { GameState, Player } from "../types";
import { useGame } from "../context/GameContext";
import { useRemoteGame } from "../context/RemoteGameContext";
import { useMultiplayer } from "../context/MultiplayerContext";

interface GameStateHook {
  state: GameState | null;
  isLoading: boolean;
  isMyTurn: boolean;
  currentPlayer: Player | null;
}

export function useGameState(): GameStateHook {
  const { isMultiplayer } = useMultiplayer();
  const localGame = useGame();
  const remoteGame = useRemoteGame();

  if (isMultiplayer) {
    return {
      state: remoteGame.state,
      isLoading: remoteGame.isLoading,
      isMyTurn: remoteGame.isMyTurn,
      currentPlayer: remoteGame.currentPlayer,
    };
  }

  // Local game
  const currentPlayer = localGame.state.players[localGame.state.currentPlayerIndex] ?? null;

  return {
    state: localGame.state,
    isLoading: false,
    isMyTurn: true, // In local game, it's always "your" turn (pass and play)
    currentPlayer,
  };
}
