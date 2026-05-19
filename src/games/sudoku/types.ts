export type Cell = number; // 0 = empty, 1..9 filled
export type Board = Cell[]; // length 81, row-major

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface Puzzle {
  given: Board;     // initial clues (immutable cells are non-zero)
  solution: Board;  // the unique solution
  difficulty: Difficulty;
  seed: number;     // PRNG seed used
}
