import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { SudokuBoard } from '@/games/sudoku/SudokuBoard';
import { DifficultyPicker } from '@/games/sudoku/DifficultyPicker';
import { dailyPuzzle, randomPuzzle } from '@/games/sudoku/generator';
import { isComplete } from '@/games/sudoku/findConflicts';
import { clearNotes, clearPeerNotes, emptyNotes, toggleNote, Notes } from '@/games/sudoku/notes';
import { DIFFICULTY_POINTS, type Board, type Difficulty } from '@/games/sudoku/types';
import {
  clearSudoku,
  loadSudoku,
  saveSudoku,
  type SudokuMode as PersistMode,
  type SudokuPersistedState,
} from '@/games/sudoku/persistence';
import { AdBanner } from '@/ads/AdBanner';
import { maybeShowInterstitial } from '@/ads/interstitial';
import { useEntitlements } from '@/iap/EntitlementsProvider';
import { submitScore, todayISO } from '@/leaderboard/leaderboard';
import { recordFinish } from '@/stats/stats';
import { useFeedback } from '@/feedback/useFeedback';

type NavMode =
  | { kind: 'random'; difficulty: Difficulty }
  | { kind: 'daily' };

interface Props {
  mode: NavMode;
}

const MAX_MISTAKES = 3;
const STARTING_HINTS = 3;
const MISTAKE_PENALTY = 50;
const HINT_PENALTY = 100;

interface Snapshot {
  board: Board;
  notes: Notes;
  wrong: Set<number>;
  hintLocked: Set<number>;
  mistakes: number;
  hintsLeft: number;
  score: number;
}

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

function notesToArrays(notes: Notes): number[][] {
  return notes.map(s => Array.from(s));
}
function arraysToNotes(arr: number[][]): Notes {
  return arr.map(a => new Set(a));
}

function freshState(
  navMode: NavMode,
  difficultyOverride?: Difficulty,
): SudokuPersistedState {
  const difficulty =
    difficultyOverride ?? (navMode.kind === 'random' ? navMode.difficulty : 'medium');
  const puzzle = navMode.kind === 'daily' ? dailyPuzzle() : randomPuzzle(difficulty);
  return {
    difficulty: puzzle.difficulty,
    given: puzzle.given.slice(),
    solution: puzzle.solution.slice(),
    seed: puzzle.seed,
    board: puzzle.given.slice(),
    notes: Array.from({ length: 81 }, () => []),
    hintLocked: [],
    wrong: [],
    mistakes: 0,
    hintsLeft: STARTING_HINTS,
    score: 0,
    elapsedMs: 0,
    paused: false,
    outcome: 'playing',
  };
}

export function SudokuScreen({ mode: navMode }: Props) {
  const { colors } = useTheme();
  const { adsRemoved } = useEntitlements();
  const fb = useFeedback();

  const persistMode: PersistMode = useMemo(
    () => (navMode.kind === 'daily' ? { kind: 'daily' } : { kind: 'random' }),
    [navMode.kind],
  );

  const [state, setState] = useState<SudokuPersistedState | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [notesMode, setNotesMode] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [finishHandled, setFinishHandled] = useState(false);

  // Load or generate.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const saved = await loadSudoku(persistMode);
      if (cancelled) return;
      if (saved) {
        setState(saved);
        setFinishHandled(saved.outcome !== 'playing');
      } else {
        // Generation can take a moment for Master/Extreme — yield first so the
        // loading indicator renders.
        await new Promise(resolve => setTimeout(resolve, 0));
        if (cancelled) return;
        setState(freshState(navMode));
        setFinishHandled(false);
      }
      setHistory([]);
      setSelected(null);
      setNotesMode(false);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [navMode, persistMode]);

  // Persist every change.
  useEffect(() => {
    if (!state) return;
    saveSudoku(persistMode, state);
  }, [state, persistMode]);

  // Timer (only ticks while playing and not paused).
  useEffect(() => {
    if (!state || state.outcome !== 'playing' || state.paused) return;
    const t = setInterval(() => {
      setState(s => (s ? { ...s, elapsedMs: s.elapsedMs + 1000 } : s));
    }, 1000);
    return () => clearInterval(t);
  }, [state?.outcome, state?.paused, !!state]);

  const wrongSet = useMemo(() => new Set(state?.wrong ?? []), [state?.wrong]);
  const hintLockedSet = useMemo(
    () => new Set(state?.hintLocked ?? []),
    [state?.hintLocked],
  );
  const notes = useMemo(
    () => (state ? arraysToNotes(state.notes) : emptyNotes()),
    [state?.notes],
  );

  const isLocked = useCallback(
    (i: number) => !!state && (state.given[i] !== 0 || hintLockedSet.has(i)),
    [state, hintLockedSet],
  );

  const pushSnapshot = useCallback(() => {
    if (!state) return;
    setHistory(h => [
      ...h,
      {
        board: state.board.slice(),
        notes: arraysToNotes(state.notes),
        wrong: new Set(state.wrong),
        hintLocked: new Set(state.hintLocked),
        mistakes: state.mistakes,
        hintsLeft: state.hintsLeft,
        score: state.score,
      },
    ]);
  }, [state]);

  const finish = useCallback(
    async (finalScore: number, finalElapsed: number, won: boolean) => {
      const shouldInterstitial = await maybeShowInterstitial(adsRemoved);
      if (shouldInterstitial) Alert.alert('Ad', '(Interstitial would show here)');

      await recordFinish({
        game: 'sudoku',
        mode: navMode.kind,
        outcome: won ? 'won' : 'lost',
        timeMs: finalElapsed,
        date: todayISO(),
        difficulty: state?.difficulty,
        score: finalScore,
      });

      if (!won) {
        Alert.alert('Game over', `You made ${MAX_MISTAKES} mistakes.`);
        return;
      }

      if (navMode.kind === 'daily') {
        const record = async (name: string) =>
          submitScore({ name: name || 'Anon', timeMs: finalElapsed, date: todayISO() });
        if (Platform.OS === 'ios') {
          Alert.prompt(
            'Daily challenge solved!',
            `Time: ${formatTime(finalElapsed)}\nScore: ${finalScore}`,
            (name?: string) => record(name ?? ''),
          );
        } else {
          Alert.alert('Daily challenge solved!', `Time: ${formatTime(finalElapsed)}\nScore: ${finalScore}`);
          record('Anon');
        }
      } else {
        Alert.alert('Solved!', `Time: ${formatTime(finalElapsed)}\nScore: ${finalScore}`);
      }
    },
    [adsRemoved, navMode.kind, state?.difficulty],
  );

  // Trigger finish-side-effects once when game ends.
  useEffect(() => {
    if (!state || state.outcome === 'playing' || finishHandled) return;
    setFinishHandled(true);
    finish(state.score, state.elapsedMs, state.outcome === 'won');
  }, [state, finishHandled, finish]);

  const inputNumber = (n: number) => {
    if (!state || state.outcome !== 'playing' || state.paused) return;
    if (selected == null) return;
    if (isLocked(selected)) return;

    if (notesMode && n !== 0) {
      if (state.board[selected] !== 0) return;
      const nextNotes = toggleNote(arraysToNotes(state.notes), selected, n);
      pushSnapshot();
      setState({ ...state, notes: notesToArrays(nextNotes) });
      return;
    }

    pushSnapshot();

    const current = state.board[selected];
    const placing = current === n ? 0 : n;

    const nextBoard = state.board.slice();
    nextBoard[selected] = placing;

    const nextWrong = new Set(state.wrong);
    let nextMistakes = state.mistakes;
    let nextScore = state.score;

    if (placing === 0) {
      nextWrong.delete(selected);
    } else if (placing === state.solution[selected]) {
      nextWrong.delete(selected);
      nextScore += DIFFICULTY_POINTS[state.difficulty];
      fb.correct();
    } else {
      nextWrong.add(selected);
      nextMistakes += 1;
      nextScore = Math.max(0, nextScore - MISTAKE_PENALTY);
      fb.wrong();
    }

    let nextNotes = clearNotes(arraysToNotes(state.notes), selected);
    if (placing !== 0 && placing === state.solution[selected]) {
      nextNotes = clearPeerNotes(nextNotes, selected, placing);
    }

    const lost = nextMistakes >= MAX_MISTAKES;
    const won = !lost && isComplete(nextBoard) && nextWrong.size === 0;

    if (won) fb.win();
    else if (lost) fb.lose();

    setState({
      ...state,
      board: nextBoard,
      notes: notesToArrays(nextNotes),
      wrong: Array.from(nextWrong),
      mistakes: nextMistakes,
      score: nextScore,
      outcome: lost ? 'lost' : won ? 'won' : 'playing',
    });
  };

  const erase = () => {
    if (!state || state.outcome !== 'playing' || state.paused) return;
    if (selected == null) return;
    if (isLocked(selected)) return;
    if (state.board[selected] === 0 && state.notes[selected].length === 0) return;

    pushSnapshot();

    if (state.board[selected] !== 0) {
      const next = state.board.slice();
      next[selected] = 0;
      const nextWrong = new Set(state.wrong);
      nextWrong.delete(selected);
      setState({
        ...state,
        board: next,
        wrong: Array.from(nextWrong),
      });
    } else {
      const nextNotes = clearNotes(arraysToNotes(state.notes), selected);
      setState({ ...state, notes: notesToArrays(nextNotes) });
    }
  };

  const undo = () => {
    if (!state || state.outcome !== 'playing') return;
    const last = history[history.length - 1];
    if (!last) return;
    setHistory(h => h.slice(0, -1));
    setState({
      ...state,
      board: last.board,
      notes: notesToArrays(last.notes),
      wrong: Array.from(last.wrong),
      hintLocked: Array.from(last.hintLocked),
      mistakes: last.mistakes,
      hintsLeft: last.hintsLeft,
      score: last.score,
    });
  };

  const useHint = () => {
    if (!state || state.outcome !== 'playing' || state.paused) return;
    if (state.hintsLeft <= 0) return;
    if (selected == null) return;
    if (isLocked(selected)) return;
    if (state.board[selected] === state.solution[selected]) return;

    pushSnapshot();

    const correct = state.solution[selected];
    const nextBoard = state.board.slice();
    nextBoard[selected] = correct;
    const nextWrong = new Set(state.wrong);
    nextWrong.delete(selected);
    const nextLocked = new Set(state.hintLocked);
    nextLocked.add(selected);
    const nextNotes = clearPeerNotes(
      clearNotes(arraysToNotes(state.notes), selected),
      selected,
      correct,
    );

    const won = isComplete(nextBoard) && nextWrong.size === 0;
    setState({
      ...state,
      board: nextBoard,
      notes: notesToArrays(nextNotes),
      wrong: Array.from(nextWrong),
      hintLocked: Array.from(nextLocked),
      hintsLeft: state.hintsLeft - 1,
      score: Math.max(0, state.score - HINT_PENALTY),
      outcome: won ? 'won' : 'playing',
    });
  };

  const togglePause = () => {
    if (!state || state.outcome !== 'playing') return;
    setState({ ...state, paused: !state.paused });
  };

  const startNewGame = useCallback(
    async (difficulty?: Difficulty) => {
      await clearSudoku(persistMode);
      const next = freshState(navMode, difficulty);
      setState(next);
      setHistory([]);
      setSelected(null);
      setNotesMode(false);
      setFinishHandled(false);
    },
    [persistMode, navMode],
  );

  const promptNewGame = () => {
    Alert.alert(
      'New game',
      'Start a new puzzle? Current progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'New game', onPress: () => startNewGame() },
      ],
    );
  };

  if (loading || !state) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.textMuted, marginTop: 12 }}>Generating puzzle…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {navMode.kind === 'random' && (
          <DifficultyPicker
            value={state.difficulty}
            onChange={d => {
              if (d === state.difficulty) return;
              startNewGame(d);
            }}
          />
        )}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Mistakes</Text>
            <Text
              style={[
                styles.statValue,
                { color: state.mistakes >= MAX_MISTAKES ? colors.error : colors.text },
              ]}
            >
              {state.mistakes}/{MAX_MISTAKES}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Score</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{state.score}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Time</Text>
            <View style={styles.timeRow}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatTime(state.elapsedMs)}
              </Text>
              <Pressable onPress={togglePause} hitSlop={8}>
                <Ionicons
                  name={state.paused ? 'play' : 'pause'}
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View>
          <SudokuBoard
            board={state.board}
            given={state.given}
            notes={notes}
            selected={selected}
            wrong={wrongSet}
            hidden={state.paused}
            onSelect={i => {
              if (state.paused || state.outcome !== 'playing') return;
              setSelected(i);
            }}
          />
          {state.paused && (
            <Pressable
              onPress={togglePause}
              style={[styles.pauseOverlay, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="play" size={48} color={colors.accent} />
              <Text style={{ color: colors.textMuted, marginTop: 8 }}>Tap to resume</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.actionRow}>
          <ActionButton
            icon="arrow-undo"
            label="Undo"
            disabled={history.length === 0 || state.outcome !== 'playing'}
            onPress={undo}
          />
          <ActionButton icon="backspace-outline" label="Erase" onPress={erase} />
          <ActionButton
            icon="pencil"
            label={`Notes ${notesMode ? 'ON' : 'OFF'}`}
            active={notesMode}
            onPress={() => setNotesMode(m => !m)}
          />
          <ActionButton
            icon="bulb-outline"
            label="Hint"
            badge={state.hintsLeft}
            disabled={state.hintsLeft === 0}
            onPress={useHint}
          />
        </View>

        <View style={styles.pad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <Pressable
              key={n}
              onPress={() => inputNumber(n)}
              style={[
                styles.padKey,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
              ]}
            >
              <Text style={{ color: colors.accent, fontSize: 28, fontWeight: '600' }}>{n}</Text>
            </Pressable>
          ))}
        </View>

        {navMode.kind === 'random' && (
          <Pressable
            onPress={promptNewGame}
            style={[styles.newGameBtn, { backgroundColor: colors.accent }]}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>New Game</Text>
          </Pressable>
        )}
      </ScrollView>
      <AdBanner />
    </SafeAreaView>
  );
}

interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
  badge?: number;
}

function ActionButton({ icon, label, onPress, active, disabled, badge }: ActionButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.actionBtn,
        {
          backgroundColor: active ? colors.accent : colors.surfaceAlt,
          borderColor: colors.border,
          opacity: disabled ? 0.4 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={22} color={active ? '#fff' : colors.text} />
      <Text
        style={{
          fontSize: 10,
          marginTop: 2,
          color: active ? '#fff' : colors.textMuted,
        }}
      >
        {label}
      </Text>
      {badge != null && (
        <View style={[styles.badge, { backgroundColor: colors.accent }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 14 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'flex-start' },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around' },
  actionBtn: {
    width: 64,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  padKey: {
    width: '30%',
    aspectRatio: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  newGameBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
});
