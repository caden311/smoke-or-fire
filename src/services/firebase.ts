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

// Firebase configuration — values injected at build time from EXPO_PUBLIC_* env vars
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ?? "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
};

let app: FirebaseApp | null = null;
let database: Database | null = null;

export function isFirebaseConfigured(): boolean {
  return !!firebaseConfig.apiKey;
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

export function configRef(): DatabaseReference {
  return ref(getDb(), "config");
}

export interface RemoteConfig {
  multiplayerEnabled: boolean;
  adsEnabled: boolean;
  defaultChallengeMode: boolean;
}

export async function fetchRemoteConfig(): Promise<RemoteConfig> {
  try {
    console.log("[FB] Fetching remote config...");
    const snapshot = await get(configRef());
    const val = snapshot.val();
    console.log("[FB] Remote config raw value:", val);
    if (!val) {
      return { multiplayerEnabled: true, adsEnabled: false, defaultChallengeMode: false };
    }
    // Handle string "false"/"true" from Firebase console
    const multiplayerEnabled = val.multiplayerEnabled;
    const adsEnabled = val.adsEnabled;
    const defaultChallengeMode = val.defaultChallengeMode;
    return {
      multiplayerEnabled: multiplayerEnabled === true || multiplayerEnabled === "true",
      adsEnabled: adsEnabled === true || adsEnabled === "true",
      defaultChallengeMode: defaultChallengeMode === true || defaultChallengeMode === "true",
    };
  } catch (error) {
    console.error("[FB] Failed to fetch remote config:", error);
    throw error; // Re-throw so caller's .catch() still works
  }
}

export { ref, set, get, onValue, remove, update, push, off };
