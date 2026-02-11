export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type CardColor = "red" | "black";
export type Value =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export type Guess = "smoke" | "fire" | "higher" | "lower" | "inside" | "outside" | "hearts" | "diamonds" | "clubs" | "spades";

export type RoundType = "smoke_or_fire" | "higher_or_lower" | "inside_or_outside" | "guess_the_suit";

export interface Card {
  suit: Suit;
  value: Value;
  color: CardColor;
}

export interface Player {
  id: string;
  name: string;
}

export interface TurnResult {
  player: Player;
  guess: Guess;
  card: Card;
  correct: boolean;
}

export type GamePhase = "registration" | "playing" | "round-complete" | "pyramid";

export interface PyramidMatch {
  player: Player;
  matchCount: number;
  drinks: number;
  action: "give" | "take";
}

export interface PyramidRevealResult {
  cardIndex: number;
  card: Card;
  matches: PyramidMatch[];
  row: number;
  action: "give" | "take";
  amount: number;
}

export interface DrinkAssignment {
  id: string;
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  toPlayerName: string;
  amount: number;
  timestamp: number;
  roundNumber: number;
}

export interface PyramidPendingAssigner {
  playerId: string;
  playerName: string;
  drinksToGive: number;
}

export interface GameState {
  players: Player[];
  deck: Card[];
  currentPlayerIndex: number;
  roundNumber: number;
  phase: GamePhase;
  turnResults: TurnResult[];
  currentCard: Card | null;
  currentGuess: Guess | null;
  roundType: RoundType;
  playerCards: Card[][];
  pyramidCards: Card[];
  pyramidRevealed: boolean[];
  pyramidCurrentRow: number;
  pyramidResults: PyramidRevealResult[];
  pendingDrinkAssignments: DrinkAssignment[];
  pyramidPendingAssigners: PyramidPendingAssigner[];
}

export type GameAction =
  | { type: "ADD_PLAYER"; name: string }
  | { type: "REMOVE_PLAYER"; id: string }
  | { type: "START_GAME" }
  | { type: "MAKE_GUESS"; guess: Guess }
  | { type: "NEXT_TURN" }
  | { type: "NEXT_ROUND" }
  | { type: "START_PYRAMID" }
  | { type: "REVEAL_PYRAMID_ROW" }
  | { type: "RESET" }
  | { type: "SYNC_STATE"; state: GameState }
  | { type: "ASSIGN_DRINKS"; assignments: DrinkAssignment[]; advanceTurn?: boolean; completePyramidAssignment?: string };
