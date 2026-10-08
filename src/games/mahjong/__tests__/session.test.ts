import { findHint, generateMahjong } from '../engine';
import {
  createMahjongGame,
  MATCH_POINTS,
  restoreSnapshot,
  selectTile,
  shuffleRemaining,
  snapshotOf,
  takeHint,
} from '../session';

describe('mahjong generator', () => {
  it('never deadlocks across many seeds', () => {
    for (let seed = 1; seed <= 300; seed++) {
      expect(() => generateMahjong(seed)).not.toThrow();
    }
  });
});

describe('mahjong session', () => {
  const fresh = () => createMahjongGame({ kind: 'random' }, 0);

  it('selects, deselects and rejects a non-matching pair', () => {
    const s = fresh();
    const [a] = findHint(s.tiles, s.removed)!;
    expect(selectTile(s, null, a, 0)?.selectedId).toBe(a);
    expect(selectTile(s, a, a, 0)?.selectedId).toBeNull();

    const other = s.tiles.find(t => t.group !== s.tiles[a].group)!;
    const miss = selectTile(s, a, other.id, 0)!;
    expect(miss.matched).toBe(false);
    expect(miss.toast).toBe('No match');
  });

  it('removes a matching pair and scores it; undo brings it back', () => {
    const s = fresh();
    const [a, b] = findHint(s.tiles, s.removed)!;
    const res = selectTile(s, a, b, 0)!;
    expect(res.matched).toBe(true);
    expect(res.state.removed.has(a) && res.state.removed.has(b)).toBe(true);
    expect(res.state.score).toBe(MATCH_POINTS);
    expect(restoreSnapshot(res.state, snapshotOf(s)).removed.size).toBe(0);
  });

  it('hints and shuffles cost a charge each', () => {
    const s = fresh();
    const hint = takeHint(s);
    expect(hint && hint.ok && hint.state.hintsLeft).toBe(s.hintsLeft - 1);
    expect(shuffleRemaining(s)?.shufflesLeft).toBe(s.shufflesLeft - 1);
    expect(shuffleRemaining({ ...s, shufflesLeft: 0 })).toBeNull();
  });
});
