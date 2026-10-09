// Pure Sudoku game rules. Every move takes the current state and returns the
// next one plus the feedback cues to play — no React, storage or side effects.

import type { FeedbackCue } from '@/core/game';
import { dailyPuzzle, randomPuzzle } from './generator';
import { isComplete } from './findConflicts';
import { clearNotes, clearPeerNotes, toggleNote, type Notes } from './notes';
import { autoPencil } from './autoPencil';
import { DIFFICULTY_POINTS, type Difficulty } from './types';
import type { SudokuMode, SudokuPersistedState } from './persistence';

export const MAX_MISTAKES = 3;
export const STARTING_HINTS = 3;
export const MISTAKE_PENALTY = 50;
export const HINT_PENALTY = 100;

export type SudokuStartMode = { kind: 'random'; difficulty: Difficulty } | { kind: 'daily' };

/** The part of the state that undo restores. */
export type SudokuSnapshot = Pick<
  SudokuPersistedState,
  'board' | 'notes' | 'wrong' | 'hintLocked' | 'mistakes' | 'hintsLeft' | 'score'
>;

/** Result of a move that changed the game. */
export interface SudokuStep {
  state: SudokuPersistedState;
  cues: FeedbackCue[];
}

export function toPersistMode(mode: SudokuStartMode): SudokuMode {
  return mode.kind === 'daily' ? { kind: 'daily' } : { kind: 'random' };
}

export function createSudokuGame(
  mode: SudokuStartMode,
  difficultyOverride?: Difficulty,
): SudokuPersistedState {
  const difficulty = difficultyOverride ?? (mode.kind === 'random' ? mode.difficulty : 'medium');
  const puzzle = mode.kind === 'daily' ? dailyPuzzle() : randomPuzzle(difficulty);
  return {
    difficulty: puzzle.difficulty,
    given: puzzle.given.slice(),
    solution: puzzle.solution.slice(),
    seed: puzzle.seed,
    board: puzzle.given.slice(),
    notes: Array.from({ length: 81 }, () => []),
    hintLocked: [],
    wrong: [],
    mistakes: 0,
    hintsLeft: STARTING_HINTS,
    score: 0,
    elapsedMs: 0,
    paused: false,
    outcome: 'playing',
  };
}

const toNotes = (arr: number[][]): Notes => arr.map(a => new Set(a));
const fromNotes = (notes: Notes): number[][] => notes.map(s => Array.from(s));

export function snapshotOf(s: SudokuPersistedState): SudokuSnapshot {
  return {
    board: s.board,
    notes: s.notes,
    wrong: s.wrong,
    hintLocked: s.hintLocked,
    mistakes: s.mistakes,
    hintsLeft: s.hintsLeft,
    score: s.score,
  };
}

export function restoreSnapshot(
  s: SudokuPersistedState,
  snap: SudokuSnapshot,
): SudokuPersistedState {
  return { ...s, ...snap };
}

export function isLocked(s: SudokuPersistedState, i: number): boolean {
  return s.given[i] !== 0 || s.hintLocked.includes(i);
}

export function isActive(s: SudokuPersistedState): boolean {
  return s.outcome === 'playing' && !s.paused;
}

/** How many more of digit `n` still need to be placed correctly. */
export function remainingOf(s: SudokuPersistedState, n: number): number {
  return 9 - s.board.filter((v, i) => v === n && v === s.solution[i]).length;
}

export interface InputOptions {
  /** Remove a correctly placed digit from the notes of its row/column/box. */
  autoCleanupNotes: boolean;
}

const DEFAULT_INPUT: InputOptions = { autoCleanupNotes: true };

export function inputNumber(
  s: SudokuPersistedState,
  cell: number | null,
  n: number,
  notesMode: boolean,
  opts: InputOptions = DEFAULT_INPUT,
): SudokuStep | null {
  if (!isActive(s) || cell == null || isLocked(s, cell)) return null;

  if (notesMode && n !== 0) {
    if (s.board[cell] !== 0) return null;
    return { state: { ...s, notes: fromNotes(toggleNote(toNotes(s.notes), cell, n)) }, cues: [] };
  }

  const placing = s.board[cell] === n ? 0 : n; // tapping the same digit clears it
  const board = s.board.slice();
  board[cell] = placing;

  const wrong = new Set(s.wrong);
  let mistakes = s.mistakes;
  let score = s.score;
  const cues: FeedbackCue[] = [];
  const correct = placing !== 0 && placing === s.solution[cell];

  if (placing === 0 || correct) {
    wrong.delete(cell);
    if (correct) {
      score += DIFFICULTY_POINTS[s.difficulty];
      cues.push('correct');
    }
  } else {
    wrong.add(cell);
    mistakes += 1;
    score = Math.max(0, score - MISTAKE_PENALTY);
    cues.push('wrong');
  }

  let notes = clearNotes(toNotes(s.notes), cell);
  if (correct && opts.autoCleanupNotes) notes = clearPeerNotes(notes, cell, placing);

  const lost = mistakes >= MAX_MISTAKES;
  const won = !lost && isComplete(board) && wrong.size === 0;
  if (won) cues.push('win');
  else if (lost) cues.push('lose');

  return {
    state: {
      ...s,
      board,
      notes: fromNotes(notes),
      wrong: Array.from(wrong),
      mistakes,
      score,
      outcome: lost ? 'lost' : won ? 'won' : 'playing',
    },
    cues,
  };
}

export function eraseCell(s: SudokuPersistedState, cell: number | null): SudokuStep | null {
  if (!isActive(s) || cell == null || isLocked(s, cell)) return null;
  if (s.board[cell] === 0 && s.notes[cell].length === 0) return null;

  if (s.board[cell] !== 0) {
    const board = s.board.slice();
    board[cell] = 0;
    return { state: { ...s, board, wrong: s.wrong.filter(i => i !== cell) }, cues: [] };
  }
  return { state: { ...s, notes: fromNotes(clearNotes(toNotes(s.notes), cell)) }, cues: [] };
}

export function applyHint(
  s: SudokuPersistedState,
  cell: number | null,
  opts: InputOptions = DEFAULT_INPUT,
): SudokuStep | null {
  if (!isActive(s) || s.hintsLeft <= 0 || cell == null || isLocked(s, cell)) return null;
  if (s.board[cell] === s.solution[cell]) return null;

  const digit = s.solution[cell];
  const board = s.board.slice();
  board[cell] = digit;
  const wrong = s.wrong.filter(i => i !== cell);
  const cleared = clearNotes(toNotes(s.notes), cell);
  const notes = opts.autoCleanupNotes ? clearPeerNotes(cleared, cell, digit) : cleared;
  const won = isComplete(board) && wrong.length === 0;

  return {
    state: {
      ...s,
      board,
      notes: fromNotes(notes),
      wrong,
      hintLocked: [...s.hintLocked, cell],
      hintsLeft: s.hintsLeft - 1,
      score: Math.max(0, s.score - HINT_PENALTY),
      outcome: won ? 'won' : 'playing',
    },
    cues: [],
  };
}

export function fillAutoPencil(s: SudokuPersistedState): SudokuStep | null {
  if (!isActive(s)) return null;
  const notes = autoPencil(s.board, i => isLocked(s, i));
  return { state: { ...s, notes: fromNotes(notes) }, cues: [] };
}

export function togglePause(s: SudokuPersistedState): SudokuPersistedState {
  return s.outcome === 'playing' ? { ...s, paused: !s.paused } : s;
}

export function tick(s: SudokuPersistedState, ms: number): SudokuPersistedState {
  return isActive(s) ? { ...s, elapsedMs: s.elapsedMs + ms } : s;
}
