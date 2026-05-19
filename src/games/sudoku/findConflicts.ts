import type { Board } from './types';

// Returns indices of cells that conflict with at least one peer.
export function findConflicts(board: Board): Set<number> {
  const bad = new Set<number>();
  const check = (cells: number[]) => {
    const seen = new Map<number, number[]>();
    for (const i of cells) {
      const v = board[i];
      if (v === 0) continue;
      const list = seen.get(v) ?? [];
      list.push(i);
      seen.set(v, list);
    }
    for (const list of seen.values()) {
      if (list.length > 1) list.forEach(i => bad.add(i));
    }
  };

  for (let r = 0; r < 9; r++) check(Array.from({ length: 9 }, (_, c) => r * 9 + c));
  for (let c = 0; c < 9; c++) check(Array.from({ length: 9 }, (_, r) => r * 9 + c));
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const cells: number[] = [];
      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) cells.push(r * 9 + c);
      }
      check(cells);
    }
  }
  return bad;
}

export function isComplete(board: Board): boolean {
  for (let i = 0; i < 81; i++) if (board[i] === 0) return false;
  return findConflicts(board).size === 0;
}
