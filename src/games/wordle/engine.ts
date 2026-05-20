import { mulberry32, seedFromString } from '@/games/sudoku/prng';
import { WORDS } from './words';
import type { Guess, LetterState } from './types';
import { WORD_LENGTH } from './types';

// Standard Wordle evaluation: correct (green) > present (yellow) > absent (grey).
// Duplicates in the guess: a letter is only "present" if it has not already been
// matched (either green or earlier yellow) against an answer letter.
export function evaluate(guess: string, answer: string): LetterState[] {
  if (guess.length !== WORD_LENGTH || answer.length !== WORD_LENGTH) {
    throw new Error('evaluate: words must be exactly 5 letters');
  }
  const g = guess.toLowerCase();
  const a = answer.toLowerCase();
  const result: LetterState[] = new Array(WORD_LENGTH).fill('absent');
  const consumed = new Array(WORD_LENGTH).fill(false);

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (g[i] === a[i]) {
      result[i] = 'correct';
      consumed[i] = true;
    }
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'correct') continue;
    for (let j = 0; j < WORD_LENGTH; j++) {
      if (!consumed[j] && g[i] === a[j]) {
        result[i] = 'present';
        consumed[j] = true;
        break;
      }
    }
  }
  return result;
}

// Hard-mode validator. Once the player has revealed a green or yellow letter
// in a previous guess, any subsequent guess must reuse those constraints:
//   * green letters must remain in the same position
//   * yellow letters must appear somewhere in the guess
export function violatesHardMode(guess: string, history: Guess[]): string | null {
  const g = guess.toLowerCase();
  // Build per-position green requirements and a multiset of yellow letters.
  const greenAt = new Map<number, string>();
  const yellowCounts = new Map<string, number>();
  for (const h of history) {
    const local: Record<string, number> = {};
    for (let i = 0; i < h.states.length; i++) {
      if (h.states[i] === 'correct') greenAt.set(i, h.word[i]);
      else if (h.states[i] === 'present') {
        local[h.word[i]] = (local[h.word[i]] ?? 0) + 1;
      }
    }
    for (const [ch, n] of Object.entries(local)) {
      yellowCounts.set(ch, Math.max(yellowCounts.get(ch) ?? 0, n));
    }
  }
  for (const [pos, ch] of greenAt) {
    if (g[pos] !== ch) {
      return `${ch.toUpperCase()} must stay in position ${pos + 1}`;
    }
  }
  const guessCounts: Record<string, number> = {};
  for (const ch of g) guessCounts[ch] = (guessCounts[ch] ?? 0) + 1;
  for (const [ch, n] of yellowCounts) {
    if ((guessCounts[ch] ?? 0) < n) {
      return `Guess must contain "${ch.toUpperCase()}"`;
    }
  }
  return null;
}

// Best-known state per letter, combining all submitted guesses so far.
// Used to color the on-screen keyboard.
export function keyboardStates(guesses: Guess[]): Record<string, LetterState> {
  const rank: Record<LetterState, number> = {
    empty: 0,
    pending: 0,
    absent: 1,
    present: 2,
    correct: 3,
  };
  const map: Record<string, LetterState> = {};
  for (const g of guesses) {
    for (let i = 0; i < WORD_LENGTH; i++) {
      const ch = g.word[i];
      const cur = map[ch];
      if (!cur || rank[g.states[i]] > rank[cur]) map[ch] = g.states[i];
    }
  }
  return map;
}

export function dailyAnswer(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = date.getUTCDate().toString().padStart(2, '0');
  const seed = seedFromString(`wordle-${y}-${m}-${d}`);
  // Deterministic but uniformly spread across the word list.
  return WORDS[seed % WORDS.length];
}

export function randomAnswer(): string {
  const rand = mulberry32((Math.random() * 0xffffffff) >>> 0 || 1);
  return WORDS[Math.floor(rand() * WORDS.length)];
}
