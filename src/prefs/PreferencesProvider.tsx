import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { syncedDataChanged } from '@/core/events';
import {
  cloudSyncedSubset,
  DEFAULT_PREFS,
  loadPreferences,
  savePreferences,
  type Preferences,
  type RemotePreferencesSource,
} from './prefsStore';

export { DEFAULT_PREFS } from './prefsStore';
export type { Preferences, ThemeMode } from './prefsStore';

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

interface Props {
  children: React.ReactNode;
  /** Optional source to restore synced prefs from (injected; e.g. the cloud). */
  remote?: RemotePreferencesSource;
}

export function PreferencesProvider({ children, remote }: Props) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);
  const prevSyncedRef = useRef<string>('');

  useEffect(() => {
    (async () => {
      setPrefs(await loadPreferences());
      setLoaded(true);

      // Fire-and-forget restore. If the remote has a player name or
      // onboarding flags we haven't seen, fold them in. Local non-empty
      // values always win, so re-installs benefit but active devices don't
      // get overwritten.
      if (!remote) return;
      try {
        const result = await remote.pull();
        if (!result) return;
        setPrefs(p => ({
          ...p,
          playerName: p.playerName ? p.playerName : (result.playerName ?? p.playerName),
          onboardingSeen: { ...(result.onboardingSeen ?? {}), ...p.onboardingSeen },
        }));
      } catch {
        // offline / not signed in / not configured — fine
      }
    })();
  }, [remote]);

  useEffect(() => {
    if (!loaded) return;
    savePreferences(prefs);

    // Only announce a change when a synced field actually changed so
    // device-local toggles don't generate network traffic.
    const syncedSnapshot = JSON.stringify(cloudSyncedSubset(prefs));
    if (prevSyncedRef.current && prevSyncedRef.current !== syncedSnapshot) {
      syncedDataChanged.emit();
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
