import { getJSON, remove, setJSON } from '@/storage/storage';
import { todayISO } from '@/leaderboard/leaderboard';
import type { MahjongMode, MahjongState, Tile } from './types';

// Saved version uses an array for `removed` so it serialises to JSON.
interface Saved extends Omit<MahjongState, 'removed'> {
  removed: number[];
}

function key(mode: MahjongMode): string {
  return mode.kind === 'daily'
    ? `mahjong.state.daily.${todayISO()}`
    : 'mahjong.state.random';
}

export async function loadGame(mode: MahjongMode): Promise<MahjongState | null> {
  const raw = await getJSON<Saved>(key(mode));
  if (!raw) return null;
  return { ...raw, removed: new Set(raw.removed) };
}

export async function saveGame(mode: MahjongMode, state: MahjongState): Promise<void> {
  const saved: Saved = { ...state, removed: Array.from(state.removed) };
  await setJSON(key(mode), saved);
}

export async function clearGame(mode: MahjongMode): Promise<void> {
  await remove(key(mode));
}

// Tiles are deterministic given the seed, but we also persist them so we don't
// have to regenerate on resume (and so the player sees the exact same board).
export function tilesAreFresh(_tiles: Tile[]): boolean {
  return true;
}
