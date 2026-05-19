import type { Difficulty } from '@/games/sudoku/types';

export type SudokuMode =
  | { kind: 'random'; difficulty: Difficulty }
  | { kind: 'daily' };

export type RootStackParamList = {
  Home: undefined;
  Sudoku: { mode: SudokuMode };
  Leaderboard: undefined;
  Settings: undefined;
};
