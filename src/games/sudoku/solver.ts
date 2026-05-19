import type { Board } from './types';

const idx = (r: number, c: number) => r * 9 + c;

export function isSafe(board: Board, row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[idx(row, i)] === num) return false;
    if (board[idx(i, col)] === num) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (board[idx(r, c)] === num) return false;
    }
  }
  return true;
}

function findEmpty(board: Board): number {
  for (let i = 0; i < 81; i++) if (board[i] === 0) return i;
  return -1;
}

// Count solutions up to `limit`. Used to verify uniqueness during generation.
export function countSolutions(board: Board, limit = 2): number {
  const work = board.slice();
  let count = 0;
  const solve = (): void => {
    if (count >= limit) return;
    const pos = findEmpty(work);
    if (pos === -1) {
      count++;
      return;
    }
    const row = Math.floor(pos / 9);
    const col = pos % 9;
    for (let n = 1; n <= 9; n++) {
      if (isSafe(work, row, col, n)) {
        work[pos] = n;
        solve();
        if (count >= limit) return;
        work[pos] = 0;
      }
    }
  };
  solve();
  return count;
}

export function solve(board: Board): Board | null {
  const work = board.slice();
  const recurse = (): boolean => {
    const pos = findEmpty(work);
    if (pos === -1) return true;
    const row = Math.floor(pos / 9);
    const col = pos % 9;
    for (let n = 1; n <= 9; n++) {
      if (isSafe(work, row, col, n)) {
        work[pos] = n;
        if (recurse()) return true;
        work[pos] = 0;
      }
    }
    return false;
  };
  return recurse() ? work : null;
}
