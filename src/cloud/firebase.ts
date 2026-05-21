// Firebase integration for cloud leaderboards + anonymous auth + stats sync.
//
// Uses the @react-native-firebase modular API (v22+). The native side picks
// up GoogleService-Info.plist / google-services.json automatically through
// the config plugin in app.json, so no explicit initializeApp() is needed.
//
// Firestore layout:
//   /leaderboards/{game}/days/{yyyy-mm-dd}/scores/{uid}
//       { name, timeMs, guesses?, score?, createdAt: serverTimestamp() }
//   /users/{uid}
//       { totals: { sudoku: {...}, wordle: {...}, mahjong: {...} } }

import { getApp } from '@react-native-firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from '@react-native-firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit as fsLimit,
  serverTimestamp,
} from '@react-native-firebase/firestore';

import type { GameId } from '@/stats/stats';
import type { FinishRecord } from '@/stats/stats';

export interface CloudSavePayload {
  statsRecords?: FinishRecord[];
  playerName?: string;
  onboardingSeen?: Record<string, boolean>;
  totals?: Record<GameId, { played: number; won: number }>;
  updatedAt?: number | null;
}

export interface LeaderboardEntry {
  name: string;
  timeMs: number;
  guesses?: number;
  score?: number;
  createdAt?: number | null;
}

let signInPromise: Promise<string> | null = null;
let cachedUid: string | null = null;

export async function initFirebase(): Promise<void> {
  // Forces native init by touching the default app. Throws clearly if the
  // google-services files are missing instead of failing later inside a write.
  getApp();
}

// Returns the anonymous-auth uid, signing in lazily on first call. Concurrent
// callers share a single in-flight sign-in.
export async function getOrCreateUser(): Promise<string> {
  if (cachedUid) return cachedUid;
  if (signInPromise) return signInPromise;

  signInPromise = (async () => {
    const auth = getAuth();
    const current = auth.currentUser;
    if (current) {
      cachedUid = current.uid;
      return current.uid;
    }
    const cred = await signInAnonymously(auth);
    cachedUid = cred.user.uid;
    return cachedUid;
  })();

  try {
    return await signInPromise;
  } finally {
    signInPromise = null;
  }
}

// Subscribe to auth state changes so a sign-out (eg. after token revocation)
// invalidates our cache. Returns the unsubscribe function.
export function watchAuthState(): () => void {
  return onAuthStateChanged(getAuth(), user => {
    cachedUid = user?.uid ?? null;
  });
}

export async function submitLeaderboardScore(
  game: GameId,
  date: string,
  entry: LeaderboardEntry,
): Promise<void> {
  const uid = await getOrCreateUser();
  const db = getFirestore();
  const scoreDoc = doc(collection(doc(collection(db, 'leaderboards'), game), 'days'), date);
  await setDoc(
    doc(collection(scoreDoc, 'scores'), uid),
    {
      name: entry.name,
      timeMs: entry.timeMs,
      ...(entry.guesses !== undefined && { guesses: entry.guesses }),
      ...(entry.score !== undefined && { score: entry.score }),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function fetchDailyLeaderboard(
  game: GameId,
  date: string,
  limit = 50,
): Promise<LeaderboardEntry[]> {
  const db = getFirestore();
  const scoresCol = collection(
    doc(collection(doc(collection(db, 'leaderboards'), game), 'days'), date),
    'scores',
  );
  const snap = await getDocs(query(scoresCol, orderBy('timeMs', 'asc'), fsLimit(limit)));
  return snap.docs.map(d => {
    const data = d.data();
    return {
      name: data.name,
      timeMs: data.timeMs,
      guesses: data.guesses,
      score: data.score,
      // Firestore Timestamp → millis epoch (null while pending serverTimestamp resolution).
      createdAt: data.createdAt?.toMillis?.() ?? null,
    };
  });
}

export async function syncStatsTotals(
  totals: Record<GameId, { played: number; won: number }>,
): Promise<void> {
  const uid = await getOrCreateUser();
  const db = getFirestore();
  await setDoc(doc(collection(db, 'users'), uid), { totals }, { merge: true });
}

// Whole-document cloud save / load on /users/{uid}. Uses merge:true so each
// field can be written independently without clobbering siblings.
export async function pushCloudSave(payload: CloudSavePayload): Promise<void> {
  const uid = await getOrCreateUser();
  const db = getFirestore();
  await setDoc(
    doc(collection(db, 'users'), uid),
    {
      ...(payload.statsRecords !== undefined && { statsRecords: payload.statsRecords }),
      ...(payload.playerName !== undefined && { playerName: payload.playerName }),
      ...(payload.onboardingSeen !== undefined && { onboardingSeen: payload.onboardingSeen }),
      ...(payload.totals !== undefined && { totals: payload.totals }),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function pullCloudSave(): Promise<CloudSavePayload | null> {
  const uid = await getOrCreateUser();
  const db = getFirestore();
  const snap = await getDoc(doc(collection(db, 'users'), uid));
  if (!snap.exists) return null;
  const data = snap.data() ?? {};
  return {
    statsRecords: Array.isArray(data.statsRecords) ? (data.statsRecords as FinishRecord[]) : undefined,
    playerName: typeof data.playerName === 'string' ? data.playerName : undefined,
    onboardingSeen:
      data.onboardingSeen && typeof data.onboardingSeen === 'object'
        ? (data.onboardingSeen as Record<string, boolean>)
        : undefined,
    totals: data.totals as CloudSavePayload['totals'],
    updatedAt: data.updatedAt?.toMillis?.() ?? null,
  };
}
