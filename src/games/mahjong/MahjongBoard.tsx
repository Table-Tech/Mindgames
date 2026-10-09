import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { freeTiles } from './engine';
import { GRID_H, GRID_W, MAX_Z } from './layout';
import type { Tile } from './types';

const TILE_W = 32;
const TILE_H = 42;
const EDGE = 4; // visible tile thickness under the face
const TEXT_PRESENTATION = '\uFE0E';
const Z_OFFSET_X = 4; // each layer shifts right
const Z_OFFSET_Y = -5; // and up, giving a 3D look

interface Props {
  tiles: Tile[];
  removed: Set<number>;
  selectedId: number | null;
  hintIds: Set<number>;
  onSelect: (id: number) => void;
}

export function MahjongBoard({ tiles, removed, selectedId, hintIds, onSelect }: Props) {
  const { colors } = useTheme();

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

  const boardWidth = GRID_W * TILE_W + (MAX_Z + 1) * Math.abs(Z_OFFSET_X);
  const boardHeight = GRID_H * TILE_H + (MAX_Z + 1) * Math.abs(Z_OFFSET_Y) + EDGE;

  return (
    <View style={[styles.board, { width: boardWidth, height: boardHeight }]}>
      {sorted.map(t => {
        const free = freeIds.has(t.id);
        const isSelected = selectedId === t.id;
        const isHint = hintIds.has(t.id);
        const left = t.pos.x * TILE_W + t.pos.z * Z_OFFSET_X;
        const top = t.pos.y * TILE_H + MAX_Z * -Z_OFFSET_Y + t.pos.z * Z_OFFSET_Y;
        const zIndex = t.pos.z * 100 + t.pos.y * 10 + t.pos.x;

        const face = isSelected ? colors.sunflower : isHint ? colors.accentMuted : colors.tileFace;

        return (
          <Pressable
            key={t.id}
            disabled={!free}
            onPress={() => onSelect(t.id)}
            accessibilityLabel={`Tile ${t.glyph}${free ? '' : ', blocked'}`}
            style={[
              styles.tile,
              {
                left,
                top,
                width: TILE_W,
                height: TILE_H + EDGE,
                backgroundColor: face,
                borderColor: colors.ink,
                borderBottomColor: isSelected ? '#B8860B' : colors.tileEdge,
                zIndex,
              },
            ]}
          >
            <Text style={{ fontSize: 22, color: '#1D1A33' }} allowFontScaling={false}>
              {/* U+FE0E asks for the text glyph, not a color emoji (e.g. 🀄 on Android). */}
              {t.glyph + TEXT_PRESENTATION}
            </Text>
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
    borderRadius: 7,
    borderWidth: 1.5,
    borderBottomWidth: EDGE + 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(29,26,51,0.16)' },
});
