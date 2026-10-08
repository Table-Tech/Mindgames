import { createGameRepository } from '@/storage/repository';
import type { WordleState } from './types';

// WordleState is JSON-safe already (no Sets, no Dates).
export const wordleRepository = createGameRepository<WordleState>({
  dailyKey: date => `wordle.state.daily.${date}`,
  practiceKey: 'wordle.state.random',
});
