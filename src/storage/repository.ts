import { getJSON, remove, setJSON } from './storage';
import { systemClock, todayISO, type Clock } from '@/core/date';
import type { PlayMode } from '@/core/game';

// One contract for saving and resuming any game, so screens and the home
// status don't care how a particular game stores itself.
export interface GameRepository<TState> {
  load(mode: PlayMode): Promise<TState | null>;
  save(mode: PlayMode, state: TState): Promise<void>;
  clear(mode: PlayMode): Promise<void>;
}

interface RepositoryOptions<TState, TSaved> {
  /** Storage key for the daily game on a given ISO date. */
  dailyKey: (isoDate: string) => string;
  /** Storage key for the practice game. */
  practiceKey: string;
  /** Convert to a JSON-safe shape (e.g. Set → array). Defaults to identity. */
  serialize?: (state: TState) => TSaved;
  deserialize?: (saved: TSaved) => TState;
  clock?: Clock;
}

export function createGameRepository<TState, TSaved = TState>({
  dailyKey,
  practiceKey,
  serialize = s => s as unknown as TSaved,
  deserialize = s => s as unknown as TState,
  clock = systemClock,
}: RepositoryOptions<TState, TSaved>): GameRepository<TState> {
  const key = (mode: PlayMode) => (mode.kind === 'daily' ? dailyKey(todayISO(clock)) : practiceKey);
  return {
    async load(mode) {
      const saved = await getJSON<TSaved>(key(mode));
      return saved == null ? null : deserialize(saved);
    },
    async save(mode, state) {
      await setJSON(key(mode), serialize(state));
    },
    async clear(mode) {
      await remove(key(mode));
    },
  };
}
