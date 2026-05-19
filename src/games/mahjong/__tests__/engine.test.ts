import { freeTiles, generateMahjong, isStuck } from '../engine';

describe('Mahjong generator', () => {
  it('produces 144 tiles for the pyramid layout', () => {
    const tiles = generateMahjong(12345);
    expect(tiles).toHaveLength(144);
  });

  it('every tile has a valid group id (0..35)', () => {
    const tiles = generateMahjong(7);
    for (const t of tiles) {
      expect(t.group).toBeGreaterThanOrEqual(0);
      expect(t.group).toBeLessThan(36);
    }
  });

  it('initial board has at least 2 free tiles', () => {
    const tiles = generateMahjong(1);
    const free = freeTiles(tiles, new Set());
    expect(free.length).toBeGreaterThanOrEqual(2);
  });

  it('a freshly-generated board is not stuck', () => {
    const tiles = generateMahjong(99);
    expect(isStuck(tiles, new Set())).toBe(false);
  });

  it('the same seed produces the same tile assignment', () => {
    const a = generateMahjong(2024);
    const b = generateMahjong(2024);
    for (let i = 0; i < 144; i++) {
      expect(a[i].group).toBe(b[i].group);
      expect(a[i].glyph).toBe(b[i].glyph);
    }
  });
});
