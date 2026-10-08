import { getJSON, setJSON } from '@/storage/storage';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface Preferences {
  themeMode: ThemeMode;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  // Game-specific
  sudokuAutoCleanupNotes: boolean;
  sudokuHighlightMistakes: boolean;
  wordleHardMode: boolean;
  // Notifications
  dailyReminderEnabled: boolean;
  dailyReminderHour: number; // 0..23
  dailyReminderMinute: number; // 0..59
  // Username (cached so leaderboard doesn't prompt every time)
  playerName: string;
  // Onboarding flag(s)
  onboardingSeen: Record<string, boolean>;
}

export const DEFAULT_PREFS: Preferences = {
  themeMode: 'system',
  soundEnabled: true,
  hapticsEnabled: true,
  sudokuAutoCleanupNotes: true,
  sudokuHighlightMistakes: true,
  wordleHardMode: false,
  dailyReminderEnabled: false,
  dailyReminderHour: 19,
  dailyReminderMinute: 0,
  playerName: '',
  onboardingSeen: {},
};

// Pref keys that are mirrored to the cloud. Other keys (theme, sound, etc.)
// are intentionally device-local.
export const CLOUD_SYNCED_KEYS = ['playerName', 'onboardingSeen'] as const;
export type CloudSyncedPrefs = Pick<Preferences, (typeof CLOUD_SYNCED_KEYS)[number]>;

const KEY = 'preferences.v1';

export async function loadPreferences(): Promise<Preferences> {
  const saved = await getJSON<Partial<Preferences>>(KEY);
  return saved ? { ...DEFAULT_PREFS, ...saved } : DEFAULT_PREFS;
}

export async function savePreferences(prefs: Preferences): Promise<void> {
  await setJSON(KEY, prefs);
}

export function cloudSyncedSubset(prefs: Preferences): CloudSyncedPrefs {
  return { playerName: prefs.playerName, onboardingSeen: prefs.onboardingSeen };
}

/** Where synced preferences can be restored from (e.g. the cloud save). */
export interface RemotePreferencesSource {
  pull(): Promise<Partial<CloudSyncedPrefs> | null>;
}
