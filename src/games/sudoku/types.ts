export type Cell = number; // 0 = empty, 1..9 filled
export type Board = Cell[]; // length 81, row-major

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master' | 'extreme';

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'master', 'extreme'];

// Points per correctly placed cell (used by the live score).
export const DIFFICULTY_POINTS: Record<Difficulty, number> = {
  easy: 5,
  medium: 10,
  hard: 20,
  expert: 35,
  master: 55,
  extreme: 80,
};

export interface Puzzle {
  given: Board; // initial clues (immutable cells are non-zero)
  solution: Board; // the unique solution
  difficulty: Difficulty;
  seed: number; // PRNG seed used
}
