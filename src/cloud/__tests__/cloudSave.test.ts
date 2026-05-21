import type { FinishRecord } from '@/stats/stats';
import { getJSON, setJSON } from '@/storage/storage';

jest.mock('../firebase', () => ({
  __esModule: true,
  pullCloudSave: jest.fn(),
  pushCloudSave: jest.fn(),
}));

import * as cloudSave from '../cloudSave';
import * as firebase from '../firebase';

function rec(over: Partial<FinishRecord>): FinishRecord {
  return {
    game: 'sudoku',
    mode: 'daily',
    outcome: 'won',
    timeMs: 60_000,
    date: '2026-05-15',
    ...over,
  };
}

describe('cloudSave.pullAndMerge', () => {
  beforeEach(async () => {
    (firebase.pullCloudSave as jest.Mock).mockReset();
    (firebase.pushCloudSave as jest.Mock).mockReset();
    await setJSON('stats.records.v1', []);
  });

  it('returns local records unchanged when cloud is empty', async () => {
    (firebase.pullCloudSave as jest.Mock).mockResolvedValue(null);
    await setJSON('stats.records.v1', [rec({ date: '2026-05-15' })]);

    const res = await cloudSave.pullAndMerge();
    expect(res?.merged).toHaveLength(1);
  });

  it('unions local and cloud records, dropping duplicates', async () => {
    const a = rec({ date: '2026-05-15', timeMs: 50_000 });
    const b = rec({ date: '2026-05-16', timeMs: 70_000 });
    const c = rec({ date: '2026-05-17', timeMs: 90_000 });
    await setJSON('stats.records.v1', [a, b]);
    (firebase.pullCloudSave as jest.Mock).mockResolvedValue({
      statsRecords: [b, c],
    });

    const res = await cloudSave.pullAndMerge();
    expect(res?.merged).toHaveLength(3);
    // Sorted newest-first; the duplicate `b` is folded.
    expect(res!.merged[0].date).toBe('2026-05-17');
    expect(res!.merged[res!.merged.length - 1].date).toBe('2026-05-15');

    const stored = (await getJSON<FinishRecord[]>('stats.records.v1')) ?? [];
    expect(stored).toHaveLength(3);
  });

  it('exposes the cloud-only player name + onboarding flags', async () => {
    (firebase.pullCloudSave as jest.Mock).mockResolvedValue({
      statsRecords: [],
      playerName: 'CloudUser',
      onboardingSeen: { sudoku: true },
    });
    const res = await cloudSave.pullAndMerge();
    expect(res?.cloudPlayerName).toBe('CloudUser');
    expect(res?.cloudOnboardingSeen).toEqual({ sudoku: true });
  });
});
