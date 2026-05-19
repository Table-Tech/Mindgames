import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { SudokuBoard } from '@/games/sudoku/SudokuBoard';
import { dailyPuzzle, randomPuzzle } from '@/games/sudoku/generator';
import { findConflicts, isComplete } from '@/games/sudoku/findConflicts';
import type { Difficulty, Puzzle } from '@/games/sudoku/types';
import { AdBanner } from '@/ads/AdBanner';
import { maybeShowInterstitial } from '@/ads/interstitial';
import { useEntitlements } from '@/iap/EntitlementsProvider';
import { submitScore, todayISO } from '@/leaderboard/leaderboard';

type Mode = { kind: 'random'; difficulty: Difficulty } | { kind: 'daily' };

interface Props {
  mode: Mode;
  onFinishedDaily?: (timeMs: number) => void;
}

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

export function SudokuScreen({ mode, onFinishedDaily }: Props) {
  const { colors } = useTheme();
  const { adsRemoved } = useEntitlements();

  const puzzle = useMemo<Puzzle>(
    () => (mode.kind === 'daily' ? dailyPuzzle() : randomPuzzle(mode.difficulty)),
    [mode],
  );

  const [board, setBoard] = useState(() => puzzle.given.slice());
  const [selected, setSelected] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setElapsed(Date.now() - startedAt.current), 1000);
    return () => clearInterval(t);
  }, [done]);

  const conflicts = useMemo(() => findConflicts(board), [board]);

  const inputNumber = (n: number) => {
    if (selected == null || done) return;
    if (puzzle.given[selected] !== 0) return;
    const next = board.slice();
    next[selected] = next[selected] === n ? 0 : n;
    setBoard(next);
    if (isComplete(next)) finish(next);
  };

  const finish = async (finalBoard: number[]) => {
    const correct = finalBoard.every((v, i) => v === puzzle.solution[i]);
    if (!correct) return;
    const timeMs = Date.now() - startedAt.current;
    setDone(true);

    const shouldInterstitial = await maybeShowInterstitial(adsRemoved);
    if (shouldInterstitial) {
      Alert.alert('Ad', '(Interstitial would show here)');
    }

    if (mode.kind === 'daily') {
      const record = async (name: string) => {
        await submitScore({ name: name || 'Anon', timeMs, date: todayISO() });
        onFinishedDaily?.(timeMs);
      };
      if (Platform.OS === 'ios') {
        Alert.prompt(
          'Daily challenge solved!',
          `Time: ${formatTime(timeMs)}\nEnter your name for the leaderboard`,
          (name?: string) => record(name ?? ''),
        );
      } else {
        // Android: Alert.prompt is unavailable; record anonymously.
        // TODO: replace with a custom modal that accepts a name on Android.
        Alert.alert('Daily challenge solved!', `Time: ${formatTime(timeMs)}`);
        record('Anon');
      }
    } else {
      Alert.alert('Solved!', `Time: ${formatTime(timeMs)}`);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {mode.kind === 'daily' ? 'Daily Challenge' : `Sudoku · ${mode.difficulty}`}
          </Text>
          <Text style={[styles.timer, { color: colors.textMuted }]}>{formatTime(elapsed)}</Text>
        </View>
        <SudokuBoard
          board={board}
          given={puzzle.given}
          selected={selected}
          conflicts={conflicts}
          onSelect={setSelected}
        />
        <View style={styles.padRow}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <Pressable
              key={n}
              onPress={() => inputNumber(n)}
              style={[styles.padKey, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
            >
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: '600' }}>{n}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={() => inputNumber(0)}
          style={[styles.eraseBtn, { borderColor: colors.border }]}
        >
          <Text style={{ color: colors.textMuted }}>Erase</Text>
        </Pressable>
      </ScrollView>
      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  timer: { fontSize: 16, fontVariant: ['tabular-nums'] },
  padRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  padKey: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  eraseBtn: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
