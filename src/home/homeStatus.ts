import { getJSON } from '@/storage/storage';
import { todayISO } from '@/leaderboard/leaderboard';
import { computeStats, getRecords, type GameId } from '@/stats/stats';

// In-progress state inspection. Each game persists under a different key
// (set during the save & resume work). We peek at the stored shape just
// enough to tell the home screen whether a daily / random game can be
// resumed and whether today's daily has already been finished.

interface SudokuSaved { outcome: 'playing' | 'won' | 'lost'; elapsedMs?: number }
interface WordleSaved { outcome: 'playing' | 'won' | 'lost'; guesses?: unknown[] }
interface MahjongSaved { outcome: 'playing' | 'won' | 'stuck'; removed?: number[] }

export interface DailyStatus {
  done: boolean;
  inProgress: boolean;
}

export interface ResumeInfo {
  hasPractice: boolean;
}

export interface HomeStatus {
  sudoku: { daily: DailyStatus; resume: ResumeInfo; streak: number };
  wordle: { daily: DailyStatus; resume: ResumeInfo; streak: number };
  mahjong: { daily: DailyStatus; resume: ResumeInfo; streak: number };
}

async function dailyStatus(
  key: string,
  isFinished: (s: unknown) => boolean,
  isPlaying: (s: unknown) => boolean,
): Promise<DailyStatus> {
  const s = await getJSON<unknown>(key);
  if (!s) return { done: false, inProgress: false };
  return { done: isFinished(s), inProgress: isPlaying(s) };
}

async function hasPractice(key: string): Promise<boolean> {
  const s = await getJSON<{ outcome?: string } | null>(key);
  return !!(s && s.outcome === 'playing');
}

export async function loadHomeStatus(): Promise<HomeStatus> {
  const today = todayISO();
  const records = await getRecords();

  const [sudokuDaily, wordleDaily, mahjongDaily, sudokuPractice, wordlePractice, mahjongPractice] =
    await Promise.all([
      dailyStatus(
        `sudoku.state.daily.${today}`,
        (s: any) => s?.outcome === 'won' || s?.outcome === 'lost',
        (s: any) => s?.outcome === 'playing',
      ),
      dailyStatus(
        `wordle.state.daily.${today}`,
        (s: any) => s?.outcome === 'won' || s?.outcome === 'lost',
        (s: any) => s?.outcome === 'playing',
      ),
      dailyStatus(
        `mahjong.state.daily.${today}`,
        (s: any) => s?.outcome === 'won' || s?.outcome === 'stuck',
        (s: any) => s?.outcome === 'playing',
      ),
      hasPractice('sudoku.state.practice'),
      hasPractice('wordle.state.random'),
      hasPractice('mahjong.state.random'),
    ]);

  const streakOf = (g: GameId) => computeStats(records, g).currentStreak;

  return {
    sudoku:  { daily: sudokuDaily,  resume: { hasPractice: sudokuPractice  }, streak: streakOf('sudoku')  },
    wordle:  { daily: wordleDaily,  resume: { hasPractice: wordlePractice  }, streak: streakOf('wordle')  },
    mahjong: { daily: mahjongDaily, resume: { hasPractice: mahjongPractice }, streak: streakOf('mahjong') },
  };
}
