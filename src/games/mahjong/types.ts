export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Tile {
  id: number;          // unique 0..143
  pos: Position;
  group: number;       // match-group id (0..35)
  glyph: string;       // unicode mahjong character
}

export type MahjongMode =
  | { kind: 'random' }
  | { kind: 'daily' };

export interface MahjongState {
  tiles: Tile[];                  // all tiles
  removed: Set<number>;           // tile ids removed
  startedAt: number;
  finishedAt: number | null;
  outcome: 'playing' | 'won' | 'stuck';
  hintsLeft: number;
  shufflesLeft: number;
  score: number;
}
