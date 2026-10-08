import { getJSON, remove, setJSON } from '@/storage/storage';
import { createEmitter } from '@/core/events';
import type { GameId } from '@/core/game';

export interface LeaderboardEntry {
  name: string;
  timeMs: number;
  date: string; // ISO yyyy-mm-dd
  game?: GameId;
}

const KEY = 'sudoku.daily.leaderboard.v1';

// The cloud layer subscribes to mirror scores remotely.
export const leaderboardScoreSubmitted = createEmitter<LeaderboardEntry>();
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

  leaderboardScoreSubmitted.emit(entry);
  return trimmed;
}

export async function clearLeaderboard(): Promise<void> {
  await remove(KEY);
}
