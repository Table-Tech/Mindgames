import { createGameRepository } from '@/storage/repository';
import type { MahjongState } from './types';

// Saved version uses an array for `removed` so it serialises to JSON.
// Tiles are persisted too so a resumed game shows the exact same board.
interface Saved extends Omit<MahjongState, 'removed'> {
  removed: number[];
}

export const mahjongRepository = createGameRepository<MahjongState, Saved>({
  dailyKey: date => `mahjong.state.daily.${date}`,
  practiceKey: 'mahjong.state.random',
  serialize: state => ({ ...state, removed: Array.from(state.removed) }),
  deserialize: saved => ({ ...saved, removed: new Set(saved.removed) }),
});
