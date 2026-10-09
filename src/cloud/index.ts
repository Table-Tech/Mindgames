// Entry point for cloud features. The Firebase-backed implementation is only
// loaded when its native modules exist; in Expo Go every call is a safe no-op,
// so the rest of the app runs unchanged.

import { isExpoGo } from '@/core/runtime';
import type { RemotePreferencesSource } from '@/prefs/prefsStore';
import type { SyncResult } from './cloudSave';

type CloudModule = typeof import('./cloudSave');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const cloud: CloudModule | null = isExpoGo ? null : require('./cloudSave');

export const cloudAvailable = cloud !== null;

export function startCloudSync(): () => void {
  return cloud ? cloud.startCloudSync() : () => {};
}

export const cloudPreferencesSource: RemotePreferencesSource | undefined =
  cloud?.cloudPreferencesSource;

export async function fullSync(): Promise<SyncResult> {
  return cloud ? cloud.fullSync() : { ok: false, error: 'Cloud sync is not available in Expo Go.' };
}

export async function flushPush(): Promise<void> {
  await cloud?.flushPush();
}

export async function getLastSyncedAt(): Promise<number | null> {
  return cloud ? cloud.getLastSyncedAt() : null;
}

export async function deleteCloudData(): Promise<void> {
  await cloud?.deleteCloudData();
}
