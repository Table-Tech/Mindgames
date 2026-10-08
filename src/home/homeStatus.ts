import type { GameId } from '@/core/game';
import { computeStats, getRecords } from '@/stats/stats';
import { GAME_REGISTRY, type DailyStatus } from '@/games/registry';

export type { DailyStatus } from '@/games/registry';

export interface ResumeInfo {
  hasPractice: boolean;
}

export interface GameHomeStatus {
  daily: DailyStatus;
  resume: ResumeInfo;
  streak: number;
}

export type HomeStatus = Record<GameId, GameHomeStatus>;

// What the home screen needs per game: today's daily state, whether a
// practice game can be resumed, and the current daily streak.
export async function loadHomeStatus(): Promise<HomeStatus> {
  const records = await getRecords();
  const entries = await Promise.all(
    GAME_REGISTRY.map(async game => {
      const progress = await game.loadProgress();
      const status: GameHomeStatus = {
        daily: progress.daily,
        resume: { hasPractice: progress.hasPractice },
        streak: computeStats(records, game.id).currentStreak,
      };
      return [game.id, status] as const;
    }),
  );
  return Object.fromEntries(entries) as HomeStatus;
}
