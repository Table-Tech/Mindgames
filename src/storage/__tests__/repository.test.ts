import { configureStorage, type KeyValueStore } from '../storage';
import { createGameRepository } from '../repository';

// In-memory store injected through the KeyValueStore seam.
function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: async k => data.get(k) ?? null,
    setItem: async (k, v) => void data.set(k, v),
    removeItem: async k => void data.delete(k),
    clear: async () => data.clear(),
  };
}

describe('createGameRepository', () => {
  const clock = { now: () => Date.UTC(2026, 9, 8) };

  it('keys daily games by date and practice games by a fixed key', async () => {
    const store = memoryStore();
    configureStorage(store);
    const repo = createGameRepository<{ n: number }>({
      dailyKey: d => `test.daily.${d}`,
      practiceKey: 'test.practice',
      clock,
    });
    await repo.save({ kind: 'daily' }, { n: 1 });
    await repo.save({ kind: 'random' }, { n: 2 });
    expect([...store.data.keys()].sort()).toEqual(['test.daily.2026-10-08', 'test.practice']);
    expect(await repo.load({ kind: 'daily' })).toEqual({ n: 1 });
    await repo.clear({ kind: 'daily' });
    expect(await repo.load({ kind: 'daily' })).toBeNull();
  });

  it('round-trips through serialize/deserialize', async () => {
    configureStorage(memoryStore());
    const repo = createGameRepository<{ ids: Set<number> }, { ids: number[] }>({
      dailyKey: d => d,
      practiceKey: 'p',
      serialize: s => ({ ids: [...s.ids] }),
      deserialize: s => ({ ids: new Set(s.ids) }),
    });
    await repo.save({ kind: 'random' }, { ids: new Set([3, 4]) });
    const loaded = await repo.load({ kind: 'random' });
    expect(loaded?.ids).toBeInstanceOf(Set);
    expect([...loaded!.ids]).toEqual([3, 4]);
  });
});
