// Notes / pencil marks: a Set<number> (digits 1-9) per cell.
export type Notes = Set<number>[];

export function emptyNotes(): Notes {
  return Array.from({ length: 81 }, () => new Set<number>());
}

export function toggleNote(notes: Notes, index: number, n: number): Notes {
  const next = notes.slice();
  const s = new Set(next[index]);
  if (s.has(n)) s.delete(n);
  else s.add(n);
  next[index] = s;
  return next;
}

export function clearNotes(notes: Notes, index: number): Notes {
  if (notes[index].size === 0) return notes;
  const next = notes.slice();
  next[index] = new Set();
  return next;
}

// When a digit is placed in a cell, remove that digit from notes of all peers
// (same row, column, 3x3 box). Standard "auto-pencil-cleanup" behavior.
export function clearPeerNotes(notes: Notes, index: number, digit: number): Notes {
  if (digit === 0) return notes;
  const row = Math.floor(index / 9);
  const col = index % 9;
  const boxR = Math.floor(row / 3) * 3;
  const boxC = Math.floor(col / 3) * 3;

  const peers: number[] = [];
  for (let i = 0; i < 9; i++) {
    peers.push(row * 9 + i);
    peers.push(i * 9 + col);
  }
  for (let r = boxR; r < boxR + 3; r++) {
    for (let c = boxC; c < boxC + 3; c++) peers.push(r * 9 + c);
  }

  let changed = false;
  const next = notes.slice();
  for (const p of peers) {
    if (p === index) continue;
    if (next[p].has(digit)) {
      if (!changed) changed = true;
      const s = new Set(next[p]);
      s.delete(digit);
      next[p] = s;
    }
  }
  return changed ? next : notes;
}
