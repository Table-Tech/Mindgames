import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import type { GameId, PlayModeKind } from '@/core/game';
import { todayISO } from '@/core/date';
import { maybeShowInterstitial } from '@/ads/interstitial';
import { useEntitlements } from '@/iap/EntitlementsProvider';
import { submitScore } from '@/leaderboard/leaderboard';
import { recordFinish } from '@/stats/stats';
import { usePreferences } from '@/prefs/PreferencesProvider';

export interface FinishResult {
  won: boolean;
  timeMs: number;
  difficulty?: string;
  score?: number;
  guesses?: number;
}

// Everything that happens when any game ends: maybe an interstitial, record
// the stats, submit a winning daily to the leaderboard (asking for a name the
// first time), then show the result. Games only call `finish(result)`.
export function useFinishFlow(game: GameId, mode: PlayModeKind) {
  const { adsRemoved } = useEntitlements();
  const { prefs, setPref } = usePreferences();
  const [resultVisible, setResultVisible] = useState(false);
  const [nameVisible, setNameVisible] = useState(false);
  const pendingTimeRef = useRef<number | null>(null);

  const submit = useCallback(
    (name: string, timeMs: number) => submitScore({ name, timeMs, date: todayISO(), game }),
    [game],
  );

  const finish = useCallback(
    async (r: FinishResult) => {
      const showAd = await maybeShowInterstitial(adsRemoved);
      if (showAd) Alert.alert('Ad', '(Interstitial would show here)');

      await recordFinish({
        game,
        mode,
        outcome: r.won ? 'won' : 'lost',
        timeMs: r.timeMs,
        date: todayISO(),
        difficulty: r.difficulty,
        score: r.score,
        guesses: r.guesses,
      });

      if (r.won && mode === 'daily') {
        pendingTimeRef.current = r.timeMs;
        if (!prefs.playerName) {
          setNameVisible(true);
          return;
        }
        await submit(prefs.playerName, r.timeMs);
      }
      setResultVisible(true);
    },
    [adsRemoved, game, mode, prefs.playerName, submit],
  );

  // Props for <NameInputModal {...nameModal} />.
  const nameModal = {
    visible: nameVisible,
    title: 'Save your daily score',
    message:
      "We'll remember your name for future daily scores. You can change it later in Settings.",
    placeholder: 'Your name',
    defaultValue: prefs.playerName,
    onSubmit: async (name: string) => {
      setNameVisible(false);
      setPref('playerName', name);
      const timeMs = pendingTimeRef.current;
      if (timeMs != null) await submit(name || 'Anon', timeMs);
      setResultVisible(true);
    },
    onDismiss: () => {
      setNameVisible(false);
      setResultVisible(true);
    },
  };

  return {
    finish,
    nameModal,
    resultVisible,
    hideResult: useCallback(() => setResultVisible(false), []),
  };
}
