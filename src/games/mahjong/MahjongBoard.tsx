import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { freeTiles } from './engine';
import { GRID_H, GRID_W, MAX_Z } from './layout';
import { TileFace, tileName } from './TileFace';
import type { Tile } from './types';

const MIN_TILE_W = 24;
const MAX_TILE_W = 60;
const BORDER = 1.5;

interface Props {
  tiles: Tile[];
  removed: Set<number>;
  selectedId: number | null;
  hintIds: Set<number>;
  onSelect: (id: number) => void;
  /** Width available for the board; tiles scale to fill it. */
  maxWidth: number;
}

/** Tile metrics for a board that should fit in `maxWidth`. */
function metrics(maxWidth: number) {
  const tileW = Math.max(MIN_TILE_W, Math.min(MAX_TILE_W, Math.floor(maxWidth / GRID_W)));
  return {
    tileW,
    tileH: Math.round(tileW * 1.3),
    edge: Math.round(tileW * 0.12), // visible tile thickness under the face
    zx: tileW * 0.12, // each layer shifts right
    zy: -tileW * 0.15, // and up, giving a 3D look
  };
}

export function MahjongBoard({ tiles, removed, selectedId, hintIds, onSelect, maxWidth }: Props) {
  const { colors } = useTheme();
  const { tileW, tileH, edge, zx, zy } = metrics(maxWidth);

  const freeIds = useMemo(() => {
    const s = new Set<number>();
    for (const t of freeTiles(tiles, removed)) s.add(t.id);
    return s;
  }, [tiles, removed]);

  // Render lowest z first; within a layer, render top-left → bottom-right so
  // bottom-right tiles overlap their upper-left neighbours (the 3D illusion).
  const sorted = useMemo(
    () =>
      tiles
        .filter(t => !removed.has(t.id))
        .slice()
        .sort((a, b) => a.pos.z - b.pos.z || a.pos.y - b.pos.y || a.pos.x - b.pos.x),
    [tiles, removed],
  );

  // Upper layers sit inside the base footprint, so their right shift never
  // pokes past the base layer; only the upward shift needs extra room.
  const boardWidth = GRID_W * tileW;
  const boardHeight = GRID_H * tileH + MAX_Z * -zy + edge;
  const faceW = tileW - BORDER * 2;
  const faceH = tileH - BORDER * 2;

  return (
    <View style={[styles.board, { width: boardWidth, height: boardHeight }]}>
      {sorted.map(t => {
        const free = freeIds.has(t.id);
        const isSelected = selectedId === t.id;
        const isHint = hintIds.has(t.id);
        const left = t.pos.x * tileW + t.pos.z * zx;
        const top = t.pos.y * tileH + MAX_Z * -zy + t.pos.z * zy;
        const zIndex = t.pos.z * 100 + t.pos.y * 10 + t.pos.x;

        const face = isSelected ? colors.sunflower : isHint ? colors.accentMuted : colors.tileFace;

        return (
          <Pressable
            key={t.id}
            disabled={!free}
            onPress={() => onSelect(t.id)}
            accessibilityLabel={`${tileName(t.glyph)}${free ? '' : ', blocked'}`}
            style={[
              styles.tile,
              {
                left,
                top,
                width: tileW,
                height: tileH + edge,
                borderRadius: tileW * 0.2,
                borderBottomWidth: edge + BORDER,
                backgroundColor: face,
                borderColor: colors.ink,
                borderBottomColor: isSelected ? '#B8860B' : colors.tileEdge,
                zIndex,
              },
            ]}
          >
            <TileFace glyph={t.glyph} width={faceW} height={faceH} />
            {/* Blocked tiles get a soft shade so the playable ones pop. */}
            {!free && <View pointerEvents="none" style={styles.shade} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { position: 'relative', alignSelf: 'center' },
  tile: {
    position: 'absolute',
    borderWidth: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(29,26,51,0.16)' },
});
