import { computeStats, type FinishRecord } from '../stats';

function r(opts: Partial<FinishRecord>): FinishRecord {
  return {
    game: 'sudoku',
    mode: 'daily',
    outcome: 'won',
    timeMs: 60_000,
    date: '2026-05-15',
    ...opts,
  };
}

describe('computeStats', () => {
  it('returns empty stats for an empty record list', () => {
    const s = computeStats([], 'sudoku');
    expect(s.played).toBe(0);
    expect(s.won).toBe(0);
    expect(s.bestTimeMs).toBeNull();
    expect(s.avgTimeMs).toBeNull();
    expect(s.currentStreak).toBe(0);
    expect(s.bestStreak).toBe(0);
  });

  it('computes win rate and times from daily wins', () => {
    const records: FinishRecord[] = [
      r({ timeMs: 50_000, date: '2026-05-15' }),
      r({ timeMs: 70_000, date: '2026-05-16' }),
      r({ outcome: 'lost', timeMs: 0, date: '2026-05-17' }),
    ];
    const s = computeStats(records, 'sudoku');
    expect(s.played).toBe(3);
    expect(s.won).toBe(2);
    expect(s.bestTimeMs).toBe(50_000);
    expect(s.avgTimeMs).toBe(60_000);
  });

  it('best streak counts consecutive daily wins', () => {
    const records: FinishRecord[] = [
      r({ date: '2026-05-10' }),
      r({ date: '2026-05-11' }),
      r({ date: '2026-05-12' }),
      r({ date: '2026-05-14' }), // gap on the 13th
      r({ date: '2026-05-15' }),
    ];
    const s = computeStats(records, 'sudoku');
    expect(s.bestStreak).toBe(3);
  });

  it('ignores practice wins for streaks', () => {
    const records: FinishRecord[] = [
      r({ mode: 'random', date: '2026-05-15' }),
      r({ mode: 'random', date: '2026-05-16' }),
    ];
    const s = computeStats(records, 'sudoku');
    expect(s.bestStreak).toBe(0);
    expect(s.currentStreak).toBe(0);
  });
});
