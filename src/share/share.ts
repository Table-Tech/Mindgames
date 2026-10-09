import { Share } from 'react-native';
import type { GameId } from '@/core/game';
import { capitalize, formatClock } from '@/core/format';
import type { Guess } from '@/games/wordle/types';
import { WORD_GAME_NAME } from '@/games/wordle/name';
import { computeStats, getRecords } from '@/stats/stats';

// Shared results are plain text (works in every messenger), laid out as a
// small card: a bold header line that shows in share previews, the date, the
// game-specific result, the streak and an invitation.
//
// Example (Mahjong):
//   🀄 Puzzaro · Daily Mahjong
//   📅 Thu 9 Oct
//
//   ✅ Board cleared in 10:22
//   ⭐ 6,900 pts · 💡 0 hints · 🔀 0 shuffles
//
//   🔥 4-day streak
//   Can you beat me? 🧩

/** Store link appended to every share once the app is live. */
export const SHARE_URL: string | null = null;

// Squares match the in-app word game colors (blue = correct, yellow = present).
const SQUARES: Record<string, string> = {
  correct: '🟦',
  present: '🟨',
  absent: '⬛',
};

interface BaseShare {
  timeMs: number;
  won: boolean;
  dayLabel?: string; // ISO date, daily mode only
  /** Current daily streak; filled in by shareResult when not given. */
  streak?: number;
}

export interface SudokuShare extends BaseShare {
  game: 'sudoku';
  difficulty: string;
  score: number;
  mistakes: number;
  maxMistakes: number;
  hintsUsed: number;
}

export interface WordleShare extends BaseShare {
  game: 'wordle';
  maxGuesses: number;
  wordleGuesses: Guess[];
}

export interface MahjongShare extends BaseShare {
  game: 'mahjong';
  score: number;
  tilesLeft: number;
  hintsUsed: number;
  shufflesUsed: number;
}

// Each game only carries the fields it actually shares.
export type ResultShare = SudokuShare | WordleShare | MahjongShare;

// ---------- Formatting helpers ----------

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-10-09" → "Thu 9 Oct" (the date is a UTC calendar day). */
export function friendlyDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return `${DAYS[date.getUTCDay()]} ${d} ${MONTHS[m - 1]}`;
}

const thousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function header(icon: string, title: string, r: BaseShare, extra?: string): string[] {
  const sub = [r.dayLabel ? friendlyDate(r.dayLabel) : 'Free play', extra].filter(Boolean);
  return [`${icon} Puzzaro · ${r.dayLabel ? `Daily ${title}` : title}`, `📅 ${sub.join(' · ')}`];
}

function footer(r: BaseShare): string[] {
  const lines: string[] = [];
  if (r.dayLabel && r.streak && r.streak > 1) lines.push(`🔥 ${r.streak}-day streak`);
  lines.push(r.won ? 'Can you beat me? 🧩' : 'Think you can do better? 🧩');
  if (SHARE_URL) lines.push(SHARE_URL);
  return lines;
}

const card = (...sections: string[][]) =>
  sections
    .filter(s => s.length)
    .map(s => s.join('\n'))
    .join('\n\n');

// ---------- Per-game formatters ----------

function sudokuText(r: SudokuShare): string {
  const lost = Math.min(r.mistakes, r.maxMistakes);
  const hearts = '❤️'.repeat(r.maxMistakes - lost) + '🤍'.repeat(lost);
  const result = r.won
    ? [
        `✅ Solved in ${formatClock(r.timeMs)}`,
        `⭐ ${thousands(r.score)} pts · 💡 ${plural(r.hintsUsed, 'hint')}`,
        hearts,
      ]
    : [`❌ Out of hearts after ${formatClock(r.timeMs)}`, hearts];
  return card(header('🔢', 'Sudoku', r, capitalize(r.difficulty)), result, footer(r));
}

function wordleText(r: WordleShare): string {
  const last = r.wordleGuesses[r.wordleGuesses.length - 1];
  const solved = !!last && last.states.every(s => s === 'correct');
  const tries = solved ? r.wordleGuesses.length : 'X';
  const grid = r.wordleGuesses.map(g => g.states.map(s => SQUARES[s] ?? '⬛').join(''));
  return card(header('🔤', `${WORD_GAME_NAME} ${tries}/${r.maxGuesses}`, r), grid, footer(r));
}

function mahjongText(r: MahjongShare): string {
  const result = r.won
    ? [`✅ Board cleared in ${formatClock(r.timeMs)}`]
    : [`❌ Stuck with ${plural(r.tilesLeft, 'tile')} left`];
  result.push(
    `⭐ ${thousands(r.score)} pts · 💡 ${plural(r.hintsUsed, 'hint')} · 🔀 ${plural(r.shufflesUsed, 'shuffle')}`,
  );
  return card(header('🀄', 'Mahjong', r), result, footer(r));
}

// One formatter per game; adding a game adds an entry, nothing else changes.
const FORMATTERS: { [K in GameId]: (r: Extract<ResultShare, { game: K }>) => string } = {
  sudoku: sudokuText,
  wordle: wordleText,
  mahjong: mahjongText,
};

export function buildShareText(r: ResultShare): string {
  const format = FORMATTERS[r.game] as (r: ResultShare) => string;
  return format(r);
}

export async function shareResult(r: ResultShare): Promise<void> {
  try {
    let streak = r.streak;
    if (streak == null && r.dayLabel) {
      streak = computeStats(await getRecords(), r.game).currentStreak;
    }
    await Share.share({ message: buildShareText({ ...r, streak }) });
  } catch {
    // user dismissed
  }
}
