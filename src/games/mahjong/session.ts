// Pure Mahjong Solitaire rules: selecting/matching tiles, hints and shuffles.

import type { FeedbackCue, PlayMode } from '@/core/game';
import {
  dailySeed,
  findHint,
  generateMahjong,
  isStuck,
  randomSeed,
  solvableShuffle,
} from './engine';
import type { MahjongState } from './types';

export const STARTING_HINTS = 3;
export const STARTING_SHUFFLES = 2;
export const MATCH_POINTS = 100;
export const HINT_PENALTY = 100;
export const SHUFFLE_PENALTY = 200;

/** The part of the state that undo restores. */
export type MahjongSnapshot = Pick<
  MahjongState,
  'removed' | 'hintsLeft' | 'shufflesLeft' | 'score'
>;

export function createMahjongGame(mode: PlayMode, now: number): MahjongState {
  const seed = mode.kind === 'daily' ? dailySeed() : randomSeed();
  return {
    tiles: generateMahjong(seed),
    removed: new Set(),
    startedAt: now,
    finishedAt: null,
    outcome: 'playing',
    hintsLeft: STARTING_HINTS,
    shufflesLeft: STARTING_SHUFFLES,
    score: 0,
  };
}

/** A saved daily only counts if it was started within the last day and a half. */
export function isResumable(saved: MahjongState, mode: PlayMode, now: number): boolean {
  return mode.kind !== 'daily' || saved.startedAt > now - 36 * 3600 * 1000;
}

export function snapshotOf(s: MahjongState): MahjongSnapshot {
  return {
    removed: new Set(s.removed),
    hintsLeft: s.hintsLeft,
    shufflesLeft: s.shufflesLeft,
    score: s.score,
  };
}

export function restoreSnapshot(s: MahjongState, snap: MahjongSnapshot): MahjongState {
  return { ...s, ...snap };
}

export interface SelectResult {
  state: MahjongState;
  selectedId: number | null;
  cues: FeedbackCue[];
  toast?: string;
  /** True when a pair was removed (the move can be undone). */
  matched: boolean;
}

export function selectTile(
  s: MahjongState,
  selectedId: number | null,
  id: number,
  now: number,
): SelectResult | null {
  if (s.outcome !== 'playing') return null;
  if (selectedId === null) return { state: s, selectedId: id, cues: [], matched: false };
  if (selectedId === id) return { state: s, selectedId: null, cues: [], matched: false };

  const a = s.tiles[selectedId];
  const b = s.tiles[id];
  if (a.group !== b.group) {
    return { state: s, selectedId: null, cues: ['wrong'], toast: 'No match', matched: false };
  }

  const removed = new Set(s.removed);
  removed.add(a.id);
  removed.add(b.id);
  const finishedAll = removed.size === s.tiles.length;
  const stuck = !finishedAll && isStuck(s.tiles, removed);
  const cues: FeedbackCue[] = ['correct'];
  if (finishedAll) cues.push('win');
  else if (stuck) cues.push('lose');

  return {
    state: {
      ...s,
      removed,
      finishedAt: finishedAll || stuck ? now : null,
      outcome: finishedAll ? 'won' : stuck ? 'stuck' : 'playing',
      score: s.score + MATCH_POINTS,
    },
    selectedId: null,
    cues,
    matched: true,
  };
}

export type HintResult =
  | { ok: true; state: MahjongState; pair: [number, number] }
  | { ok: false; toast: string };

export function takeHint(s: MahjongState): HintResult | null {
  if (s.outcome !== 'playing' || s.hintsLeft <= 0) return null;
  const pair = findHint(s.tiles, s.removed);
  if (!pair) return { ok: false, toast: 'No matches available' };
  return {
    ok: true,
    pair,
    state: { ...s, hintsLeft: s.hintsLeft - 1, score: Math.max(0, s.score - HINT_PENALTY) },
  };
}

export function shuffleRemaining(s: MahjongState): MahjongState | null {
  if (s.outcome !== 'playing' || s.shufflesLeft <= 0) return null;
  return {
    ...s,
    tiles: solvableShuffle(s.tiles, s.removed),
    shufflesLeft: s.shufflesLeft - 1,
    score: Math.max(0, s.score - SHUFFLE_PENALTY),
  };
}

export function elapsedMs(s: MahjongState, now: number): number {
  return s.outcome === 'playing' ? now - s.startedAt : (s.finishedAt ?? s.startedAt) - s.startedAt;
}
