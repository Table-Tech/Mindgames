export type LetterState = 'empty' | 'pending' | 'correct' | 'present' | 'absent';

export interface Guess {
  word: string;            // length 5
  states: LetterState[];   // length 5
}

export type WordleMode =
  | { kind: 'random' }
  | { kind: 'daily' };

export interface WordleState {
  answer: string;
  guesses: Guess[];
  current: string;          // in-progress row (not yet submitted)
  startedAt: number;        // ms epoch
  finishedAt: number | null;
  outcome: 'playing' | 'won' | 'lost';
}

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;
