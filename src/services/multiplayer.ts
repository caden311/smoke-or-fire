import {
  roomRef,
  playersRef,
  gameStateRef,
  pendingActionRef,
  set,
  get,
  onValue,
  remove,
  update,
  off,
  isFirebaseConfigured,
  getDb,
  ref,
} from "./firebase";
import { GameState, GameAction, Player, Card, DEFAULT_GAME_SETTINGS, GameSettings } from "../types";

// Firebase doesn't store empty arrays - they come back as undefined
// Firebase may also convert arrays to objects with numeric keys
// This function ensures all array fields have proper defaults
function normalizeGameState(state: GameState | null): GameState | null {
  if (!state) return null;

  // Firebase may return objects instead of arrays (e.g., {0: val, 1: val})
  const toArray = <T>(val: T[] | Record<string, T> | null | undefined): T[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    // Convert object with numeric keys back to array
    return Object.values(val);
  };

  // Normalize players first so we know how many playerCards arrays we need
  const players = toArray(state.players);
  const rawPlayerCards = toArray(state.playerCards);
  // Ensure we have one array per player, even if Firebase deleted empty arrays
  const normalizedPlayerCards = players.map((_, index) =>
    toArray(rawPlayerCards[index])
  );

  console.log('[FB] normalizeGameState', {
    rawPlayerCards: typeof state.playerCards,
    rawPlayerCardsKeys: state.playerCards ? Object.keys(state.playerCards) : null,
    playerCount: players.length,
    normalizedLengths: normalizedPlayerCards.map(cards => cards.length),
  });

  // Normalize settings
  const rawSettings = state.settings ?? DEFAULT_GAME_SETTINGS;
  const normalizedSettings: GameSettings = {
    roundDrinks: (toArray(rawSettings.roundDrinks).length === 4
      ? toArray(rawSettings.roundDrinks)
      : DEFAULT_GAME_SETTINGS.roundDrinks) as GameSettings["roundDrinks"],
    pyramidDrinks: (toArray(rawSettings.pyramidDrinks).length === 5
      ? toArray(rawSettings.pyramidDrinks)
      : DEFAULT_GAME_SETTINGS.pyramidDrinks) as GameSettings["pyramidDrinks"],
  };

  return {
    ...state,
    // Normalize currentCard/currentGuess to null (Firebase can return undefined)
    currentCard: state.currentCard ?? null,
    currentGuess: state.currentGuess ?? null,
    players: toArray(state.players),
    deck: toArray(state.deck),
    turnResults: toArray(state.turnResults),
    playerCards: normalizedPlayerCards,
    pyramidCards: toArray(state.pyramidCards),
    pyramidRevealed: toArray(state.pyramidRevealed),
    pyramidResults: toArray(state.pyramidResults).map(result => ({
      ...result,
      matches: toArray(result.matches),
    })),
    pendingDrinkAssignments: toArray(state.pendingDrinkAssignments),
    pyramidPendingAssigners: toArray(state.pyramidPendingAssigners),
    settings: normalizedSettings,
  };
}

export interface RoomPlayer {
  id: string;
  name: string;
  ready: boolean;
}

export interface Room {
  hostId: string;
  status: "waiting" | "playing" | "finished";
  gameState?: GameState;
  players: Record<string, RoomPlayer>;
  createdAt: number;
}

export interface PendingAction {
  playerId: string;
  action: GameAction;
  timestamp: number;
}

// Generate a 4-letter room code
function generateRoomCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Exclude I and O to avoid confusion
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return code;
}

// Check if a room exists
export async function roomExists(roomCode: string): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  const snapshot = await get(roomRef(roomCode));
  return snapshot.exists();
}

// Create a new room
export async function createRoom(hostId: string, hostName: string): Promise<string> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase not configured");
  }

  // Generate unique room code
  let roomCode = generateRoomCode();
  let attempts = 0;
  while (await roomExists(roomCode) && attempts < 10) {
    roomCode = generateRoomCode();
    attempts++;
  }

  const room: Room = {
    hostId,
    status: "waiting",
    players: {
      [hostId]: {
        id: hostId,
        name: hostName,
        ready: true,
      },
    },
    createdAt: Date.now(),
  };

  await set(roomRef(roomCode), room);
  return roomCode;
}

// Join an existing room
export async function joinRoom(
  roomCode: string,
  playerId: string,
  playerName: string
): Promise<Room | null> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase not configured");
  }

  const snapshot = await get(roomRef(roomCode));
  if (!snapshot.exists()) {
    return null;
  }

  const room = snapshot.val() as Room;
  if (room.status !== "waiting") {
    throw new Error("Game already in progress");
  }

  // Check for duplicate names
  const existingNames = Object.values(room.players || {}).map((p) =>
    p.name.toLowerCase()
  );
  if (existingNames.includes(playerName.toLowerCase())) {
    throw new Error("Name already taken");
  }

  // Add player
  await set(ref(getDb(), `rooms/${roomCode}/players/${playerId}`), {
    id: playerId,
    name: playerName,
    ready: true,
  });

  return room;
}

// Leave a room
export async function leaveRoom(roomCode: string, playerId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const snapshot = await get(roomRef(roomCode));
  if (!snapshot.exists()) return;

  const room = snapshot.val() as Room;

  // If host leaves, delete the room
  if (room.hostId === playerId) {
    await remove(roomRef(roomCode));
  } else {
    // Otherwise just remove the player
    await remove(ref(getDb(), `rooms/${roomCode}/players/${playerId}`));
  }
}

// Start the game (host only)
export async function startGame(
  roomCode: string,
  hostId: string,
  initialGameState: GameState
): Promise<void> {
  console.log('[FB] startGame', { roomCode, hostId, phase: initialGameState.phase });
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase not configured");
  }

  const snapshot = await get(roomRef(roomCode));
  if (!snapshot.exists()) {
    throw new Error("Room not found");
  }

  const room = snapshot.val() as Room;
  if (room.hostId !== hostId) {
    throw new Error("Only host can start the game");
  }

  await update(roomRef(roomCode), {
    status: "playing",
    gameState: initialGameState,
  });
}

// Update game state (host only)
export async function updateGameState(
  roomCode: string,
  gameState: GameState
): Promise<void> {
  console.log('[FB] updateGameState', {
    roomCode,
    phase: gameState.phase,
    currentCard: gameState.currentCard ? `${gameState.currentCard.value} of ${gameState.currentCard.suit}` : null,
    playerCardsLengths: gameState.playerCards?.map(cards => cards.length),
    roundNumber: gameState.roundNumber,
  });
  if (!isFirebaseConfigured()) return;
  await set(gameStateRef(roomCode), gameState);
}

// Submit an action (non-host players)
export async function submitAction(
  roomCode: string,
  playerId: string,
  action: GameAction
): Promise<void> {
  console.log('[FB] submitAction', { roomCode, playerId, action });
  if (!isFirebaseConfigured()) return;
  await set(pendingActionRef(roomCode), {
    playerId,
    action,
    timestamp: Date.now(),
  } as PendingAction);
}

// Clear pending action (host)
export async function clearPendingAction(roomCode: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  await remove(pendingActionRef(roomCode));
}

// Subscribe to room changes
export function subscribeToRoom(
  roomCode: string,
  callback: (room: Room | null) => void
): () => void {
  if (!isFirebaseConfigured()) {
    callback(null);
    return () => {};
  }

  const unsubscribe = onValue(roomRef(roomCode), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as Room);
    } else {
      callback(null);
    }
  });

  return () => off(roomRef(roomCode));
}

// Subscribe to game state changes
export function subscribeToGameState(
  roomCode: string,
  callback: (state: GameState | null) => void
): () => void {
  if (!isFirebaseConfigured()) {
    callback(null);
    return () => {};
  }

  const unsubscribe = onValue(gameStateRef(roomCode), (snapshot) => {
    console.log('[FB] gameState listener fired', {
      exists: snapshot.exists(),
      currentCard: snapshot.exists() && snapshot.val()?.currentCard
        ? `${snapshot.val().currentCard.value} of ${snapshot.val().currentCard.suit}`
        : null,
    });
    if (snapshot.exists()) {
      callback(normalizeGameState(snapshot.val() as GameState));
    } else {
      callback(null);
    }
  });

  return () => off(gameStateRef(roomCode));
}

// Subscribe to pending actions (host only)
export function subscribeToPendingAction(
  roomCode: string,
  callback: (action: PendingAction | null) => void
): () => void {
  if (!isFirebaseConfigured()) {
    callback(null);
    return () => {};
  }

  const unsubscribe = onValue(pendingActionRef(roomCode), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as PendingAction);
    } else {
      callback(null);
    }
  });

  return () => off(pendingActionRef(roomCode));
}

// End game and cleanup
export async function endGame(roomCode: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  await update(roomRef(roomCode), { status: "finished" });
}

// Delete room
export async function deleteRoom(roomCode: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  await remove(roomRef(roomCode));
}

// Get room data once
export async function getRoom(roomCode: string): Promise<Room | null> {
  if (!isFirebaseConfigured()) return null;
  const snapshot = await get(roomRef(roomCode));
  if (snapshot.exists()) {
    return snapshot.val() as Room;
  }
  return null;
}
