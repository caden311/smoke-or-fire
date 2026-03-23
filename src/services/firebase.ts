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

// Firebase web config — these values are public identifiers, not secrets.
// Firebase security comes from Security Rules, not from hiding this config.
// See: https://firebase.google.com/docs/projects/api-keys
const firebaseConfig = {
  apiKey: "AIzaSyC1wt-8t3GhPYTBIQ5MaIL5Q_oYKIhCDxQ",
  authDomain: "smoke-or-fire.firebaseapp.com",
  databaseURL: "https://smoke-or-fire-default-rtdb.firebaseio.com",
  projectId: "smoke-or-fire",
  storageBucket: "smoke-or-fire.firebasestorage.app",
  messagingSenderId: "611763859270",
  appId: "1:611763859270:web:b0f581742aecf84ec17f47",
  measurementId: "G-8MZ63Q00CR",
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
