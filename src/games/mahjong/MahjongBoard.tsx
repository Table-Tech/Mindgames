import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { freeTiles } from './engine';
import { GRID_H, GRID_W, MAX_Z } from './layout';
import type { Tile } from './types';

const TILE_W = 30;
const TILE_H = 38;
const Z_OFFSET_X = 4; // each layer shifts right
const Z_OFFSET_Y = -4; // and up, giving a 3D look

interface Props {
  tiles: Tile[];
  removed: Set<number>;
  selectedId: number | null;
  hintIds: Set<number>;
  onSelect: (id: number) => void;
}

export function MahjongBoard({ tiles, removed, selectedId, hintIds, onSelect }: Props) {
  const { colors, isDark } = useTheme();

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
  const boardHeight = GRID_H * TILE_H + (MAX_Z + 1) * Math.abs(Z_OFFSET_Y);

  return (
    <View style={[styles.board, { width: boardWidth, height: boardHeight }]}>
      {sorted.map(t => {
        const free = freeIds.has(t.id);
        const isSelected = selectedId === t.id;
        const isHint = hintIds.has(t.id);
        const left = t.pos.x * TILE_W + t.pos.z * Z_OFFSET_X;
        const top = t.pos.y * TILE_H + MAX_Z * -Z_OFFSET_Y + t.pos.z * Z_OFFSET_Y;
        const zIndex = t.pos.z * 100 + t.pos.y * 10 + t.pos.x;

        const baseBg = isDark ? '#1f232c' : '#fbf6e9';
        const lockedBg = isDark ? '#13161c' : '#e8e2d0';

        return (
          <Pressable
            key={t.id}
            disabled={!free}
            onPress={() => onSelect(t.id)}
            style={[
              styles.tile,
              {
                left,
                top,
                width: TILE_W,
                height: TILE_H,
                backgroundColor: isSelected ? colors.accent : free ? baseBg : lockedBg,
                borderColor: isHint ? colors.accent : colors.border,
                borderWidth: isHint ? 2 : StyleSheet.hairlineWidth,
                zIndex,
                opacity: free ? 1 : 0.85,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 20,
                color: isSelected ? '#fff' : free ? colors.text : colors.textMuted,
              }}
              allowFontScaling={false}
            >
              {t.glyph}
            </Text>
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
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
