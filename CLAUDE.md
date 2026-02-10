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
- Firebase Realtime Database for multiplayer sync
- State management: React Context + useReducer (no external state library)
- Entry point: `"main": "expo-router/entry"` in package.json

## Project Structure

```
app/                          # Screens (expo-router file-based routing)
├── _layout.tsx               # Root layout, wraps providers
├── index.tsx                 # Home screen (local vs multiplayer choice)
├── host.tsx                  # Host a multiplayer game
├── join.tsx                  # Join a multiplayer game
├── game.tsx                  # Main gameplay (all 4 rounds)
├── round-complete.tsx        # Results after each round
├── pyramid.tsx               # Pyramid phase gameplay
└── pyramid-complete.tsx      # Final results

src/
├── context/
│   ├── GameContext.tsx       # Local game state (useReducer), exports gameReducer
│   ├── RemoteGameContext.tsx # Firebase game state subscription for multiplayer
│   └── MultiplayerContext.tsx # Room management (host, join, leave)
├── services/
│   ├── firebase.ts           # Firebase init & refs
│   └── multiplayer.ts        # Room CRUD, state sync, normalization
├── hooks/
│   ├── useGameState.ts       # Unified hook for local/multiplayer state
│   ├── useGameActions.ts     # Unified hook for dispatching actions
│   ├── useCardAnimation.ts   # Reanimated flip animation
│   └── useResponsive.ts      # Responsive sizing helpers
├── components/
│   ├── FlippableCard.tsx     # 3D flip animation wrapper
│   ├── CardFace.tsx          # Card front display
│   ├── CardBack.tsx          # Card back display
│   ├── ActionButton.tsx      # Styled button with variants
│   ├── ResultBanner.tsx      # Correct/incorrect feedback
│   ├── DrawnCardsModal.tsx   # View all players' cards
│   ├── PyramidCard.tsx       # Pyramid grid card
│   └── PyramidResultModal.tsx # Pyramid match results
├── utils/
│   ├── deck.ts               # Deck creation, shuffle, draw
│   └── haptics.ts            # Platform-guarded haptic feedback
└── types/index.ts            # All TypeScript interfaces

constants/
├── Colors.ts                 # Dark theme color palette
└── Cards.ts                  # Suit symbols, value display names
```

## Game Flow

This is a "Smoke or Fire" drinking card game with two phases:

**Phase 1 — Four Rounds** (`game.tsx` → `round-complete.tsx`, looping):
1. Smoke or Fire (red/black guess)
2. Higher or Lower (vs. player's last card)
3. Inside or Outside (between player's first two cards)
4. Guess the Suit

Each player guesses once per round. Cards accumulate in `playerCards[playerIndex][]`.

**Phase 2 — Pyramid** (`pyramid.tsx` → `pyramid-complete.tsx`):
9 cards in diamond pattern (rows: 1-2-3-2-1). Rows revealed sequentially with alternating give/take actions (1-5 drinks). Matching player cards trigger drink assignments.

## State Management

### GameContext (Local State)

Local game state via `useReducer`. The `gameReducer` is exported for reuse.

```typescript
interface GameState {
  players: Player[];              // { id, name }
  deck: Card[];                   // Remaining cards
  currentPlayerIndex: number;     // Whose turn
  roundNumber: number;            // 1-4
  phase: GamePhase;               // "registration" | "playing" | "round-complete" | "pyramid"
  roundType: RoundType;           // "smoke_or_fire" | "higher_or_lower" | "inside_or_outside" | "guess_the_suit"
  currentCard: Card | null;       // Just drawn card (null = waiting for guess)
  currentGuess: Guess | null;     // Player's guess
  turnResults: TurnResult[];      // Results for current round
  playerCards: Card[][];          // playerCards[playerIndex][cardIndex] - accumulated across rounds
  pyramidCards: Card[];           // 9 pyramid cards
  pyramidRevealed: boolean[];     // Which pyramid cards are face-up
  pyramidCurrentRow: number;      // 0-4
  pyramidResults: PyramidRevealResult[];
}
```

**Actions:** `ADD_PLAYER`, `REMOVE_PLAYER`, `START_GAME`, `MAKE_GUESS`, `NEXT_TURN`, `NEXT_ROUND`, `START_PYRAMID`, `REVEAL_PYRAMID_ROW`, `RESET`, `SYNC_STATE`

### RemoteGameContext (Firebase State)

Subscribes to Firebase game state for multiplayer. Host processes pending actions.

### MultiplayerContext (Room Management)

Manages room lifecycle only: `hostGame`, `joinGame`, `leaveGame`, `startMultiplayerGame`.

## Multiplayer Architecture

### Core Principles

1. **Firebase is Source of Truth** - In multiplayer, ALL devices read from Firebase
2. **Unified Hooks** - `useGameState()` and `useGameActions()` work for both local and multiplayer
3. **Reducer Reuse** - `gameReducer` from GameContext is used by RemoteGameContext

### Data Flow

```
Host Action:
  Host taps button → dispatchRemote() → gameReducer() → updateGameState() → Firebase
  All devices receive update via subscribeToGameState()

Non-Host Action:
  Non-host taps → dispatchRemote() → submitAction() → pendingAction
  Host receives → gameReducer() → updateGameState() → clearPendingAction()
  All devices receive update via subscribeToGameState()
```

### Unified Hooks

```typescript
// useGameState - same interface for local and multiplayer
const { state, isLoading, isMyTurn, currentPlayer } = useGameState();

// useGameActions - routes to correct dispatcher
const { dispatch } = useGameActions();
```

### Firebase Normalization

Firebase converts empty arrays to `undefined` and arrays to objects with numeric keys. `normalizeGameState()` in `multiplayer.ts` handles this.

## Key Patterns

### Card State Flow in game.tsx

1. **Before guess:** `currentCard === null`, show card back
2. **After MAKE_GUESS:** `currentCard` set, card flips to show face
3. **After NEXT_TURN:** `currentCard` reset to null for next player

### UI States (game.tsx)

```typescript
const [guessState, setGuessState] = useState<'idle' | 'submitting' | 'guessed'>('idle');
```

- `idle`: Show buttons (or "Waiting for X..." if not your turn)
- `submitting`: Show "Submitting guess..." spinner
- `guessed`: Show card result and Next button

### Navigation

Always use `router.replace()` (not `push`) to keep back stack flat.

## Debugging

### Console Log Prefixes

- `[GC]` — GameContext reducer
- `[RGC]` — RemoteGameContext
- `[FB]` — Firebase/multiplayer.ts
- `[MP]` — MultiplayerContext
- `[GAME]` — game.tsx screen
- `[HOST]` — host.tsx lobby

### Common Issues

1. **playerCards missing in round 2+**: Check `normalizeGameState` logs, ensure Firebase isn't converting arrays to objects incorrectly

2. **Non-host stuck on "submitting guess"**: Check that host is processing pendingAction

3. **Card doesn't flip**: Check that `currentCard` is being set in Firebase

### Key Log Points

```
[GC] MAKE_GUESS guard check — Shows state before guess processing
[GC] NEXT_ROUND before/after — Shows playerCards preservation
[RGC] Game state received — Shows what RemoteGameContext receives
[FB] updateGameState — Shows what's being sent to Firebase
[FB] normalizeGameState — Shows array normalization
```

## Styling Conventions

- Dark theme in `constants/Colors.ts`
- All screens use `LinearGradient` background
- Inline `StyleSheet.create()` per component
- `ActionButton` variant prop maps to colors
- `useResponsive()` hook for cross-platform sizing
