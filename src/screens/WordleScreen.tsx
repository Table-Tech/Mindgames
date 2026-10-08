import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/fonts';
import { Body, Chunky, Display, IconButton, ScreenHeader } from '@/ui/kit';
import { formatClock, formatTime } from '@/core/format';
import { todayISO } from '@/core/date';
import { WordleGrid } from '@/games/wordle/WordleGrid';
import { Keyboard } from '@/games/wordle/Keyboard';
import { keyboardStates } from '@/games/wordle/engine';
import { isValidWord } from '@/games/wordle/words';
import { wordleRepository } from '@/games/wordle/persistence';
import { createWordleGame, elapsedMs, isResumable, pressKey } from '@/games/wordle/session';
import type { WordleMode, WordleState } from '@/games/wordle/types';
import { MAX_GUESSES } from '@/games/wordle/types';
import { useFinishFlow } from '@/games/shared/useFinishFlow';
import { useNow } from '@/games/shared/useNow';
import { useToast } from '@/games/shared/useToast';
import { AdBanner } from '@/ads/AdBanner';
import { useFeedback } from '@/feedback/useFeedback';
import { usePreferences } from '@/prefs/PreferencesProvider';
import { ResultModal } from '@/components/ResultModal';
import { NameInputModal } from '@/components/NameInputModal';
import { Onboarding } from '@/components/Onboarding';
import { WORDLE_ONBOARDING } from '@/onboarding/steps';
import { useOnboarding } from '@/onboarding/useOnboarding';

interface Props {
  mode: WordleMode;
}

export function WordleScreen({ mode }: Props) {
  const { colors, isDark } = useTheme();
  const fb = useFeedback();
  const { prefs } = usePreferences();
  const navigation = useNavigation();
  const onboarding = useOnboarding('wordle');
  const finishFlow = useFinishFlow('wordle', mode.kind);
  const { message: toast, show: showToast } = useToast();
  const { finish } = finishFlow;

  const [state, setState] = useState<WordleState | null>(null);
  const finishHandled = useRef(false);
  const now = useNow(state?.outcome === 'playing');

  // Restore (or create) the game on mount / mode change.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await wordleRepository.load(mode);
      if (cancelled) return;
      const next = saved && isResumable(saved, mode) ? saved : createWordleGame(mode, Date.now());
      setState(next);
      finishHandled.current = next.outcome !== 'playing';
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  // Persist on every state change.
  useEffect(() => {
    if (state) wordleRepository.save(mode, state);
  }, [mode, state]);

  const letterStates = useMemo(() => (state ? keyboardStates(state.guesses) : {}), [state]);

  const onKey = useCallback(
    (k: string) => {
      if (!state) return;
      const result = pressKey(state, k, {
        hardMode: prefs.wordleHardMode,
        isValidWord,
        now: Date.now(),
      });
      if (!result) return;
      fb.play(result.cues);
      if (result.toast) showToast(result.toast);
      if (result.state !== state) setState(result.state);
    },
    [state, prefs.wordleHardMode, fb, showToast],
  );

  // Run the shared finish flow once when the game ends.
  useEffect(() => {
    if (!state || state.outcome === 'playing' || finishHandled.current) return;
    finishHandled.current = true;
    finish({
      won: state.outcome === 'won',
      timeMs: elapsedMs(state, Date.now()),
      guesses: state.guesses.length,
    });
  }, [state, finish]);

  const startNewGame = useCallback(async () => {
    await wordleRepository.clear(mode);
    setState(createWordleGame(mode, Date.now()));
    finishHandled.current = false;
  }, [mode]);

  if (!state) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  const elapsed = elapsedMs(state, now);
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

      <NameInputModal {...finishFlow.nameModal} />

      <ResultModal
        visible={finishFlow.resultVisible}
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
          finishFlow.hideResult();
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
                finishFlow.hideResult();
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
