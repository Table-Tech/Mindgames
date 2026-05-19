import { isSafe } from './solver';
import type { Board } from './types';

// Fill every empty unlocked cell with the set of digits that are not yet
// excluded by row / column / 3x3 box constraints. Useful as a one-shot
// "compute candidates" action; the player can then refine manually.

export function autoPencil(
  board: Board,
  isLocked: (i: number) => boolean,
): Set<number>[] {
  const notes: Set<number>[] = Array.from({ length: 81 }, () => new Set<number>());
  for (let i = 0; i < 81; i++) {
    if (board[i] !== 0) continue;
    if (isLocked(i)) continue;
    const row = Math.floor(i / 9);
    const col = i % 9;
    for (let n = 1; n <= 9; n++) {
      if (isSafe(board, row, col, n)) notes[i].add(n);
    }
  }
  return notes;
}
