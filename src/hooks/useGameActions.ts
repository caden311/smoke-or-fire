import { useCallback } from "react";
import { GameAction } from "../types";
import { useGame } from "../context/GameContext";
import { useRemoteGame } from "../context/RemoteGameContext";
import { useMultiplayer } from "../context/MultiplayerContext";

interface GameActionsHook {
  dispatch: (action: GameAction) => Promise<void>;
}

export function useGameActions(): GameActionsHook {
  const { isMultiplayer } = useMultiplayer();
  const localGame = useGame();
  const remoteGame = useRemoteGame();

  const dispatch = useCallback(async (action: GameAction) => {
    if (isMultiplayer) {
      await remoteGame.dispatchRemote(action);
    } else {
      localGame.dispatch(action);
    }
  }, [isMultiplayer, localGame, remoteGame]);

  return { dispatch };
}
