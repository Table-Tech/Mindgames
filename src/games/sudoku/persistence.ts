import { getJSON, remove, setJSON } from '@/storage/storage';
import { todayISO } from '@/leaderboard/leaderboard';
import type { Difficulty } from './types';

export type SudokuOutcome = 'playing' | 'won' | 'lost';

// JSON-safe snapshot of an in-progress Sudoku game.
// Sets (notes, hintLocked, wrong) are stored as arrays.
export interface SudokuPersistedState {
  difficulty: Difficulty;
  given: number[];           // length 81
  solution: number[];        // length 81
  seed: number;
  board: number[];           // length 81
  notes: number[][];         // 81 arrays of digits 1..9
  hintLocked: number[];      // cell indices
  wrong: number[];           // cell indices
  mistakes: number;
  hintsLeft: number;
  score: number;
  elapsedMs: number;
  paused: boolean;
  outcome: SudokuOutcome;
}

export type SudokuMode =
  | { kind: 'random' }
  | { kind: 'daily' };

function key(mode: SudokuMode): string {
  return mode.kind === 'daily'
    ? `sudoku.state.daily.${todayISO()}`
    : 'sudoku.state.practice';
}

export async function loadSudoku(mode: SudokuMode): Promise<SudokuPersistedState | null> {
  return getJSON<SudokuPersistedState>(key(mode));
}

export async function saveSudoku(mode: SudokuMode, state: SudokuPersistedState): Promise<void> {
  await setJSON(key(mode), state);
}

export async function clearSudoku(mode: SudokuMode): Promise<void> {
  await remove(key(mode));
}
