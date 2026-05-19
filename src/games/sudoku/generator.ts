import type { Board, Difficulty, Puzzle } from './types';
import { mulberry32, shuffle, seedFromString } from './prng';
import { countSolutions, isSafe } from './solver';

const idx = (r: number, c: number) => r * 9 + c;

function fillFullBoard(rand: () => number): Board {
  const board: Board = new Array(81).fill(0);
  const fill = (pos: number): boolean => {
    if (pos === 81) return true;
    const row = Math.floor(pos / 9);
    const col = pos % 9;
    if (board[pos] !== 0) return fill(pos + 1);
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rand);
    for (const n of nums) {
      if (isSafe(board, row, col, n)) {
        board[pos] = n;
        if (fill(pos + 1)) return true;
        board[pos] = 0;
      }
    }
    return false;
  };
  fill(0);
  return board;
}

const TARGET_CLUES: Record<Difficulty, number> = {
  easy: 40,
  medium: 32,
  hard: 28,
  expert: 24,
};

function digHoles(solution: Board, difficulty: Difficulty, rand: () => number): Board {
  const puzzle = solution.slice();
  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => i),
    rand,
  );
  const target = TARGET_CLUES[difficulty];
  let clues = 81;

  for (const pos of positions) {
    if (clues <= target) break;
    const backup = puzzle[pos];
    if (backup === 0) continue;
    puzzle[pos] = 0;
    // Keep uniqueness: if more than one solution exists, put the digit back.
    if (countSolutions(puzzle, 2) !== 1) {
      puzzle[pos] = backup;
    } else {
      clues--;
    }
  }
  return puzzle;
}

export function generatePuzzle(difficulty: Difficulty, seed: number): Puzzle {
  const rand = mulberry32(seed);
  const solution = fillFullBoard(rand);
  const given = digHoles(solution, difficulty, rand);
  return { given, solution, difficulty, seed };
}

// Daily challenge: derive a stable seed from today's UTC date.
// Same date -> same puzzle for every player.
export function dailySeed(date = new Date()): number {
  const y = date.getUTCFullYear();
  const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = date.getUTCDate().toString().padStart(2, '0');
  return seedFromString(`${y}-${m}-${d}`);
}

export function dailyPuzzle(date = new Date(), difficulty: Difficulty = 'medium'): Puzzle {
  return generatePuzzle(difficulty, dailySeed(date));
}

export function randomPuzzle(difficulty: Difficulty): Puzzle {
  // Random seed for endless play.
  return generatePuzzle(difficulty, (Math.random() * 0xffffffff) >>> 0);
}
