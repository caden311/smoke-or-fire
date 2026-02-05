import { Card, CardColor, Suit, Value } from "../types";
import { SUITS, VALUES } from "../../constants/Cards";

function getSuitColor(suit: Suit): CardColor {
  return suit === "hearts" || suit === "diamonds" ? "red" : "black";
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value, color: getSuitColor(suit) });
    }
  }
  return deck;
}

/** Fisher-Yates shuffle — unbiased, O(n) */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const VALUE_MAP: Record<Value, number> = {
  A: 14, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
  "8": 8, "9": 9, "10": 10, J: 11, Q: 12, K: 13,
};

export function getCardNumericValue(value: Value): number {
  return VALUE_MAP[value];
}

/** Draw from top (index 0). Returns [drawnCard, remainingDeck]. */
export function drawCard(deck: Card[]): [Card, Card[]] {
  if (deck.length === 0) {
    throw new Error("Cannot draw from an empty deck");
  }
  const [card, ...remaining] = deck;
  return [card, remaining];
}
