import { countSolutions, isSafe, solve } from '../solver';
import { generatePuzzle } from '../generator';
import type { Board } from '../types';

describe('Sudoku solver', () => {
  it('isSafe respects row, column, and box constraints', () => {
    const board: Board = new Array(81).fill(0);
    board[0] = 5; // row 0, col 0
    expect(isSafe(board, 0, 8, 5)).toBe(false); // same row
    expect(isSafe(board, 8, 0, 5)).toBe(false); // same column
    expect(isSafe(board, 2, 2, 5)).toBe(false); // same 3x3 box
    expect(isSafe(board, 3, 3, 5)).toBe(true);  // unrelated cell
  });

  it('solves an easy puzzle', () => {
    const puzzle = generatePuzzle('easy', 42);
    const solved = solve(puzzle.given);
    expect(solved).not.toBeNull();
    expect(solved).toEqual(puzzle.solution);
  });

  it('generated puzzles have a unique solution', () => {
    for (const seed of [1, 2, 3, 7, 100]) {
      const puzzle = generatePuzzle('medium', seed);
      expect(countSolutions(puzzle.given, 2)).toBe(1);
    }
  });
});
