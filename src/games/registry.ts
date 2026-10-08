import type { GameId } from '@/core/game';
import type { GameRepository } from '@/storage/repository';
import { sudokuRepository } from './sudoku/persistence';
import { wordleRepository } from './wordle/persistence';
import { mahjongRepository } from './mahjong/persistence';

export interface DailyStatus {
  done: boolean;
  inProgress: boolean;
}

export interface GameProgress {
  daily: DailyStatus;
  hasPractice: boolean;
}

// Domain-level description of a game. Adding a game means adding an entry
// here (and one in the UI catalog) — nothing else iterates games by hand.
export interface GameDefinition {
  id: GameId;
  label: string;
  loadProgress(): Promise<GameProgress>;
}

function progressFrom<T extends { outcome: string }>(repo: GameRepository<T>) {
  return async (): Promise<GameProgress> => {
    const [daily, practice] = await Promise.all([
      repo.load({ kind: 'daily' }),
      repo.load({ kind: 'random' }),
    ]);
    return {
      daily: {
        done: !!daily && daily.outcome !== 'playing',
        inProgress: daily?.outcome === 'playing',
      },
      hasPractice: practice?.outcome === 'playing',
    };
  };
}

export const GAME_REGISTRY: GameDefinition[] = [
  { id: 'sudoku', label: 'Sudoku', loadProgress: progressFrom(sudokuRepository) },
  { id: 'wordle', label: 'Wordle', loadProgress: progressFrom(wordleRepository) },
  { id: 'mahjong', label: 'Mahjong', loadProgress: progressFrom(mahjongRepository) },
];
