import type { Position } from './types';

// Five-layer pyramid totaling 144 positions.
//   Layer 0: 10 x 8 = 80
//   Layer 1: 6 x 6  = 36 (centered)
//   Layer 2: 4 x 4  = 16
//   Layer 3: 2 x 4  = 8
//   Layer 4: 2 x 2  = 4
// Coordinates use the same (x, y) grid across layers so "tile on top" is the
// position at (x, y, z+1).

interface Rect {
  x0: number;
  y0: number;
  w: number;
  h: number;
  z: number;
}

const LAYERS: Rect[] = [
  { z: 0, x0: 0, y0: 0, w: 10, h: 8 },
  { z: 1, x0: 2, y0: 1, w: 6, h: 6 },
  { z: 2, x0: 3, y0: 2, w: 4, h: 4 },
  { z: 3, x0: 4, y0: 2, w: 2, h: 4 },
  { z: 4, x0: 4, y0: 3, w: 2, h: 2 },
];

export const POSITIONS: Position[] = (() => {
  const out: Position[] = [];
  for (const L of LAYERS) {
    for (let dy = 0; dy < L.h; dy++) {
      for (let dx = 0; dx < L.w; dx++) {
        out.push({ x: L.x0 + dx, y: L.y0 + dy, z: L.z });
      }
    }
  }
  return out;
})();

if (POSITIONS.length !== 144) {
  throw new Error(`Layout must have 144 positions, got ${POSITIONS.length}`);
}

export const GRID_W = 10;
export const GRID_H = 8;
export const MAX_Z = 4;

export function posKey(p: Position): string {
  return `${p.x},${p.y},${p.z}`;
}
