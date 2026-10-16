import { useCallback, useRef, useState } from 'react';
import type { GameId, PlayModeKind } from '@/core/game';
import { todayISO } from '@/core/date';
import { countFinishedPuzzle, interstitialDue, showInterstitialIfDue } from '@/ads/interstitial';
import { track } from '@/analytics/analytics';
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

// Lets the result modal fade out before a full-screen ad is presented.
const MODAL_FADE_MS = 300;

// Everything that happens when any game ends: record the stats, submit a
// winning daily to the leaderboard (asking for a name the first time), then
// show the result. Games call `finish(result)` when the game ends and
// `leaveResult(next)` from the result buttons; a due interstitial plays there,
// at the break between puzzles, after the progress is safely saved.
export function useFinishFlow(game: GameId, mode: PlayModeKind) {
  const { adsRemoved, loading: entitlementsLoading } = useEntitlements();
  const { prefs, setPref } = usePreferences();
  const [resultVisible, setResultVisible] = useState(false);
  const [nameVisible, setNameVisible] = useState(false);
  const pendingTimeRef = useRef<number | null>(null);
  const leavingRef = useRef(false);

  const submit = useCallback(
    (name: string, timeMs: number) => submitScore({ name, timeMs, date: todayISO(), game }),
    [game],
  );

  const finish = useCallback(
    async (r: FinishResult) => {
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
      await countFinishedPuzzle();
      track('game_end', {
        game,
        mode,
        outcome: r.won ? 'won' : 'lost',
        duration_s: Math.round(r.timeMs / 1000),
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
    [game, mode, prefs.playerName, submit],
  );

  // Closes the result and runs `next` (new game / back), with a due
  // interstitial in between. Paying users, or users whose purchases are still
  // loading, never see one.
  const leaveResult = useCallback(
    async (next: () => void) => {
      if (leavingRef.current) return;
      leavingRef.current = true;
      setResultVisible(false);
      try {
        const noAds = adsRemoved || entitlementsLoading;
        if (await interstitialDue(noAds)) {
          await new Promise(resolve => setTimeout(resolve, MODAL_FADE_MS));
          await showInterstitialIfDue(noAds);
        }
      } catch {
        // Ads must never block leaving the result.
      } finally {
        leavingRef.current = false;
      }
      next();
    },
    [adsRemoved, entitlementsLoading],
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
    leaveResult,
    hideResult: useCallback(() => setResultVisible(false), []),
  };
}
