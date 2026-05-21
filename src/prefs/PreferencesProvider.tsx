import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getJSON, setJSON } from '@/storage/storage';
import { pullAndMerge, schedulePush } from '@/cloud/cloudSave';

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

const KEY = 'preferences.v1';

interface PreferencesContextValue {
  prefs: Preferences;
  setPref: <K extends keyof Preferences>(k: K, v: Preferences[K]) => void;
  markOnboardingSeen: (id: string) => void;
  resetPrefs: () => void;
  loaded: boolean;
}

const Ctx = createContext<PreferencesContextValue>({
  prefs: DEFAULT_PREFS,
  setPref: () => {},
  markOnboardingSeen: () => {},
  resetPrefs: () => {},
  loaded: false,
});

// Pref keys that are mirrored to the cloud. Other keys (theme, sound, etc.)
// are intentionally device-local.
const CLOUD_SYNCED_KEYS: (keyof Preferences)[] = ['playerName', 'onboardingSeen'];

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);
  const prevSyncedRef = useRef<string>('');

  useEffect(() => {
    (async () => {
      const saved = await getJSON<Partial<Preferences>>(KEY);
      const initial = saved ? { ...DEFAULT_PREFS, ...saved } : DEFAULT_PREFS;
      setPrefs(initial);
      setLoaded(true);

      // Fire-and-forget initial cloud sync. If cloud has a player name or
      // onboarding flags we haven't seen, fold them in. Local non-empty
      // values always win, so re-installs benefit but active devices don't
      // get overwritten.
      (async () => {
        try {
          const result = await pullAndMerge();
          if (!result) return;
          setPrefs(p => {
            const nextName =
              p.playerName && p.playerName.length > 0
                ? p.playerName
                : (result.cloudPlayerName ?? p.playerName);
            const nextOnboarding = {
              ...(result.cloudOnboardingSeen ?? {}),
              ...p.onboardingSeen, // local marks always win
            };
            return { ...p, playerName: nextName, onboardingSeen: nextOnboarding };
          });
        } catch {
          // offline / not signed in / Firebase not configured yet — fine
        }
      })();
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setJSON(KEY, prefs);

    // Only push when a cloud-synced field actually changed so device-local
    // setting toggles don't generate network traffic.
    const syncedSnapshot = JSON.stringify(
      Object.fromEntries(CLOUD_SYNCED_KEYS.map(k => [k, prefs[k]])),
    );
    if (prevSyncedRef.current && prevSyncedRef.current !== syncedSnapshot) {
      schedulePush();
    }
    prevSyncedRef.current = syncedSnapshot;
  }, [prefs, loaded]);

  const setPref = useCallback(<K extends keyof Preferences>(k: K, v: Preferences[K]) => {
    setPrefs(p => ({ ...p, [k]: v }));
  }, []);

  const markOnboardingSeen = useCallback((id: string) => {
    setPrefs(p => ({ ...p, onboardingSeen: { ...p.onboardingSeen, [id]: true } }));
  }, []);

  const resetPrefs = useCallback(() => {
    setPrefs(DEFAULT_PREFS);
  }, []);

  return (
    <Ctx.Provider value={{ prefs, setPref, markOnboardingSeen, resetPrefs, loaded }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePreferences() {
  return useContext(Ctx);
}
