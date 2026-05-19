import type { Difficulty } from '@/games/sudoku/types';
import type { WordleMode } from '@/games/wordle/types';
import type { MahjongMode } from '@/games/mahjong/types';

export type SudokuMode =
  | { kind: 'random'; difficulty: Difficulty }
  | { kind: 'daily' };

export type RootStackParamList = {
  Home: undefined;
  Sudoku: { mode: SudokuMode };
  Wordle: { mode: WordleMode };
  Mahjong: { mode: MahjongMode };
  Leaderboard: undefined;
  Settings: undefined;
};
