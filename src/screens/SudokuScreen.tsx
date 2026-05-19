import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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
import { DIFFICULTY_POINTS, type Board, type Difficulty, type Puzzle } from '@/games/sudoku/types';
import { AdBanner } from '@/ads/AdBanner';
import { maybeShowInterstitial } from '@/ads/interstitial';
import { useEntitlements } from '@/iap/EntitlementsProvider';
import { submitScore, todayISO } from '@/leaderboard/leaderboard';

type Mode = { kind: 'random'; difficulty: Difficulty } | { kind: 'daily' };

interface Props {
  mode: Mode;
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

export function SudokuScreen({ mode }: Props) {
  const { colors } = useTheme();
  const { adsRemoved } = useEntitlements();

  const isDaily = mode.kind === 'daily';
  const [difficulty, setDifficulty] = useState<Difficulty>(
    mode.kind === 'random' ? mode.difficulty : 'medium',
  );

  // Bumping `gameId` regenerates the puzzle (new seed) without changing difficulty.
  const [gameId, setGameId] = useState(0);

  const puzzle = useMemo<Puzzle>(
    () => (isDaily ? dailyPuzzle() : randomPuzzle(difficulty)),
    [isDaily, difficulty, gameId],
  );

  const [board, setBoard] = useState<Board>(() => puzzle.given.slice());
  const [notes, setNotes] = useState<Notes>(() => emptyNotes());
  const [hintLocked, setHintLocked] = useState<Set<number>>(() => new Set());
  const [wrong, setWrong] = useState<Set<number>>(() => new Set());
  const [history, setHistory] = useState<Snapshot[]>([]);

  const [notesMode, setNotesMode] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(STARTING_HINTS);
  const [score, setScore] = useState(0);

  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const startedAt = useRef(Date.now());
  const pausedAt = useRef<number | null>(null);

  // Reset all game state when the puzzle changes.
  useEffect(() => {
    setBoard(puzzle.given.slice());
    setNotes(emptyNotes());
    setHintLocked(new Set());
    setWrong(new Set());
    setHistory([]);
    setSelected(null);
    setMistakes(0);
    setHintsLeft(STARTING_HINTS);
    setScore(0);
    setElapsed(0);
    setPaused(false);
    setDone(false);
    setGameOver(false);
    startedAt.current = Date.now();
    pausedAt.current = null;
  }, [puzzle]);

  // Timer
  useEffect(() => {
    if (done || gameOver || paused) return;
    const t = setInterval(() => setElapsed(Date.now() - startedAt.current), 1000);
    return () => clearInterval(t);
  }, [done, gameOver, paused]);

  const isLocked = useCallback(
    (i: number) => puzzle.given[i] !== 0 || hintLocked.has(i),
    [puzzle.given, hintLocked],
  );

  const pushSnapshot = useCallback(() => {
    setHistory(h => [
      ...h,
      {
        board,
        notes,
        wrong: new Set(wrong),
        hintLocked: new Set(hintLocked),
        mistakes,
        hintsLeft,
        score,
      },
    ]);
  }, [board, notes, wrong, hintLocked, mistakes, hintsLeft, score]);

  const finish = useCallback(
    async (finalBoard: Board) => {
      const correct = finalBoard.every((v, i) => v === puzzle.solution[i]);
      if (!correct) return;
      const timeMs = Date.now() - startedAt.current;
      setDone(true);

      const shouldInterstitial = await maybeShowInterstitial(adsRemoved);
      if (shouldInterstitial) Alert.alert('Ad', '(Interstitial would show here)');

      if (isDaily) {
        const record = async (name: string) => {
          await submitScore({ name: name || 'Anon', timeMs, date: todayISO() });
        };
        if (Platform.OS === 'ios') {
          Alert.prompt(
            'Daily challenge solved!',
            `Time: ${formatTime(timeMs)}\nScore: ${score}\nEnter your name for the leaderboard`,
            (name?: string) => record(name ?? ''),
          );
        } else {
          Alert.alert(
            'Daily challenge solved!',
            `Time: ${formatTime(timeMs)}\nScore: ${score}`,
          );
          record('Anon');
        }
      } else {
        Alert.alert('Solved!', `Time: ${formatTime(timeMs)}\nScore: ${score}`);
      }
    },
    [puzzle.solution, adsRemoved, isDaily, score],
  );

  const inputNumber = (n: number) => {
    if (selected == null || done || gameOver || paused) return;
    if (isLocked(selected)) return;

    if (notesMode && n !== 0) {
      if (board[selected] !== 0) return;
      setNotes(toggleNote(notes, selected, n));
      return;
    }

    pushSnapshot();

    const current = board[selected];
    const placing = current === n ? 0 : n;

    const nextBoard = board.slice();
    nextBoard[selected] = placing;

    const nextWrong = new Set(wrong);
    let nextMistakes = mistakes;
    let nextScore = score;

    if (placing === 0) {
      nextWrong.delete(selected);
    } else if (placing === puzzle.solution[selected]) {
      nextWrong.delete(selected);
      nextScore += DIFFICULTY_POINTS[difficulty];
    } else {
      nextWrong.add(selected);
      nextMistakes += 1;
      nextScore = Math.max(0, nextScore - MISTAKE_PENALTY);
    }

    let nextNotes = clearNotes(notes, selected);
    if (placing !== 0 && placing === puzzle.solution[selected]) {
      nextNotes = clearPeerNotes(nextNotes, selected, placing);
    }

    setBoard(nextBoard);
    setNotes(nextNotes);
    setWrong(nextWrong);
    setMistakes(nextMistakes);
    setScore(nextScore);

    if (nextMistakes >= MAX_MISTAKES) {
      setGameOver(true);
      Alert.alert('Game over', `You made ${MAX_MISTAKES} mistakes.`, [
        { text: 'New game', onPress: () => setGameId(g => g + 1) },
        { text: 'OK' },
      ]);
      return;
    }

    if (isComplete(nextBoard) && nextWrong.size === 0) finish(nextBoard);
  };

  const erase = () => {
    if (selected == null || done || gameOver || paused) return;
    if (isLocked(selected)) return;
    if (board[selected] === 0 && notes[selected].size === 0) return;
    pushSnapshot();
    if (board[selected] !== 0) {
      const next = board.slice();
      next[selected] = 0;
      setBoard(next);
      if (wrong.has(selected)) {
        const w = new Set(wrong);
        w.delete(selected);
        setWrong(w);
      }
    } else {
      setNotes(clearNotes(notes, selected));
    }
  };

  const undo = () => {
    if (done || gameOver) return;
    const last = history[history.length - 1];
    if (!last) return;
    setHistory(h => h.slice(0, -1));
    setBoard(last.board);
    setNotes(last.notes);
    setWrong(last.wrong);
    setHintLocked(last.hintLocked);
    setMistakes(last.mistakes);
    setHintsLeft(last.hintsLeft);
    setScore(last.score);
  };

  const useHint = () => {
    if (selected == null || done || gameOver || paused) return;
    if (hintsLeft <= 0) return;
    if (isLocked(selected)) return;
    if (board[selected] === puzzle.solution[selected]) return;

    pushSnapshot();
    const correct = puzzle.solution[selected];
    const nextBoard = board.slice();
    nextBoard[selected] = correct;

    const nextWrong = new Set(wrong);
    nextWrong.delete(selected);

    const nextLocked = new Set(hintLocked);
    nextLocked.add(selected);

    const nextNotes = clearPeerNotes(clearNotes(notes, selected), selected, correct);

    setBoard(nextBoard);
    setWrong(nextWrong);
    setHintLocked(nextLocked);
    setNotes(nextNotes);
    setHintsLeft(hintsLeft - 1);
    setScore(Math.max(0, score - HINT_PENALTY));

    if (isComplete(nextBoard) && nextWrong.size === 0) finish(nextBoard);
  };

  const togglePause = () => {
    if (done || gameOver) return;
    if (paused) {
      if (pausedAt.current != null) {
        startedAt.current += Date.now() - pausedAt.current;
      }
      pausedAt.current = null;
      setPaused(false);
    } else {
      pausedAt.current = Date.now();
      setPaused(true);
    }
  };

  const newGame = () => {
    Alert.alert('New game', 'Start a new puzzle? Current progress will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'New game', onPress: () => setGameId(g => g + 1) },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {!isDaily && (
          <DifficultyPicker
            value={difficulty}
            onChange={d => {
              if (d === difficulty) return;
              setDifficulty(d);
              setGameId(g => g + 1);
            }}
          />
        )}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Mistakes</Text>
            <Text
              style={[
                styles.statValue,
                { color: mistakes >= MAX_MISTAKES ? colors.error : colors.text },
              ]}
            >
              {mistakes}/{MAX_MISTAKES}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Score</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{score}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Time</Text>
            <View style={styles.timeRow}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatTime(elapsed)}
              </Text>
              <Pressable onPress={togglePause} hitSlop={8}>
                <Ionicons
                  name={paused ? 'play' : 'pause'}
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View>
          <SudokuBoard
            board={board}
            given={puzzle.given}
            notes={notes}
            selected={selected}
            wrong={wrong}
            hidden={paused}
            onSelect={i => {
              if (paused || done || gameOver) return;
              setSelected(i);
            }}
          />
          {paused && (
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
            disabled={history.length === 0 || done || gameOver}
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
            badge={hintsLeft}
            disabled={hintsLeft === 0}
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

        {!isDaily && (
          <Pressable
            onPress={newGame}
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
      <Ionicons
        name={icon}
        size={22}
        color={active ? '#fff' : colors.text}
      />
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
