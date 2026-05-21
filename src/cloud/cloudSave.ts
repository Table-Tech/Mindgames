import { getJSON, setJSON } from '@/storage/storage';
import type { FinishRecord } from '@/stats/stats';
import { pullCloudSave, pushCloudSave } from './firebase';

const RECORDS_KEY = 'stats.records.v1';
const PREFS_KEY = 'preferences.v1';
const LAST_SYNCED_KEY = 'cloud.lastSyncedAt';

interface LocalPrefsShape {
  playerName?: string;
  onboardingSeen?: Record<string, boolean>;
}

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
  const local = (await getJSON<FinishRecord[]>(RECORDS_KEY)) ?? [];
  if (!cloud) {
    return { merged: local, cloudPlayerName: null, cloudOnboardingSeen: null };
  }
  const merged = mergeRecords(local, cloud.statsRecords ?? []);
  await setJSON(RECORDS_KEY, merged);
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
  const records = (await getJSON<FinishRecord[]>(RECORDS_KEY)) ?? [];
  const prefs = (await getJSON<LocalPrefsShape>(PREFS_KEY)) ?? {};
  await pushCloudSave({
    statsRecords: records,
    playerName: prefs.playerName,
    onboardingSeen: prefs.onboardingSeen,
  });
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
