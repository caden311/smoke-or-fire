import React, { createContext, useContext, useReducer } from "react";
import { GameState, GameAction, TurnResult, PyramidMatch, PyramidRevealResult } from "../types";
import { createDeck, shuffleDeck, drawCard, getCardNumericValue } from "../utils/deck";

const PYRAMID_ROWS = [[0], [1, 2], [3, 4, 5], [6, 7], [8]];
const PYRAMID_ROW_RULES: { amount: number; action: "give" | "take" }[] = [
  { amount: 1, action: "give" },
  { amount: 2, action: "take" },
  { amount: 3, action: "give" },
  { amount: 4, action: "take" },
  { amount: 5, action: "give" },
];

export const initialState: GameState = {
  players: [],
  deck: [],
  currentPlayerIndex: 0,
  roundNumber: 1,
  phase: "registration",
  turnResults: [],
  currentCard: null,
  currentGuess: null,
  roundType: "smoke_or_fire",
  playerCards: [],
  pyramidCards: [],
  pyramidRevealed: [],
  pyramidCurrentRow: 0,
  pyramidResults: [],
};

let nextPlayerId = 0;

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "ADD_PLAYER": {
      const trimmed = action.name.trim();
      if (!trimmed) return state;
      const duplicate = state.players.some(
        (p) => p.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (duplicate) return state;
      const newPlayer = { id: String(nextPlayerId++), name: trimmed };
      return { ...state, players: [...state.players, newPlayer] };
    }

    case "REMOVE_PLAYER":
      return {
        ...state,
        players: state.players.filter((p) => p.id !== action.id),
      };

    case "START_GAME": {
      if (state.players.length < 2) return state;
      const deck = shuffleDeck(createDeck());
      return {
        ...state,
        deck,
        currentPlayerIndex: 0,
        roundNumber: 1,
        phase: "playing",
        turnResults: [],
        currentCard: null,
        currentGuess: null,
        roundType: "smoke_or_fire",
        playerCards: state.players.map(() => []),
      };
    }

    case "MAKE_GUESS": {
      console.log('[GC] MAKE_GUESS guard check', {
        phase: state.phase,
        currentCard: state.currentCard,
        currentPlayerIndex: state.currentPlayerIndex,
        roundType: state.roundType,
        playerCardsLengths: state.playerCards?.map(cards => cards.length),
      });

      // Use loose equality (!=) to catch both null AND undefined from Firebase
      if (state.phase !== "playing" || state.currentCard != null) {
        console.log('[GC] MAKE_GUESS guard FAILED - phase or currentCard');
        return state;
      }

      // Defensive guard for playerCards in rounds that need previous cards
      if (state.roundType === "higher_or_lower" || state.roundType === "inside_or_outside") {
        const prevCards = state.playerCards?.[state.currentPlayerIndex];
        if (!prevCards || prevCards.length === 0) {
          console.error('[GC] MAKE_GUESS: playerCards missing/empty for player', state.currentPlayerIndex, 'round type', state.roundType);
          console.error('[GC] Full playerCards:', JSON.stringify(state.playerCards));
          return state;
        }
      }

      const [card, remaining] = drawCard(state.deck);

      let isCorrect: boolean;
      if (state.roundType === "inside_or_outside") {
        const prevCards = state.playerCards[state.currentPlayerIndex];
        const val0 = getCardNumericValue(prevCards[0].value);
        const val1 = getCardNumericValue(prevCards[1].value);
        const low = Math.min(val0, val1);
        const high = Math.max(val0, val1);
        const drawnVal = getCardNumericValue(card.value);
        const isInside = drawnVal >= low && drawnVal <= high;
        const isOutside = drawnVal <= low || drawnVal >= high;
        isCorrect =
          (action.guess === "inside" && isInside) ||
          (action.guess === "outside" && isOutside);
      } else if (state.roundType === "guess_the_suit") {
        isCorrect = action.guess === card.suit;
      } else if (state.roundType === "higher_or_lower") {
        const prevCards = state.playerCards[state.currentPlayerIndex];
        const lastCard = prevCards[prevCards.length - 1];
        const drawnVal = getCardNumericValue(card.value);
        const lastVal = getCardNumericValue(lastCard.value);
        isCorrect =
          (action.guess === "higher" && drawnVal >= lastVal) ||
          (action.guess === "lower" && drawnVal <= lastVal);
      } else {
        isCorrect =
          (action.guess === "fire" && card.color === "red") ||
          (action.guess === "smoke" && card.color === "black");
      }

      const result: TurnResult = {
        player: state.players[state.currentPlayerIndex],
        guess: action.guess,
        card,
        correct: isCorrect,
      };

      const updatedPlayerCards = state.playerCards.map((cards, i) =>
        i === state.currentPlayerIndex ? [...cards, card] : cards
      );

      console.log('[GC] MAKE_GUESS', {
        drawnCard: `${card.value} of ${card.suit}`,
        isCorrect,
        playerIndex: state.currentPlayerIndex,
      });

      return {
        ...state,
        deck: remaining,
        currentCard: card,
        currentGuess: action.guess,
        turnResults: [...state.turnResults, result],
        playerCards: updatedPlayerCards,
      };
    }

    case "NEXT_TURN": {
      const nextIndex = state.currentPlayerIndex + 1;
      if (nextIndex >= state.players.length) {
        return {
          ...state,
          phase: "round-complete",
          currentCard: null,
          currentGuess: null,
        };
      }
      return {
        ...state,
        currentPlayerIndex: nextIndex,
        currentCard: null,
        currentGuess: null,
      };
    }

    case "NEXT_ROUND": {
      console.log('[GC] NEXT_ROUND before', {
        playerCardsLengths: state.playerCards?.map(cards => cards.length),
        roundNumber: state.roundNumber,
      });
      const nextRoundNumber = state.roundNumber + 1;
      const roundTypeLookup: Record<number, GameState["roundType"]> = {
        2: "higher_or_lower",
        3: "inside_or_outside",
        4: "guess_the_suit",
      };
      const newState: GameState = {
        ...state,
        currentPlayerIndex: 0,
        roundNumber: nextRoundNumber,
        roundType: roundTypeLookup[nextRoundNumber] ?? "smoke_or_fire",
        phase: "playing" as const,
        turnResults: [],
        currentCard: null,
        currentGuess: null,
      };
      console.log('[GC] NEXT_ROUND after', {
        playerCardsLengths: newState.playerCards?.map(cards => cards.length),
      });
      return newState;
    }

    case "START_PYRAMID": {
      let deck = [...state.deck];
      const pyramidCards = [];
      for (let i = 0; i < 9; i++) {
        const [card, remaining] = drawCard(deck);
        pyramidCards.push(card);
        deck = remaining;
      }
      return {
        ...state,
        deck,
        pyramidCards,
        pyramidRevealed: new Array(9).fill(false),
        pyramidCurrentRow: 0,
        pyramidResults: [],
        phase: "pyramid",
      };
    }

    case "REVEAL_PYRAMID_ROW": {
      const row = state.pyramidCurrentRow;
      if (row >= PYRAMID_ROWS.length) return state;

      const currentRowIndices = PYRAMID_ROWS[row];
      const { amount, action: rowAction } = PYRAMID_ROW_RULES[row];

      const newRevealed = [...state.pyramidRevealed];
      const newResults: PyramidRevealResult[] = [];

      for (const cardIndex of currentRowIndices) {
        newRevealed[cardIndex] = true;
        const revealedCard = state.pyramidCards[cardIndex];

        // Find matches across all players' cards from rounds 1-4
        const matches: PyramidMatch[] = [];
        for (let pi = 0; pi < state.players.length; pi++) {
          const cards = state.playerCards[pi] ?? [];
          const matchCount = cards.filter((c) => c.value === revealedCard.value).length;
          if (matchCount > 0) {
            matches.push({
              player: state.players[pi],
              matchCount,
              drinks: amount * matchCount,
              action: rowAction,
            });
          }
        }

        newResults.push({
          cardIndex,
          card: revealedCard,
          matches,
          row,
          action: rowAction,
          amount,
        });
      }

      return {
        ...state,
        pyramidRevealed: newRevealed,
        pyramidResults: [...state.pyramidResults, ...newResults],
        pyramidCurrentRow: row + 1,
      };
    }

    case "RESET":
      nextPlayerId = 0;
      return { ...initialState };

    case "SYNC_STATE":
      return { ...action.state };

    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
