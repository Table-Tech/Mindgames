import { mulberry32, seedFromString, shuffle } from '@/games/sudoku/prng';
import { POSITIONS, posKey } from './layout';
import { TILE_GROUPS } from './tiles';
import type { Position, Tile } from './types';

// A tile is free if (a) nothing sits directly on top of it and (b) it has at
// least one empty side (left or right) on its own layer.
export function isFree(tile: Tile, remaining: Set<number>, byKey: Map<string, Tile>): boolean {
  const above = byKey.get(posKey({ x: tile.pos.x, y: tile.pos.y, z: tile.pos.z + 1 }));
  if (above && remaining.has(above.id)) return false;

  const left  = byKey.get(posKey({ x: tile.pos.x - 1, y: tile.pos.y, z: tile.pos.z }));
  const right = byKey.get(posKey({ x: tile.pos.x + 1, y: tile.pos.y, z: tile.pos.z }));
  const leftBlocked  = !!(left  && remaining.has(left.id));
  const rightBlocked = !!(right && remaining.has(right.id));
  return !(leftBlocked && rightBlocked);
}

export function freeTiles(tiles: Tile[], removed: Set<number>): Tile[] {
  const byKey = new Map<string, Tile>();
  for (const t of tiles) byKey.set(posKey(t.pos), t);
  const remaining = new Set<number>();
  for (const t of tiles) if (!removed.has(t.id)) remaining.add(t.id);
  return tiles.filter(t => remaining.has(t.id) && isFree(t, remaining, byKey));
}

// Returns a pair of free tile-ids that match (same group), or null if stuck.
export function findHint(tiles: Tile[], removed: Set<number>): [number, number] | null {
  const free = freeTiles(tiles, removed);
  const byGroup = new Map<number, Tile[]>();
  for (const t of free) {
    const list = byGroup.get(t.group) ?? [];
    list.push(t);
    byGroup.set(t.group, list);
  }
  for (const list of byGroup.values()) {
    if (list.length >= 2) return [list[0].id, list[1].id];
  }
  return null;
}

export function isStuck(tiles: Tile[], removed: Set<number>): boolean {
  return findHint(tiles, removed) === null;
}

// Reverse-build: simulate a valid removal sequence, then assign tile groups
// to the removal pairs so the player has a guaranteed solution path.
export function generateMahjong(seed: number): Tile[] {
  const rand = mulberry32(seed || 1);

  // Phase 1: pick removal order (144 / 2 = 72 pairs) using the same
  // free-tile rules the player will use.
  const remaining = new Set<number>();
  const positionsById = new Map<number, Position>();
  POSITIONS.forEach((p, i) => {
    remaining.add(i);
    positionsById.set(i, p);
  });
  const byKey = new Map<string, { id: number; pos: Position }>();
  positionsById.forEach((p, id) => byKey.set(posKey(p), { id, pos: p }));

  const isPosFree = (id: number): boolean => {
    const p = positionsById.get(id)!;
    const above = byKey.get(posKey({ x: p.x, y: p.y, z: p.z + 1 }));
    if (above && remaining.has(above.id)) return false;
    const left  = byKey.get(posKey({ x: p.x - 1, y: p.y, z: p.z }));
    const right = byKey.get(posKey({ x: p.x + 1, y: p.y, z: p.z }));
    const lb = !!(left  && remaining.has(left.id));
    const rb = !!(right && remaining.has(right.id));
    return !(lb && rb);
  };

  const pairs: [number, number][] = [];
  while (remaining.size > 0) {
    const free: number[] = [];
    for (const id of remaining) if (isPosFree(id)) free.push(id);
    if (free.length < 2) {
      // Should not happen with the pyramid layout.
      throw new Error('Mahjong generator: layout deadlock during reverse build');
    }
    const i1 = Math.floor(rand() * free.length);
    const p1 = free[i1];
    free.splice(i1, 1);
    const i2 = Math.floor(rand() * free.length);
    const p2 = free[i2];
    pairs.push([p1, p2]);
    remaining.delete(p1);
    remaining.delete(p2);
  }

  // Phase 2: assign tile groups. Each group has 4 glyphs and is mapped onto
  // 2 consecutive pairs in the removal order.
  const groups = shuffle(TILE_GROUPS, rand);
  const tiles: Tile[] = new Array(144);
  let pairIdx = 0;
  for (const group of groups) {
    const a = pairs[pairIdx++];
    const b = pairs[pairIdx++];
    const slots: [number, number, number, number] = [a[0], a[1], b[0], b[1]];
    for (let i = 0; i < 4; i++) {
      const id = slots[i];
      tiles[id] = {
        id,
        pos: positionsById.get(id)!,
        group: group.id,
        glyph: group.glyphs[i],
      };
    }
  }
  return tiles;
}

// Re-assign group/glyphs to the remaining tiles in a way that is guaranteed
// solvable. Uses the same reverse-build trick as generateMahjong but on the
// sub-layout that's still on the board.
export function solvableShuffle(tiles: Tile[], removed: Set<number>, seed?: number): Tile[] {
  const rand = mulberry32(seed ?? ((Math.random() * 0xffffffff) >>> 0) || 1);
  const remainingTiles = tiles.filter(t => !removed.has(t.id));
  if (remainingTiles.length === 0) return tiles.slice();

  // If odd count, we can't pair perfectly. (Shouldn't happen mid-game but
  // bail safely.)
  if (remainingTiles.length % 2 !== 0) return tiles.slice();

  // Reverse-build a removal sequence over just these tile positions.
  const positionsById = new Map<number, { x: number; y: number; z: number }>();
  remainingTiles.forEach(t => positionsById.set(t.id, t.pos));
  const remainingSet = new Set<number>(remainingTiles.map(t => t.id));
  const byKey = new Map<string, { id: number; pos: { x: number; y: number; z: number } }>();
  remainingTiles.forEach(t => byKey.set(posKey(t.pos), { id: t.id, pos: t.pos }));

  const isPosFree = (id: number): boolean => {
    const p = positionsById.get(id)!;
    const above = byKey.get(posKey({ x: p.x, y: p.y, z: p.z + 1 }));
    if (above && remainingSet.has(above.id)) return false;
    const left  = byKey.get(posKey({ x: p.x - 1, y: p.y, z: p.z }));
    const right = byKey.get(posKey({ x: p.x + 1, y: p.y, z: p.z }));
    const lb = !!(left  && remainingSet.has(left.id));
    const rb = !!(right && remainingSet.has(right.id));
    return !(lb && rb);
  };

  const pairs: [number, number][] = [];
  while (remainingSet.size > 0) {
    const free: number[] = [];
    for (const id of remainingSet) if (isPosFree(id)) free.push(id);
    if (free.length < 2) {
      // Should not happen on a layout that came from generateMahjong, but if
      // the player has somehow reached a configuration with <2 free positions
      // we just return tiles unchanged.
      return tiles.slice();
    }
    const i1 = Math.floor(rand() * free.length);
    const a = free[i1];
    free.splice(i1, 1);
    const i2 = Math.floor(rand() * free.length);
    const b = free[i2];
    pairs.push([a, b]);
    remainingSet.delete(a);
    remainingSet.delete(b);
  }

  // Re-use the existing glyph/group multiset from the remaining tiles.
  // Each match-group still has 4 tiles in the multiset (unless one was already
  // removed); we just shuffle which positions get which group.
  const pool: { group: number; glyph: string }[] = [];
  for (const t of remainingTiles) pool.push({ group: t.group, glyph: t.glyph });
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  // Group pool by group-id so pairs in the reverse-build sequence get
  // matching groups assigned.
  const groupBuckets = new Map<number, { group: number; glyph: string }[]>();
  for (const item of pool) {
    const list = groupBuckets.get(item.group) ?? [];
    list.push(item);
    groupBuckets.set(item.group, list);
  }

  // Walk pairs and assign from buckets in pair-friendly fashion: prefer the
  // bucket with the most remaining items so we never run out of pairings.
  const next = tiles.slice();
  const takenFromBucket = (g: number) => {
    const list = groupBuckets.get(g)!;
    return list.pop()!;
  };
  for (const [pa, pb] of pairs) {
    // Pick the largest bucket with at least 2 items.
    let pickGroup = -1;
    let pickCount = -1;
    for (const [g, list] of groupBuckets) {
      if (list.length >= 2 && list.length > pickCount) {
        pickGroup = g;
        pickCount = list.length;
      }
    }
    if (pickGroup === -1) {
      // Fallback: pair across whatever's left (shouldn't matter for solvability
      // because the player's own match rule is group-equality, but this branch
      // is unreachable when counts are even per group).
      return tiles.slice();
    }
    const a = takenFromBucket(pickGroup);
    const b = takenFromBucket(pickGroup);
    next[pa] = { ...next[pa], group: a.group, glyph: a.glyph };
    next[pb] = { ...next[pb], group: b.group, glyph: b.glyph };
  }
  return next;
}

export function dailySeed(date = new Date()): number {
  const y = date.getUTCFullYear();
  const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = date.getUTCDate().toString().padStart(2, '0');
  return seedFromString(`mahjong-${y}-${m}-${d}`);
}

export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0 || 1;
}
