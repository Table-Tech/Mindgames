// Firebase integration scaffold.
//
// The current implementation is a no-op so the UI can be built end-to-end.
// To wire real Firebase for cloud leaderboards + anonymous auth + stats
// sync, follow the TODOs below.
//
// Setup (the user does this in their own Firebase project):
//   1. yarn add @react-native-firebase/app @react-native-firebase/auth \
//                  @react-native-firebase/firestore
//   2. expo prebuild   (firebase requires the bare workflow or dev client)
//   3. Add GoogleService-Info.plist (iOS) and google-services.json (Android)
//      to the project root and reference them from app.json's
//      ios.googleServicesFile and android.googleServicesFile.
//   4. Anonymous auth must be enabled in the Firebase console.
//   5. Replace the stub bodies in this file with real SDK calls.
//
// Firestore layout (suggested):
//   /leaderboards/{game}/days/{yyyy-mm-dd}/scores/{uid}
//       { name, timeMs, guesses?, score?, createdAt: serverTimestamp() }
//   /users/{uid}
//       { name, totals: { sudoku: {...}, wordle: {...}, mahjong: {...} } }

import type { GameId } from '@/stats/stats';

export interface LeaderboardEntry {
  name: string;
  timeMs: number;
  guesses?: number;
  score?: number;
  // Set by the server in real Firestore — keep client-side null for now.
  createdAt?: number | null;
}

let configured = false;
let cachedUid: string | null = null;

export async function initFirebase(): Promise<void> {
  if (configured) return;
  configured = true;
  // TODO(firebase): no explicit init needed for the modular SDK with
  // GoogleService files in place. If you use the JS SDK instead, do:
  //   import { initializeApp } from 'firebase/app';
  //   initializeApp(config);
}

// Returns a stable per-device id. With real Firebase auth this is the
// anonymous-user uid; the stub just returns a UUID once and caches it.
export async function getOrCreateUser(): Promise<string> {
  if (cachedUid) return cachedUid;
  // TODO(firebase):
  //   import auth from '@react-native-firebase/auth';
  //   const cred = auth().currentUser ?? (await auth().signInAnonymously()).user;
  //   cachedUid = cred.uid;
  //   return cachedUid;
  cachedUid = 'local-' + Math.random().toString(36).slice(2, 10);
  return cachedUid;
}

export async function submitLeaderboardScore(
  game: GameId,
  date: string,
  entry: LeaderboardEntry,
): Promise<void> {
  await initFirebase();
  const uid = await getOrCreateUser();
  void uid; void game; void date; void entry;
  // TODO(firebase):
  //   import firestore from '@react-native-firebase/firestore';
  //   await firestore()
  //     .collection('leaderboards').doc(game)
  //     .collection('days').doc(date)
  //     .collection('scores').doc(uid)
  //     .set({ ...entry, createdAt: firestore.FieldValue.serverTimestamp() });
}

export async function fetchDailyLeaderboard(
  game: GameId,
  date: string,
  limit = 50,
): Promise<LeaderboardEntry[]> {
  await initFirebase();
  void game; void date; void limit;
  // TODO(firebase):
  //   const snap = await firestore()
  //     .collection('leaderboards').doc(game)
  //     .collection('days').doc(date)
  //     .collection('scores')
  //     .orderBy('timeMs', 'asc')
  //     .limit(limit)
  //     .get();
  //   return snap.docs.map(d => d.data() as LeaderboardEntry);
  return [];
}

export async function syncStatsTotals(
  totals: Record<GameId, { played: number; won: number }>,
): Promise<void> {
  await initFirebase();
  const uid = await getOrCreateUser();
  void uid; void totals;
  // TODO(firebase):
  //   await firestore().collection('users').doc(uid).set({ totals }, { merge: true });
}
