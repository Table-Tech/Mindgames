import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
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
  dailyReminderHour: number;   // 0..23
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

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await getJSON<Partial<Preferences>>(KEY);
      if (saved) setPrefs({ ...DEFAULT_PREFS, ...saved });
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (loaded) setJSON(KEY, prefs);
  }, [prefs, loaded]);

  const setPref = useCallback(
    <K extends keyof Preferences>(k: K, v: Preferences[K]) => {
      setPrefs(p => ({ ...p, [k]: v }));
    },
    [],
  );

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
