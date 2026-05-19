import { getJSON, setJSON } from '@/storage/storage';
import { submitLeaderboardScore } from '@/cloud/firebase';
import type { GameId } from '@/stats/stats';

export interface LeaderboardEntry {
  name: string;
  timeMs: number;
  date: string; // ISO yyyy-mm-dd
  game?: GameId;
}

const KEY = 'sudoku.daily.leaderboard.v1';
const MAX_ENTRIES = 50;

export async function loadLeaderboard(): Promise<LeaderboardEntry[]> {
  return (await getJSON<LeaderboardEntry[]>(KEY)) ?? [];
}

export async function submitScore(entry: LeaderboardEntry): Promise<LeaderboardEntry[]> {
  const list = await loadLeaderboard();
  list.push(entry);
  list.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1; // newest first
    return a.timeMs - b.timeMs; // fastest first within a date
  });
  const trimmed = list.slice(0, MAX_ENTRIES);
  await setJSON(KEY, trimmed);

  // Fire-and-forget cloud mirror; stub no-ops until Firebase is wired up.
  if (entry.game) {
    submitLeaderboardScore(entry.game, entry.date, {
      name: entry.name,
      timeMs: entry.timeMs,
    }).catch(() => {});
  }
  return trimmed;
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = d.getUTCDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}
