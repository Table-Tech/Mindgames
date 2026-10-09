import { getJSON, setJSON } from '@/storage/storage';
import { syncedDataChanged } from '@/core/events';
import { getRecords, saveRecords, type FinishRecord } from '@/stats/stats';
import { leaderboardScoreSubmitted, loadLeaderboard } from '@/leaderboard/leaderboard';
import {
  cloudSyncedSubset,
  loadPreferences,
  type RemotePreferencesSource,
} from '@/prefs/prefsStore';
import {
  deleteCloudData as deleteRemote,
  pullCloudSave,
  pushCloudSave,
  submitLeaderboardScore,
} from './firebase';

const LAST_SYNCED_KEY = 'cloud.lastSyncedAt';

// Composite key for record dedupe. Two records that share the exact same
// game/mode/date/outcome/timeMs/score/difficulty/guesses are treated as the
// same submission — even if one is local and the other arrived from another
// device.
function recordKey(r: FinishRecord): string {
  return [
    r.game,
    r.mode,
    r.date,
    r.outcome,
    r.timeMs,
    r.score ?? '',
    r.difficulty ?? '',
    r.guesses ?? '',
  ].join('|');
}

function mergeRecords(local: FinishRecord[], cloud: FinishRecord[]): FinishRecord[] {
  const map = new Map<string, FinishRecord>();
  for (const r of local) map.set(recordKey(r), r);
  for (const r of cloud) {
    const k = recordKey(r);
    if (!map.has(k)) map.set(k, r);
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.timeMs - b.timeMs;
  });
}

export interface PullResult {
  merged: FinishRecord[];
  cloudPlayerName: string | null;
  cloudOnboardingSeen: Record<string, boolean> | null;
}

// Pull the cloud doc, merge with local stats records, persist the merge
// locally, and return the cloud-only fields the caller may want to apply
// to other local state (preferences).
export async function pullAndMerge(): Promise<PullResult | null> {
  const cloud = await pullCloudSave();
  const local = await getRecords();
  if (!cloud) {
    return { merged: local, cloudPlayerName: null, cloudOnboardingSeen: null };
  }
  const merged = mergeRecords(local, cloud.statsRecords ?? []);
  await saveRecords(merged);
  await setJSON(LAST_SYNCED_KEY, Date.now());
  return {
    merged,
    cloudPlayerName: cloud.playerName ?? null,
    cloudOnboardingSeen: cloud.onboardingSeen ?? null,
  };
}

// Push the current local snapshot (records + cloud-synced prefs subset) to
// Firestore. Reads from AsyncStorage so callers don't have to thread state.
export async function pushCloudSnapshot(): Promise<void> {
  const records = await getRecords();
  const prefs = cloudSyncedSubset(await loadPreferences());
  await pushCloudSave({ statsRecords: records, ...prefs });
  await setJSON(LAST_SYNCED_KEY, Date.now());
}

// Debounced push so rapid successive changes (e.g. typing a name) result in
// a single Firestore write.
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPush: Promise<void> | null = null;

export function schedulePush(delayMs = 1500): void {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    pendingPush = pushCloudSnapshot()
      .catch(e => {
        // eslint-disable-next-line no-console
        console.warn('cloud push failed', e);
      })
      .finally(() => {
        pendingPush = null;
      });
  }, delayMs);
}

// Force a push immediately, flushing any scheduled debounce.
export async function flushPush(): Promise<void> {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  if (pendingPush) await pendingPush;
  try {
    await pushCloudSnapshot();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('cloud push failed', e);
    throw e;
  }
}

export async function getLastSyncedAt(): Promise<number | null> {
  return getJSON<number>(LAST_SYNCED_KEY);
}

export interface SyncResult {
  ok: boolean;
  error?: string;
  result?: PullResult;
}

// Full sync: pull → merge → push the merged snapshot back so cloud stays
// authoritative for the union. Used on app start and via the manual button.
export async function fullSync(): Promise<SyncResult> {
  try {
    const result = await pullAndMerge();
    await pushCloudSnapshot();
    return { ok: true, result: result ?? undefined };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}

// Restores synced preferences from the cloud save; injected into
// PreferencesProvider so preferences don't depend on Firebase.
export const cloudPreferencesSource: RemotePreferencesSource = {
  async pull() {
    const result = await pullAndMerge();
    if (!result) return null;
    return {
      playerName: result.cloudPlayerName ?? undefined,
      onboardingSeen: result.cloudOnboardingSeen ?? undefined,
    };
  },
};

// Wires local data events to the cloud. Call once at app start; returns an
// unsubscribe function.
export function startCloudSync(): () => void {
  const offData = syncedDataChanged.on(() => schedulePush());
  const offScores = leaderboardScoreSubmitted.on(entry => {
    if (!entry.game) return;
    submitLeaderboardScore(entry.game, entry.date, {
      name: entry.name,
      timeMs: entry.timeMs,
    }).catch(() => {});
  });
  return () => {
    offData();
    offScores();
  };
}

// Deletes this device's cloud copy (save + submitted daily scores + account).
// Cancels any pending push first so the data isn't re-uploaded right away.
export async function deleteCloudData(): Promise<void> {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  if (pendingPush) await pendingPush;
  const scores = (await loadLeaderboard()).flatMap(e =>
    e.game ? [{ game: e.game, date: e.date }] : [],
  );
  await deleteRemote(scores);
}
