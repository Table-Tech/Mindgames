import { findHint, generateMahjong, isStuck } from '../engine';
import type { MahjongState, Tile } from '../types';
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

  // Two separate towers of three; the two tops match, and once they are gone
  // the two free tiles (groups 0 and 1) don't: out of moves.
  const tower = (id: number, x: number, z: number, group: number): Tile => ({
    id,
    pos: { x, y: 0, z },
    group,
    glyph: String(group),
  });
  const nearlyStuck = (shufflesLeft: number): MahjongState => ({
    ...fresh(),
    tiles: [
      tower(0, 0, 0, 0),
      tower(1, 0, 1, 1),
      tower(2, 0, 2, 2),
      tower(3, 4, 0, 1),
      tower(4, 4, 1, 0),
      tower(5, 4, 2, 2),
    ],
    removed: new Set(),
    shufflesLeft,
  });

  it('keeps playing when out of moves but shuffles are left', () => {
    const res = selectTile(nearlyStuck(1), 2, 5, 0)!;
    expect(isStuck(res.state.tiles, res.state.removed)).toBe(true);
    expect(res.state.outcome).toBe('playing');
    expect(res.state.finishedAt).toBeNull();
    expect(res.cues).not.toContain('lose');
    expect(res.toast).toBe('No moves left. Shuffle!');

    const shuffled = shuffleRemaining(res.state)!;
    expect(findHint(shuffled.tiles, shuffled.removed)).not.toBeNull();
  });

  it('ends the game when out of moves and shuffles', () => {
    const res = selectTile(nearlyStuck(0), 2, 5, 7)!;
    expect(res.state.outcome).toBe('stuck');
    expect(res.state.finishedAt).toBe(7);
    expect(res.cues).toContain('lose');
    expect(res.toast).toBeUndefined();
  });
});
