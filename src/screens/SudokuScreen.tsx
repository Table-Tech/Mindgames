import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/fonts';
import { Body, Card, Chunky, Display, IconButton, ScreenHeader, ToolButton } from '@/ui/kit';
import { capitalize, formatClock, formatTime } from '@/core/format';
import { todayISO } from '@/core/date';
import { SudokuBoard } from '@/games/sudoku/SudokuBoard';
import { DifficultyPicker } from '@/games/sudoku/DifficultyPicker';
import { sudokuRepository, type SudokuPersistedState } from '@/games/sudoku/persistence';
import {
  applyHint,
  createSudokuGame,
  eraseCell,
  fillAutoPencil,
  inputNumber,
  MAX_MISTAKES,
  remainingOf,
  restoreSnapshot,
  snapshotOf,
  STARTING_HINTS,
  tick,
  togglePause as togglePauseState,
  toPersistMode,
  type SudokuSnapshot,
  type SudokuStartMode,
  type SudokuStep,
} from '@/games/sudoku/session';
import type { Difficulty } from '@/games/sudoku/types';
import { useFinishFlow } from '@/games/shared/useFinishFlow';
import { useUndoHistory } from '@/games/shared/useUndoHistory';
import { AdBanner } from '@/ads/AdBanner';
import { useFeedback } from '@/feedback/useFeedback';
import { usePreferences } from '@/prefs/PreferencesProvider';
import { ResultModal } from '@/components/ResultModal';
import { NameInputModal } from '@/components/NameInputModal';
import { Onboarding } from '@/components/Onboarding';
import { SUDOKU_ONBOARDING } from '@/onboarding/steps';
import { useOnboarding } from '@/onboarding/useOnboarding';

interface Props {
  mode: SudokuStartMode;
}

export function SudokuScreen({ mode: navMode }: Props) {
  const { colors } = useTheme();
  const fb = useFeedback();
  const { prefs } = usePreferences();
  const inputOpts = { autoCleanupNotes: prefs.sudokuAutoCleanupNotes };
  const navigation = useNavigation();
  const onboarding = useOnboarding('sudoku');
  const finishFlow = useFinishFlow('sudoku', navMode.kind);
  const history = useUndoHistory<SudokuSnapshot>();
  const { clear: clearHistory } = history;
  const { finish } = finishFlow;

  const persistMode = useMemo(() => toPersistMode(navMode), [navMode.kind]);

  const [state, setState] = useState<SudokuPersistedState | null>(null);
  const [loading, setLoading] = useState(true);
  const [notesMode, setNotesMode] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [finishHandled, setFinishHandled] = useState(false);

  const resetUi = useCallback(() => {
    clearHistory();
    setSelected(null);
    setNotesMode(false);
  }, [clearHistory]);

  // Load or generate.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const saved = await sudokuRepository.load(persistMode);
      if (cancelled) return;
      if (saved) {
        setState(saved);
        setFinishHandled(saved.outcome !== 'playing');
      } else {
        // Generation can take a moment for Master/Extreme — yield first so the
        // loading indicator renders.
        await new Promise(resolve => setTimeout(resolve, 0));
        if (cancelled) return;
        setState(createSudokuGame(navMode));
        setFinishHandled(false);
      }
      resetUi();
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [navMode, persistMode]);

  // Persist every change.
  useEffect(() => {
    if (state) sudokuRepository.save(persistMode, state);
  }, [state, persistMode]);

  // Timer (only ticks while playing and not paused).
  useEffect(() => {
    if (!state || state.outcome !== 'playing' || state.paused) return;
    const t = setInterval(() => setState(s => (s ? tick(s, 1000) : s)), 1000);
    return () => clearInterval(t);
  }, [state?.outcome, state?.paused, !!state]);

  // Run the shared finish flow once when the game ends.
  useEffect(() => {
    if (!state || state.outcome === 'playing' || finishHandled) return;
    setFinishHandled(true);
    finish({
      won: state.outcome === 'won',
      timeMs: state.elapsedMs,
      difficulty: state.difficulty,
      score: state.score,
    });
  }, [state, finishHandled, finish]);

  const notes = useMemo(() => (state ? state.notes.map(n => new Set(n)) : []), [state?.notes]);
  const wrongSet = useMemo(() => new Set(state?.wrong ?? []), [state?.wrong]);

  // Apply a session step: remember the previous state for undo, then play cues.
  const apply = (step: SudokuStep | null) => {
    if (!state || !step) return;
    history.push(snapshotOf(state));
    setState(step.state);
    fb.play(step.cues);
  };

  const undo = () => {
    if (!state || state.outcome !== 'playing') return;
    const last = history.pop();
    if (last) setState(restoreSnapshot(state, last));
  };

  const togglePause = () => state && setState(togglePauseState(state));

  const startNewGame = useCallback(
    async (difficulty?: Difficulty) => {
      await sudokuRepository.clear(persistMode);
      setState(createSudokuGame(navMode, difficulty));
      resetUi();
      setFinishHandled(false);
    },
    [persistMode, navMode, resetUi],
  );

  const promptNewGame = () => {
    Alert.alert('New game', 'Start a new puzzle? Current progress will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'New game', onPress: () => startNewGame() },
    ]);
  };

  if (loading || !state) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={colors.accent} />
        <Body style={{ color: colors.textMuted, marginTop: 12 }}>Generating puzzle…</Body>
      </SafeAreaView>
    );
  }

  const difficultyLabel = capitalize(state.difficulty);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={navMode.kind === 'daily' ? 'Daily Sudoku' : 'Sudoku'}
          subtitle={difficultyLabel}
          right={
            <IconButton
              icon={state.paused ? 'play' : 'pause'}
              label={state.paused ? 'Resume' : 'Pause'}
              onPress={togglePause}
            />
          }
        />

        {navMode.kind === 'random' && (
          <DifficultyPicker
            value={state.difficulty}
            onChange={d => {
              if (d === state.difficulty) return;
              startNewGame(d);
            }}
          />
        )}

        <Card depth={0} radius={16} style={styles.statsRow}>
          <View
            style={styles.hearts}
            accessibilityLabel={`${MAX_MISTAKES - state.mistakes} lives left`}
          >
            {Array.from({ length: MAX_MISTAKES }).map((_, h) => (
              <Ionicons
                key={h}
                name={h < MAX_MISTAKES - state.mistakes ? 'heart' : 'heart-outline'}
                size={22}
                color={h < MAX_MISTAKES - state.mistakes ? colors.pink : colors.textMuted}
              />
            ))}
          </View>
          <Display style={styles.clock}>{formatClock(state.elapsedMs)}</Display>
          <Body style={{ fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textMuted }}>
            {state.score} pts
          </Body>
        </Card>

        <View>
          <SudokuBoard
            board={state.board}
            given={state.given}
            notes={notes}
            selected={selected}
            wrong={wrongSet}
            hidden={state.paused}
            showMistakes={prefs.sudokuHighlightMistakes}
            onSelect={i => {
              if (state.paused || state.outcome !== 'playing') return;
              setSelected(i);
            }}
          />
          {state.paused && (
            <View style={styles.pauseOverlay}>
              <Card style={styles.pauseCard} depth={5}>
                <Display style={{ fontSize: 30 }}>Paused</Display>
                <Body style={{ color: colors.textMuted }}>
                  Timer stopped at {formatClock(state.elapsedMs)}
                </Body>
                <Chunky
                  onPress={togglePause}
                  color={colors.sudoku}
                  style={{ alignSelf: 'stretch' }}
                  contentStyle={styles.bigBtn}
                >
                  <Display
                    style={{ fontFamily: fonts.displaySemi, fontSize: 20, color: '#FFFFFF' }}
                  >
                    Resume
                  </Display>
                </Chunky>
              </Card>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          <ToolButton
            icon="arrow-undo"
            label="Undo"
            disabled={!history.canUndo || state.outcome !== 'playing'}
            onPress={undo}
          />
          <ToolButton
            icon="backspace-outline"
            label="Erase"
            onPress={() => apply(eraseCell(state, selected))}
          />
          <ToolButton
            icon="pencil"
            label="Notes"
            active={notesMode}
            badge={notesMode ? 'ON' : 'OFF'}
            badgeColor={colors.wordle}
            onPress={() => setNotesMode(m => !m)}
          />
          <ToolButton
            icon="bulb-outline"
            label="Hint"
            badge={state.hintsLeft}
            disabled={state.hintsLeft === 0}
            onPress={() => apply(applyHint(state, selected, inputOpts))}
          />
          <ToolButton
            icon="sparkles-outline"
            label="Auto"
            onPress={() => apply(fillAutoPencil(state))}
          />
        </View>

        <View style={styles.pad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => {
            const left = remainingOf(state, n);
            return (
              <Chunky
                key={n}
                onPress={() => apply(inputNumber(state, selected, n, notesMode, inputOpts))}
                disabled={left <= 0}
                accessibilityLabel={`Enter ${n}`}
                depth={3}
                radius={12}
                color={notesMode ? colors.surfaceAlt : colors.surface}
                style={{ flex: 1 }}
                contentStyle={styles.padKey}
              >
                <Display
                  allowFontScaling={false}
                  style={{ fontFamily: fonts.displaySemi, fontSize: 26, lineHeight: 30 }}
                >
                  {n}
                </Display>
                <Body allowFontScaling={false} style={{ fontSize: 10, color: colors.textMuted }}>
                  {left > 0 ? left : ''}
                </Body>
              </Chunky>
            );
          })}
        </View>

        {navMode.kind === 'random' && (
          <Chunky onPress={promptNewGame} color={colors.sudoku} contentStyle={styles.bigBtn}>
            <Display style={{ fontFamily: fonts.displaySemi, fontSize: 18, color: '#FFFFFF' }}>
              New game
            </Display>
          </Chunky>
        )}
      </ScrollView>
      <AdBanner />

      <Onboarding
        visible={onboarding.visible}
        steps={SUDOKU_ONBOARDING}
        onClose={onboarding.dismiss}
      />

      <NameInputModal {...finishFlow.nameModal} />

      <ResultModal
        visible={finishFlow.resultVisible}
        won={state.outcome === 'won'}
        accent={colors.sudoku}
        title={state.outcome === 'won' ? 'Solved!' : 'Out of hearts'}
        subtitle={
          state.outcome === 'won'
            ? navMode.kind === 'daily'
              ? "You finished today's daily Sudoku"
              : `Difficulty: ${difficultyLabel}`
            : `You made ${MAX_MISTAKES} mistakes — give it another go`
        }
        stats={[
          { label: 'Time', value: formatTime(state.elapsedMs) },
          { label: 'Score', value: `${state.score}` },
          { label: 'Hints', value: `${STARTING_HINTS - state.hintsLeft}` },
        ]}
        share={{
          game: 'sudoku',
          difficulty: state.difficulty,
          timeMs: state.elapsedMs,
          score: state.score,
          mistakes: state.mistakes,
          maxMistakes: MAX_MISTAKES,
          hintsUsed: STARTING_HINTS - state.hintsLeft,
          won: state.outcome === 'won',
          dayLabel: navMode.kind === 'daily' ? todayISO() : undefined,
        }}
        primaryLabel={navMode.kind === 'daily' ? 'Back to menu' : 'Play again'}
        onPrimary={() => {
          finishFlow.hideResult();
          if (navMode.kind === 'random') startNewGame();
          else navigation.goBack();
        }}
        secondaryLabel={navMode.kind === 'random' ? 'Back to menu' : undefined}
        onSecondary={
          navMode.kind === 'random'
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
  scroll: { padding: 16, paddingTop: 8, gap: 14 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  hearts: { flexDirection: 'row', gap: 2 },
  clock: { fontFamily: fonts.displaySemi, fontSize: 20, fontVariant: ['tabular-nums'] },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  pauseCard: { alignSelf: 'stretch', alignItems: 'center', gap: 12, padding: 22 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  pad: { flexDirection: 'row', gap: 5 },
  padKey: { height: 60, alignItems: 'center', justifyContent: 'center' },
  bigBtn: { height: 52, alignItems: 'center', justifyContent: 'center' },
});
