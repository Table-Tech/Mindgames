import { createGameRepository } from '@/storage/repository';
import type { PlayMode } from '@/core/game';
import type { Difficulty } from './types';

export type SudokuOutcome = 'playing' | 'won' | 'lost';

// JSON-safe snapshot of an in-progress Sudoku game.
// Sets (notes, hintLocked, wrong) are stored as arrays.
export interface SudokuPersistedState {
  difficulty: Difficulty;
  given: number[]; // length 81
  solution: number[]; // length 81
  seed: number;
  board: number[]; // length 81
  notes: number[][]; // 81 arrays of digits 1..9
  hintLocked: number[]; // cell indices
  wrong: number[]; // cell indices
  mistakes: number;
  hintsLeft: number;
  score: number;
  elapsedMs: number;
  paused: boolean;
  outcome: SudokuOutcome;
}

export type SudokuMode = PlayMode;

export const sudokuRepository = createGameRepository<SudokuPersistedState>({
  dailyKey: date => `sudoku.state.daily.${date}`,
  practiceKey: 'sudoku.state.practice',
});
