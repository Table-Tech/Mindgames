import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/fonts';
import { Body, Chunky, Display, formatClock, IconButton, ScreenHeader } from '@/ui/kit';
import { WordleGrid } from '@/games/wordle/WordleGrid';
import { Keyboard } from '@/games/wordle/Keyboard';
import {
  dailyAnswer,
  evaluate,
  keyboardStates,
  randomAnswer,
  violatesHardMode,
} from '@/games/wordle/engine';
import { isValidWord } from '@/games/wordle/words';
import { clearGame, loadGame, saveGame } from '@/games/wordle/persistence';
import type { Guess, WordleMode, WordleState } from '@/games/wordle/types';
import { MAX_GUESSES, WORD_LENGTH } from '@/games/wordle/types';
import { AdBanner } from '@/ads/AdBanner';
import { maybeShowInterstitial } from '@/ads/interstitial';
import { useEntitlements } from '@/iap/EntitlementsProvider';
import { submitScore, todayISO } from '@/leaderboard/leaderboard';
import { recordFinish } from '@/stats/stats';
import { useFeedback } from '@/feedback/useFeedback';
import { usePreferences } from '@/prefs/PreferencesProvider';
import { ResultModal } from '@/components/ResultModal';
import { NameInputModal } from '@/components/NameInputModal';
import { Onboarding } from '@/components/Onboarding';
import { WORDLE_ONBOARDING } from '@/onboarding/steps';
import { useOnboarding } from '@/onboarding/useOnboarding';
import { useNavigation } from '@react-navigation/native';

interface Props {
  mode: WordleMode;
}

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

const newState = (mode: WordleMode): WordleState => ({
  answer: mode.kind === 'daily' ? dailyAnswer() : randomAnswer(),
  guesses: [],
  current: '',
  startedAt: Date.now(),
  finishedAt: null,
  outcome: 'playing',
});

export function WordleScreen({ mode }: Props) {
  const { colors, isDark } = useTheme();
  const { adsRemoved } = useEntitlements();
  const fb = useFeedback();
  const { prefs, setPref } = usePreferences();
  const navigation = useNavigation();

  const [state, setState] = useState<WordleState | null>(null);
  const [resultVisible, setResultVisible] = useState(false);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const pendingDailyRef = React.useRef<{ timeMs: number } | null>(null);
  const onboarding = useOnboarding('wordle');
  const [toast, setToast] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const finishHandled = useRef(false);

  // Restore (or create) the game on mount / mode change.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await loadGame(mode);
      if (cancelled) return;
      if (saved) {
        const stillTodaysDaily = mode.kind !== 'daily' || saved.answer === dailyAnswer();
        if (stillTodaysDaily) {
          setState(saved);
          finishHandled.current = saved.outcome !== 'playing';
          return;
        }
      }
      setState(newState(mode));
      finishHandled.current = false;
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  // Live timer while playing.
  useEffect(() => {
    if (!state || state.outcome !== 'playing') return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state]);

  // Persist on every state change.
  useEffect(() => {
    if (!state) return;
    saveGame(mode, state);
  }, [mode, state]);

  const letterStates = useMemo(() => (state ? keyboardStates(state.guesses) : {}), [state]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(t => (t === msg ? null : t)), 1600);
  };

  const onKey = useCallback(
    (k: string) => {
      if (!state || state.outcome !== 'playing') return;

      if (k === 'BACK') {
        fb.tap();
        setState(s => (s ? { ...s, current: s.current.slice(0, -1) } : s));
        return;
      }

      if (k === 'ENTER') {
        if (state.current.length < WORD_LENGTH) {
          fb.wrong();
          showToast('Not enough letters');
          return;
        }
        const word = state.current.toLowerCase();
        if (!isValidWord(word)) {
          fb.wrong();
          showToast('Not in word list');
          return;
        }
        if (prefs.wordleHardMode) {
          const violation = violatesHardMode(word, state.guesses);
          if (violation) {
            fb.wrong();
            showToast(violation);
            return;
          }
        }
        const states = evaluate(word, state.answer);
        const guess: Guess = { word, states };
        const guesses = [...state.guesses, guess];
        const solved = states.every(s => s === 'correct');
        const exhausted = !solved && guesses.length >= MAX_GUESSES;
        if (solved) fb.win();
        else if (exhausted) fb.lose();
        else fb.correct();
        setState({
          ...state,
          guesses,
          current: '',
          finishedAt: solved || exhausted ? Date.now() : null,
          outcome: solved ? 'won' : exhausted ? 'lost' : 'playing',
        });
        return;
      }

      // Letter
      if (/^[a-z]$/.test(k) && state.current.length < WORD_LENGTH) {
        fb.tap();
        setState(s => (s ? { ...s, current: s.current + k } : s));
      }
    },
    [state],
  );

  // Run finish flow once when outcome becomes terminal.
  useEffect(() => {
    if (!state || state.outcome === 'playing' || finishHandled.current) return;
    finishHandled.current = true;
    (async () => {
      const timeMs = (state.finishedAt ?? Date.now()) - state.startedAt;
      const shouldInterstitial = await maybeShowInterstitial(adsRemoved);
      if (shouldInterstitial) Alert.alert('Ad', '(Interstitial would show here)');

      await recordFinish({
        game: 'wordle',
        mode: mode.kind,
        outcome: state.outcome === 'won' ? 'won' : 'lost',
        timeMs,
        date: todayISO(),
        guesses: state.guesses.length,
      });

      if (state.outcome === 'won' && mode.kind === 'daily') {
        pendingDailyRef.current = { timeMs };
        if (!prefs.playerName) {
          setNameModalVisible(true);
          return;
        }
        await submitScore({ name: prefs.playerName, timeMs, date: todayISO(), game: 'wordle' });
      }
      setResultVisible(true);
    })();
  }, [state, adsRemoved, mode, prefs.playerName]);

  const startNewGame = useCallback(async () => {
    await clearGame(mode);
    setState(newState(mode));
    finishHandled.current = false;
  }, [mode]);

  if (!state) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  const elapsed =
    state.outcome === 'playing'
      ? now - state.startedAt
      : (state.finishedAt ?? state.startedAt) - state.startedAt;
  const guessNo = Math.min(state.guesses.length + 1, MAX_GUESSES);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.background : '#FFF3C7' }]}
    >
      <View style={styles.body}>
        <ScreenHeader
          title={mode.kind === 'daily' ? 'Daily Wordle' : 'Wordle'}
          subtitle={`Guess ${guessNo} of ${MAX_GUESSES} · ${formatClock(elapsed)}`}
          right={
            mode.kind === 'random' ? (
              <IconButton icon="refresh" label="New word" onPress={startNewGame} />
            ) : undefined
          }
        />

        <View style={styles.toastSlot}>
          {toast && (
            <View style={[styles.toast, { backgroundColor: colors.ink }]}>
              <Body style={{ fontFamily: fonts.bodyHeavy, color: colors.onInk }}>{toast}</Body>
            </View>
          )}
        </View>

        <WordleGrid guesses={state.guesses} current={state.current} />

        <View style={{ flex: 1 }} />

        {state.outcome !== 'playing' && mode.kind === 'random' && (
          <Chunky onPress={startNewGame} color={colors.wordle} contentStyle={styles.bigBtn}>
            <Display style={{ fontFamily: fonts.displaySemi, fontSize: 18, color: '#1D1A33' }}>
              New word
            </Display>
          </Chunky>
        )}

        <Keyboard
          letterStates={letterStates}
          onKey={onKey}
          disabled={state.outcome !== 'playing'}
        />
      </View>
      <AdBanner />

      <Onboarding
        visible={onboarding.visible}
        steps={WORDLE_ONBOARDING}
        onClose={onboarding.dismiss}
      />

      <NameInputModal
        visible={nameModalVisible}
        title="Save your daily score"
        message="We'll remember your name for future daily scores. You can change it later in Settings."
        defaultValue={prefs.playerName}
        onSubmit={async name => {
          setNameModalVisible(false);
          const finalName = name || 'Anon';
          setPref('playerName', name);
          const r = pendingDailyRef.current;
          if (r)
            await submitScore({
              name: finalName,
              timeMs: r.timeMs,
              date: todayISO(),
              game: 'wordle',
            });
          setResultVisible(true);
        }}
        onDismiss={() => {
          setNameModalVisible(false);
          setResultVisible(true);
        }}
      />

      <ResultModal
        visible={resultVisible}
        won={state.outcome === 'won'}
        accent={colors.wordle}
        title={state.outcome === 'won' ? 'Brilliant!' : 'So close'}
        subtitle={
          state.outcome === 'won'
            ? `Got it in ${state.guesses.length}/${MAX_GUESSES}`
            : `The word was ${state.answer.toUpperCase()}`
        }
        stats={[
          { label: 'Guesses', value: `${state.guesses.length}/${MAX_GUESSES}` },
          { label: 'Time', value: formatTime(elapsed) },
        ]}
        wordleGuesses={state.guesses}
        share={{
          game: 'wordle',
          timeMs: elapsed,
          won: state.outcome === 'won',
          maxGuesses: MAX_GUESSES,
          wordleGuesses: state.guesses,
          dayLabel: mode.kind === 'daily' ? todayISO() : undefined,
        }}
        primaryLabel={mode.kind === 'daily' ? 'Back to menu' : 'New word'}
        onPrimary={async () => {
          setResultVisible(false);
          if (mode.kind === 'random') {
            await startNewGame();
          } else {
            navigation.goBack();
          }
        }}
        secondaryLabel={mode.kind === 'random' ? 'Back to menu' : undefined}
        onSecondary={
          mode.kind === 'random'
            ? () => {
                setResultVisible(false);
                navigation.goBack();
              }
            : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, padding: 16, paddingTop: 8, gap: 12 },
  toastSlot: { height: 36, alignItems: 'center', justifyContent: 'center' },
  toast: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999 },
  bigBtn: { height: 52, alignItems: 'center', justifyContent: 'center' },
});
