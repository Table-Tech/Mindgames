// Pure Wordle game rules: how a key press changes the game.

import type { FeedbackCue, PlayMode } from '@/core/game';
import { dailyAnswer, evaluate, randomAnswer, violatesHardMode } from './engine';
import { MAX_GUESSES, WORD_LENGTH, type WordleState } from './types';

export function createWordleGame(mode: PlayMode, now: number): WordleState {
  return {
    answer: mode.kind === 'daily' ? dailyAnswer() : randomAnswer(),
    guesses: [],
    current: '',
    startedAt: now,
    finishedAt: null,
    outcome: 'playing',
  };
}

/** A saved daily only counts if it is still today's word. */
export function isResumable(saved: WordleState, mode: PlayMode): boolean {
  return mode.kind !== 'daily' || saved.answer === dailyAnswer();
}

export interface KeyRules {
  hardMode: boolean;
  isValidWord: (word: string) => boolean;
  now: number;
}

export interface KeyResult {
  state: WordleState;
  cues: FeedbackCue[];
  toast?: string;
}

/** Applies one key ('a'..'z', 'ENTER' or 'BACK'); null when nothing happens. */
export function pressKey(s: WordleState, key: string, rules: KeyRules): KeyResult | null {
  if (s.outcome !== 'playing') return null;

  if (key === 'BACK') {
    return { state: { ...s, current: s.current.slice(0, -1) }, cues: ['tap'] };
  }

  if (key === 'ENTER') {
    if (s.current.length < WORD_LENGTH) {
      return { state: s, cues: ['wrong'], toast: 'Not enough letters' };
    }
    const word = s.current.toLowerCase();
    if (!rules.isValidWord(word)) {
      return { state: s, cues: ['wrong'], toast: 'Not in word list' };
    }
    if (rules.hardMode) {
      const violation = violatesHardMode(word, s.guesses);
      if (violation) return { state: s, cues: ['wrong'], toast: violation };
    }
    const states = evaluate(word, s.answer);
    const guesses = [...s.guesses, { word, states }];
    const solved = states.every(st => st === 'correct');
    const exhausted = !solved && guesses.length >= MAX_GUESSES;
    return {
      state: {
        ...s,
        guesses,
        current: '',
        finishedAt: solved || exhausted ? rules.now : null,
        outcome: solved ? 'won' : exhausted ? 'lost' : 'playing',
      },
      cues: [solved ? 'win' : exhausted ? 'lose' : 'correct'],
    };
  }

  if (/^[a-z]$/.test(key) && s.current.length < WORD_LENGTH) {
    return { state: { ...s, current: s.current + key }, cues: ['tap'] };
  }
  return null;
}

export function elapsedMs(s: WordleState, now: number): number {
  return s.outcome === 'playing' ? now - s.startedAt : (s.finishedAt ?? s.startedAt) - s.startedAt;
}
