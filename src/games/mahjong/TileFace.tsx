import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Draws a tile face in classic colours instead of relying on the Unicode
// mahjong glyphs, which every system font renders monochrome and tiny.
// Faces are keyed by the stored glyph so saved games keep working.

const RED = '#D7263D';
const GREEN = '#17955A';
const BLUE = '#2F5BD3';
const INK = '#1D1A33';
const FLOWER = '#C2378F';
const SEASON = '#E07A12';

type Mark = [x: number, y: number, color: string];

const NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const WINDS = ['東', '南', '西', '北'];
const FLOWERS = ['梅', '蘭', '竹', '菊'];
const SEASONS = ['春', '夏', '秋', '冬'];

// Dot layouts in a 0..1 face box, plus the dot diameter as a fraction of width.
const DOTS: { size: number; marks: Mark[] }[] = [
  { size: 0.72, marks: [[0.5, 0.5, GREEN]] },
  {
    size: 0.42,
    marks: [
      [0.5, 0.27, GREEN],
      [0.5, 0.73, BLUE],
    ],
  },
  {
    size: 0.36,
    marks: [
      [0.26, 0.2, BLUE],
      [0.5, 0.5, RED],
      [0.74, 0.8, GREEN],
    ],
  },
  { size: 0.38, marks: grid([0.28, 0.72], [0.27, 0.73], [BLUE, GREEN, GREEN, BLUE]) },
  {
    size: 0.32,
    marks: [...grid([0.25, 0.75], [0.2, 0.8], [BLUE, GREEN, GREEN, BLUE]), [0.5, 0.5, RED]],
  },
  { size: 0.32, marks: grid([0.28, 0.72], [0.18, 0.5, 0.82], [GREEN, GREEN, RED, RED, RED, RED]) },
  {
    size: 0.27,
    marks: [
      [0.22, 0.13, GREEN],
      [0.5, 0.26, GREEN],
      [0.78, 0.39, GREEN],
      ...grid([0.3, 0.7], [0.63, 0.87], [RED, RED, RED, RED]),
    ],
  },
  { size: 0.28, marks: grid([0.3, 0.7], [0.13, 0.38, 0.62, 0.87], Array(8).fill(BLUE)) },
  {
    size: 0.28,
    marks: grid(
      [0.2, 0.5, 0.8],
      [0.18, 0.5, 0.82],
      [BLUE, BLUE, BLUE, RED, RED, RED, GREEN, GREEN, GREEN],
    ),
  },
];

// Bamboo layouts: stick centres plus the stick height as a fraction of height.
const BAMBOO: { height: number; marks: Mark[] }[] = [
  { height: 0.72, marks: [[0.5, 0.5, BLUE]] },
  {
    height: 0.36,
    marks: [
      [0.5, 0.27, GREEN],
      [0.5, 0.73, BLUE],
    ],
  },
  {
    height: 0.36,
    marks: [
      [0.5, 0.27, GREEN],
      [0.3, 0.73, GREEN],
      [0.7, 0.73, GREEN],
    ],
  },
  { height: 0.36, marks: grid([0.3, 0.7], [0.27, 0.73], [GREEN, BLUE, BLUE, GREEN]) },
  {
    height: 0.36,
    marks: [...grid([0.22, 0.78], [0.27, 0.73], [GREEN, BLUE, BLUE, GREEN]), [0.5, 0.5, RED]],
  },
  {
    height: 0.36,
    marks: grid([0.2, 0.5, 0.8], [0.27, 0.73], [GREEN, GREEN, GREEN, BLUE, BLUE, BLUE]),
  },
  {
    height: 0.25,
    marks: [[0.5, 0.16, RED], ...grid([0.2, 0.5, 0.8], [0.5, 0.83], Array(6).fill(GREEN))],
  },
  { height: 0.36, marks: grid([0.14, 0.38, 0.62, 0.86], [0.27, 0.73], Array(8).fill(GREEN)) },
  {
    height: 0.26,
    marks: grid(
      [0.2, 0.5, 0.8],
      [0.18, 0.5, 0.82],
      [GREEN, RED, GREEN, GREEN, RED, GREEN, GREEN, RED, GREEN],
    ),
  },
];

function grid(xs: number[], ys: number[], colors: string[]): Mark[] {
  const out: Mark[] = [];
  ys.forEach((y, r) => xs.forEach((x, c) => out.push([x, y, colors[r * xs.length + c]])));
  return out;
}

/** Human-readable tile name for accessibility labels. */
export function tileName(glyph: string): string {
  const i = (glyph.codePointAt(0) ?? 0) - 0x1f000;
  if (i >= 0x07 && i <= 0x0f) return `${i - 0x06} Characters`;
  if (i >= 0x10 && i <= 0x18) return `${i - 0x0f} Bamboo`;
  if (i >= 0x19 && i <= 0x21) return `${i - 0x18} Dots`;
  if (i >= 0x00 && i <= 0x03) return `${['East', 'South', 'West', 'North'][i]} Wind`;
  if (i >= 0x04 && i <= 0x06) return `${['Red', 'Green', 'White'][i - 0x04]} Dragon`;
  if (i >= 0x22 && i <= 0x25) return `Flower ${i - 0x21}`;
  if (i >= 0x26 && i <= 0x29) return `Season ${i - 0x25}`;
  return glyph;
}

interface Props {
  glyph: string;
  /** Inner face size in points. */
  width: number;
  height: number;
}

export const TileFace = memo(function TileFace({ glyph, width: w, height: h }: Props) {
  const i = (glyph.codePointAt(0) ?? 0) - 0x1f000;

  const char = (text: string, color: string, size: number) => (
    <Text
      allowFontScaling={false}
      style={[styles.char, { color, fontSize: size, lineHeight: size * 1.15 }]}
    >
      {text}
    </Text>
  );

  if (i >= 0x07 && i <= 0x0f) {
    return (
      <View style={styles.center}>
        {char(NUMERALS[i - 0x07], INK, w * 0.42)}
        {char('萬', RED, w * 0.5)}
      </View>
    );
  }

  if (i >= 0x19 && i <= 0x21) {
    const { size, marks } = DOTS[i - 0x19];
    const d = w * size;
    return (
      <View style={{ width: w, height: h }}>
        {marks.map(([x, y, color], k) => (
          <View
            key={k}
            style={[
              styles.dot,
              {
                left: x * w - d / 2,
                top: y * h - d / 2,
                width: d,
                height: d,
                borderRadius: d / 2,
                borderWidth: Math.max(1.5, d * 0.17),
                borderColor: color,
              },
            ]}
          >
            <View
              style={{
                width: d * 0.32,
                height: d * 0.32,
                borderRadius: d,
                backgroundColor: i === 0x19 ? RED : color,
              }}
            />
          </View>
        ))}
      </View>
    );
  }

  if (i >= 0x10 && i <= 0x18) {
    const { height, marks } = BAMBOO[i - 0x10];
    const sw = w * (i === 0x10 ? 0.24 : i === 0x17 ? 0.13 : 0.15);
    const sh = h * height;
    return (
      <View style={{ width: w, height: h }}>
        {marks.map(([x, y, color], k) => (
          <View
            key={k}
            style={[
              styles.stick,
              {
                left: x * w - sw / 2,
                top: y * h - sh / 2,
                width: sw,
                height: sh,
                borderRadius: sw / 2,
                backgroundColor: color,
              },
            ]}
          >
            {/* The bamboo "node" across the middle of each stick. */}
            <View style={[styles.node, { height: Math.max(1, sh * 0.08) }]} />
          </View>
        ))}
      </View>
    );
  }

  if (i >= 0x00 && i <= 0x03)
    return <View style={styles.center}>{char(WINDS[i], INK, w * 0.7)}</View>;
  if (i === 0x04) return <View style={styles.center}>{char('中', RED, w * 0.72)}</View>;
  if (i === 0x05) return <View style={styles.center}>{char('發', GREEN, w * 0.72)}</View>;
  if (i === 0x06) {
    return (
      <View
        style={{
          width: w * 0.62,
          height: h * 0.66,
          borderWidth: Math.max(2, w * 0.08),
          borderColor: BLUE,
          borderRadius: w * 0.08,
        }}
      />
    );
  }

  const flower = i >= 0x22 && i <= 0x25;
  const season = i >= 0x26 && i <= 0x29;
  if (flower || season) {
    const n = flower ? i - 0x22 : i - 0x26;
    const color = flower ? FLOWER : SEASON;
    return (
      <View style={[styles.center, { width: w, height: h }]}>
        <Text allowFontScaling={false} style={[styles.corner, { color, fontSize: w * 0.26 }]}>
          {n + 1}
        </Text>
        {char((flower ? FLOWERS : SEASONS)[n], color, w * 0.62)}
      </View>
    );
  }

  return char(glyph, INK, w * 0.6);
});

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  char: { fontWeight: '700', textAlign: 'center', includeFontPadding: false },
  dot: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  stick: { position: 'absolute', justifyContent: 'center', overflow: 'hidden' },
  node: { backgroundColor: 'rgba(255,255,255,0.75)' },
  corner: { position: 'absolute', top: 0, left: 2, fontWeight: '800' },
});
