import { Share } from 'react-native';
import type { Guess } from '@/games/wordle/types';

const SQUARES: Record<string, string> = {
  correct: '\u{1F7E9}', // 🟩
  present: '\u{1F7E8}', // 🟨
  absent:  '\u{2B1B}',  // ⬛ (works for both light and dark; could swap to ⬜ if you want)
};

export function wordleShareText(guesses: Guess[], maxGuesses: number, dayLabel: string): string {
  const tries = guesses.length;
  const solved = guesses[guesses.length - 1]?.states.every(s => s === 'correct') ?? false;
  const head = `Mindgames Wordle ${dayLabel} ${solved ? tries : 'X'}/${maxGuesses}`;
  const grid = guesses
    .map(g => g.states.map(s => SQUARES[s] ?? '⬛').join(''))
    .join('\n');
  return `${head}\n\n${grid}`;
}

export interface ResultShare {
  game: 'sudoku' | 'wordle' | 'mahjong';
  difficulty?: string;
  timeMs: number;
  score?: number;
  guesses?: number;
  maxGuesses?: number;
  won: boolean;
  dayLabel?: string; // for daily mode
  wordleGuesses?: Guess[];
}

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

export function buildShareText(r: ResultShare): string {
  if (r.game === 'wordle' && r.wordleGuesses && r.maxGuesses) {
    return wordleShareText(r.wordleGuesses, r.maxGuesses, r.dayLabel ?? '');
  }
  const parts: string[] = [];
  const gameLabel = r.game[0].toUpperCase() + r.game.slice(1);
  const tag = r.dayLabel ? `${gameLabel} ${r.dayLabel}` : gameLabel;
  parts.push(`Mindgames ${tag}`);
  if (r.difficulty) parts.push(`Difficulty: ${r.difficulty}`);
  parts.push(r.won ? `Solved in ${fmtTime(r.timeMs)}` : 'Did not solve');
  if (typeof r.score === 'number') parts.push(`Score: ${r.score}`);
  return parts.join(' · ');
}

export async function shareResult(r: ResultShare): Promise<void> {
  const message = buildShareText(r);
  try {
    await Share.share({ message });
  } catch {
    // user dismissed
  }
}
