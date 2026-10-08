import { getJSON, remove, setJSON } from '@/storage/storage';
import { shiftISO, todayISO } from '@/core/date';
import { syncedDataChanged } from '@/core/events';
import type { GameId } from '@/core/game';

export type { GameId } from '@/core/game';
export { formatTime } from '@/core/format';
export type GameOutcome = 'won' | 'lost';
export type GameMode = 'daily' | 'random';

export interface FinishRecord {
  game: GameId;
  mode: GameMode;
  outcome: GameOutcome;
  timeMs: number;
  date: string; // yyyy-mm-dd in UTC
  difficulty?: string; // sudoku
  guesses?: number; // wordle
  score?: number;
}

const KEY = 'stats.records.v1';

export async function getRecords(): Promise<FinishRecord[]> {
  return (await getJSON<FinishRecord[]>(KEY)) ?? [];
}

/** Replaces all records without announcing a change (used by cloud merges). */
export async function saveRecords(records: FinishRecord[]): Promise<void> {
  await setJSON(KEY, records);
}

export async function clearRecords(): Promise<void> {
  await remove(KEY);
  syncedDataChanged.emit();
}

export async function recordFinish(r: FinishRecord): Promise<void> {
  const list = await getRecords();
  list.push(r);
  await setJSON(KEY, list);
  syncedDataChanged.emit();
}

export interface GameStats {
  played: number;
  won: number;
  bestTimeMs: number | null;
  avgTimeMs: number | null;
  currentStreak: number; // consecutive days of daily wins up to today
  bestStreak: number; // longest streak ever
  // Wordle-specific:
  avgGuesses: number | null;
  guessHistogram: number[]; // index 0..5 for 1..6 guesses
}

// Stats for a single Sudoku difficulty bucket. Hides win-streak fields since
// those are aggregated at the game level, not per difficulty.
export interface DifficultyStats {
  difficulty: string;
  played: number;
  won: number;
  bestTimeMs: number | null;
  avgTimeMs: number | null;
}

export function computeSudokuByDifficulty(records: FinishRecord[]): DifficultyStats[] {
  const order = ['easy', 'medium', 'hard', 'expert', 'master', 'extreme'];
  const buckets = new Map<string, FinishRecord[]>();
  for (const r of records) {
    if (r.game !== 'sudoku' || !r.difficulty) continue;
    const list = buckets.get(r.difficulty) ?? [];
    list.push(r);
    buckets.set(r.difficulty, list);
  }
  const result: DifficultyStats[] = [];
  for (const d of order) {
    const list = buckets.get(d) ?? [];
    const wins = list.filter(r => r.outcome === 'won');
    let best: number | null = null;
    let total = 0;
    for (const w of wins) {
      total += w.timeMs;
      if (best === null || w.timeMs < best) best = w.timeMs;
    }
    result.push({
      difficulty: d,
      played: list.length,
      won: wins.length,
      bestTimeMs: best,
      avgTimeMs: wins.length ? Math.round(total / wins.length) : null,
    });
  }
  return result;
}

export function computeStats(records: FinishRecord[], game: GameId): GameStats {
  const all = records.filter(r => r.game === game);
  const wins = all.filter(r => r.outcome === 'won');

  let bestTimeMs: number | null = null;
  let totalTime = 0;
  for (const w of wins) {
    totalTime += w.timeMs;
    if (bestTimeMs === null || w.timeMs < bestTimeMs) bestTimeMs = w.timeMs;
  }
  const avgTimeMs = wins.length ? Math.round(totalTime / wins.length) : null;

  // Daily streaks (one entry per date; latest counts).
  const dailyWinDates = new Set(wins.filter(r => r.mode === 'daily').map(r => r.date));
  const sorted = Array.from(dailyWinDates).sort();
  let bestStreak = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    if (prev && shiftISO(prev, 1) === d) run++;
    else run = 1;
    if (run > bestStreak) bestStreak = run;
    prev = d;
  }

  let currentStreak = 0;
  if (dailyWinDates.size > 0) {
    const today = todayISO();
    const yesterday = shiftISO(today, -1);
    let cursor: string | null = dailyWinDates.has(today)
      ? today
      : dailyWinDates.has(yesterday)
        ? yesterday
        : null;
    while (cursor && dailyWinDates.has(cursor)) {
      currentStreak++;
      cursor = shiftISO(cursor, -1);
    }
  }

  // Wordle-specific.
  let avgGuesses: number | null = null;
  const guessHistogram = [0, 0, 0, 0, 0, 0];
  if (game === 'wordle') {
    const withGuesses = wins.filter(r => typeof r.guesses === 'number');
    if (withGuesses.length) {
      const sum = withGuesses.reduce((acc, r) => acc + (r.guesses ?? 0), 0);
      avgGuesses = +(sum / withGuesses.length).toFixed(2);
      for (const r of withGuesses) {
        const g = r.guesses!;
        if (g >= 1 && g <= 6) guessHistogram[g - 1]++;
      }
    }
  }

  return {
    played: all.length,
    won: wins.length,
    bestTimeMs,
    avgTimeMs,
    currentStreak,
    bestStreak,
    avgGuesses,
    guessHistogram,
  };
}

export function winRate(s: GameStats): number {
  return s.played === 0 ? 0 : Math.round((s.won / s.played) * 100);
}
