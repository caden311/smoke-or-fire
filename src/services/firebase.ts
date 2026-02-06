import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  remove,
  update,
  push,
  off,
  Database,
  DatabaseReference,
} from "firebase/database";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB_dEQhRWiZVTBq0bHgGbuVVcwwmXrUXsQ",
  authDomain: "smoke-or-fire.firebaseapp.com",
  databaseURL: "https://smoke-or-fire-default-rtdb.firebaseio.com",
  projectId: "smoke-or-fire",
  storageBucket: "smoke-or-fire.firebasestorage.app",
  messagingSenderId: "611763859270",
  appId: "1:611763859270:web:b0ce8408a1bea9a0c17f47",
  measurementId: "G-6WM76TE3E5",
};

let app: FirebaseApp | null = null;
let database: Database | null = null;

export function isFirebaseConfigured(): boolean {
  return !firebaseConfig.apiKey.startsWith("YOUR_");
}

export function initializeFirebase(): boolean {
  if (!isFirebaseConfigured()) {
    console.warn(
      "Firebase not configured. Edit src/services/firebase.ts to enable multiplayer."
    );
    return false;
  }

  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
  } else {
    app = getApps()[0];
    database = getDatabase(app);
  }
  return true;
}

export function getDb(): Database {
  if (!database) {
    if (!initializeFirebase()) {
      throw new Error("Firebase not configured");
    }
  }
  return database!;
}

export function roomRef(roomCode: string): DatabaseReference {
  return ref(getDb(), `rooms/${roomCode}`);
}

export function playersRef(roomCode: string): DatabaseReference {
  return ref(getDb(), `rooms/${roomCode}/players`);
}

export function gameStateRef(roomCode: string): DatabaseReference {
  return ref(getDb(), `rooms/${roomCode}/gameState`);
}

export function pendingActionRef(roomCode: string): DatabaseReference {
  return ref(getDb(), `rooms/${roomCode}/pendingAction`);
}

export { ref, set, get, onValue, remove, update, push, off };
