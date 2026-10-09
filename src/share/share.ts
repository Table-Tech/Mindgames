import { Share } from 'react-native';
import type { GameId } from '@/core/game';
import { capitalize, formatTime } from '@/core/format';
import type { Guess } from '@/games/wordle/types';
import { WORD_GAME_NAME } from '@/games/wordle/name';

// Squares match the in-app Wordle colors (blue = correct, yellow = present).
const SQUARES: Record<string, string> = {
  correct: '\u{1F7E6}', // 🟦
  present: '\u{1F7E8}', // 🟨
  absent: '\u{2B1B}', // ⬛
};

export function wordleShareText(guesses: Guess[], maxGuesses: number, dayLabel: string): string {
  const tries = guesses.length;
  const solved = guesses[guesses.length - 1]?.states.every(s => s === 'correct') ?? false;
  const head = `Puzzaro ${WORD_GAME_NAME} ${dayLabel} ${solved ? tries : 'X'}/${maxGuesses}`;
  const grid = guesses.map(g => g.states.map(s => SQUARES[s] ?? '⬛').join('')).join('\n');
  return `${head}\n\n${grid}`;
}

interface BaseShare {
  timeMs: number;
  won: boolean;
  dayLabel?: string; // for daily mode
}

export interface SudokuShare extends BaseShare {
  game: 'sudoku';
  difficulty: string;
  score: number;
}

export interface WordleShare extends BaseShare {
  game: 'wordle';
  maxGuesses: number;
  wordleGuesses: Guess[];
}

export interface MahjongShare extends BaseShare {
  game: 'mahjong';
  score: number;
}

// Each game only carries the fields it actually shares.
export type ResultShare = SudokuShare | WordleShare | MahjongShare;

function summaryText(r: BaseShare & { game: GameId; difficulty?: string; score?: number }): string {
  const label = capitalize(r.game);
  const parts = [`Puzzaro ${r.dayLabel ? `${label} ${r.dayLabel}` : label}`];
  if (r.difficulty) parts.push(`Difficulty: ${r.difficulty}`);
  parts.push(r.won ? `Solved in ${formatTime(r.timeMs)}` : 'Did not solve');
  if (typeof r.score === 'number') parts.push(`Score: ${r.score}`);
  return parts.join(' · ');
}

// One formatter per game; adding a game adds an entry, nothing else changes.
const FORMATTERS: { [K in GameId]: (r: Extract<ResultShare, { game: K }>) => string } = {
  sudoku: summaryText,
  wordle: r => wordleShareText(r.wordleGuesses, r.maxGuesses, r.dayLabel ?? ''),
  mahjong: summaryText,
};

export function buildShareText(r: ResultShare): string {
  const format = FORMATTERS[r.game] as (r: ResultShare) => string;
  return format(r);
}

export async function shareResult(r: ResultShare): Promise<void> {
  try {
    await Share.share({ message: buildShareText(r) });
  } catch {
    // user dismissed
  }
}
