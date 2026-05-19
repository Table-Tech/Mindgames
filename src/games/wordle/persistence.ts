import { getJSON, remove, setJSON } from '@/storage/storage';
import type { WordleMode, WordleState } from './types';
import { todayISO } from '@/leaderboard/leaderboard';

function key(mode: WordleMode): string {
  return mode.kind === 'daily'
    ? `wordle.state.daily.${todayISO()}`
    : 'wordle.state.random';
}

// Serialization: WordleState is JSON-safe already (no Sets, no Dates).
export async function loadGame(mode: WordleMode): Promise<WordleState | null> {
  return getJSON<WordleState>(key(mode));
}

export async function saveGame(mode: WordleMode, state: WordleState): Promise<void> {
  await setJSON(key(mode), state);
}

export async function clearGame(mode: WordleMode): Promise<void> {
  await remove(key(mode));
}
