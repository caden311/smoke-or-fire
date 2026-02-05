# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npx expo start` — Start the Expo dev server
- `npx expo start --ios` — Start and open in iOS Simulator
- `npx expo start --web` — Start and open in browser
- `npx expo run:ios` — Build and run native iOS build
- `npx expo run:android` — Build and run native Android build

No test framework or linter is configured.

## Tech Stack

- Expo SDK 54, React Native 0.81, React 19, TypeScript (strict mode)
- expo-router v6 (file-based routing in `app/`)
- react-native-reanimated v4 for card flip animations
- expo-haptics for tactile feedback (guarded with Platform.OS !== "web")
- expo-linear-gradient for screen backgrounds
- State management: React Context + useReducer (no external state library)
- Entry point: `"main": "expo-router/entry"` in package.json

## Architecture

### Game Flow

This is a "Smoke or Fire" drinking card game. The game has two phases:

**Phase 1 — Four Rounds** (screens: `game.tsx` → `round-complete.tsx`, looping):
Each round, every player guesses once. Rounds progress through fixed types:
1. Smoke or Fire (red/black)
2. Higher or Lower (vs. previous card)
3. Inside or Outside (between two previous cards)
4. Guess the Suit

Each player accumulates cards in `playerCards[playerIndex][]` across rounds.

**Phase 2 — Pyramid** (screens: `pyramid.tsx` → `pyramid-complete.tsx`):
9 cards laid out in a diamond pattern (rows: 1-2-3-2-1). Rows are revealed sequentially, alternating "give" and "take" actions with increasing drink amounts (1-5). Player cards matching revealed pyramid card values trigger drink assignments.

### State Management

All game state lives in `src/context/GameContext.tsx` via a single `useReducer`. The `GameProvider` wraps the app in `app/_layout.tsx`. Actions: `ADD_PLAYER`, `REMOVE_PLAYER`, `START_GAME`, `MAKE_GUESS`, `NEXT_TURN`, `NEXT_ROUND`, `START_PYRAMID`, `REVEAL_PYRAMID_ROW`, `RESET`.

Navigation between screens uses `router.replace()` (not `push`) so the back stack stays flat.

### Card System

- `src/utils/deck.ts` — Deck creation, Fisher-Yates shuffle, draw (from index 0). Ace is high (value 14).
- `src/hooks/useCardAnimation.ts` — Reanimated shared values for 3D card flip (perspective + rotateY, 600ms).
- `FlippableCard` composes `CardFace` and `CardBack` with `backfaceVisibility: "hidden"` for the flip effect.

### Styling Conventions

- Dark theme defined in `constants/Colors.ts`, all screens use `LinearGradient` background
- Inline `StyleSheet.create()` per component (no shared style sheets)
- `ActionButton` uses a `variant` prop to map game actions to colors (red suits/fire = `Colors.red`, black suits/smoke = `Colors.surfaceLight`, correct = `Colors.green`)
