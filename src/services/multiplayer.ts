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
import { GameState, GameAction, Player, Card } from "../types";

// Firebase doesn't store empty arrays - they come back as undefined
// This function ensures all array fields have proper defaults
function normalizeGameState(state: GameState | null): GameState | null {
  if (!state) return null;
  return {
    ...state,
    turnResults: state.turnResults ?? [],
    playerCards: (state.playerCards ?? []).map(cards => cards ?? []),
    pyramidCards: state.pyramidCards ?? [],
    pyramidRevealed: state.pyramidRevealed ?? [],
    pyramidResults: state.pyramidResults ?? [],
    deck: state.deck ?? [],
    players: state.players ?? [],
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
  if (!isFirebaseConfigured()) return;
  await set(gameStateRef(roomCode), gameState);
}

// Submit an action (non-host players)
export async function submitAction(
  roomCode: string,
  playerId: string,
  action: GameAction
): Promise<void> {
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
