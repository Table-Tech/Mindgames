import {
  applyHint,
  eraseCell,
  inputNumber,
  MAX_MISTAKES,
  remainingOf,
  restoreSnapshot,
  snapshotOf,
  tick,
  togglePause,
} from '../session';
import type { SudokuPersistedState } from '../persistence';

const SOLUTION = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'
  .split('')
  .map(Number);

// A finished board with the given cells blanked out.
function game(blank: number[], over: Partial<SudokuPersistedState> = {}): SudokuPersistedState {
  const given = SOLUTION.map((v, i) => (blank.includes(i) ? 0 : v));
  return {
    difficulty: 'medium',
    given,
    solution: SOLUTION,
    seed: 1,
    board: given.slice(),
    notes: Array.from({ length: 81 }, () => []),
    hintLocked: [],
    wrong: [],
    mistakes: 0,
    hintsLeft: 3,
    score: 0,
    elapsedMs: 0,
    paused: false,
    outcome: 'playing',
    ...over,
  };
}

describe('sudoku session', () => {
  it('scores a correct placement and wins when the board is complete', () => {
    const step = inputNumber(game([0]), 0, 5, false);
    expect(step?.state.board[0]).toBe(5);
    expect(step?.state.score).toBeGreaterThan(0);
    expect(step?.state.outcome).toBe('won');
    expect(step?.cues).toEqual(['correct', 'win']);
  });

  it('counts a wrong placement as a mistake and loses after the limit', () => {
    let s = game([0, 1], { mistakes: MAX_MISTAKES - 1 });
    const step = inputNumber(s, 0, 9, false);
    expect(step?.state.wrong).toContain(0);
    expect(step?.state.outcome).toBe('lost');
    expect(step?.cues).toEqual(['wrong', 'lose']);
    s = step!.state;
    expect(s.mistakes).toBe(MAX_MISTAKES);
  });

  it('ignores input on given cells, while paused and with no selection', () => {
    expect(inputNumber(game([0]), 5, 1, false)).toBeNull();
    expect(inputNumber(game([0], { paused: true }), 0, 5, false)).toBeNull();
    expect(inputNumber(game([0]), null, 5, false)).toBeNull();
  });

  it('toggles notes in notes mode without touching the board', () => {
    const step = inputNumber(game([0, 1]), 0, 4, true);
    expect(step?.state.notes[0]).toEqual([4]);
    expect(step?.state.board[0]).toBe(0);
  });

  it('erases a wrong value and clears its mistake marker', () => {
    const wrong = inputNumber(game([0, 1]), 0, 9, false)!.state;
    const erased = eraseCell(wrong, 0)!.state;
    expect(erased.board[0]).toBe(0);
    expect(erased.wrong).not.toContain(0);
  });

  it('hint fills the solution, locks the cell and costs a hint', () => {
    const s = applyHint(game([0, 1]), 0)!.state;
    expect(s.board[0]).toBe(SOLUTION[0]);
    expect(s.hintLocked).toContain(0);
    expect(s.hintsLeft).toBe(2);
    expect(inputNumber(s, 0, 1, false)).toBeNull();
  });

  it('undo restores the snapshot taken before a move', () => {
    const before = game([0, 1]);
    const after = inputNumber(before, 0, 9, false)!.state;
    const restored = restoreSnapshot(after, snapshotOf(before));
    expect(restored.board).toEqual(before.board);
    expect(restored.mistakes).toBe(0);
  });

  it('counts remaining digits and only ticks while active', () => {
    expect(remainingOf(game([0]), 5)).toBe(1);
    expect(tick(game([0]), 1000).elapsedMs).toBe(1000);
    expect(tick(togglePause(game([0])), 1000).elapsedMs).toBe(0);
  });
});

describe('sudoku session options', () => {
  it('keeps peer notes when auto-cleanup is off', () => {
    const s = game([0, 1]);
    const withNote = { ...s, notes: s.notes.map((n, i) => (i === 1 ? [5] : n)) };
    const on = inputNumber(withNote, 0, 5, false)!.state;
    const off = inputNumber(withNote, 0, 5, false, { autoCleanupNotes: false })!.state;
    expect(on.notes[1]).toEqual([]);
    expect(off.notes[1]).toEqual([5]);
  });
});
