import React from 'react';
import { StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '@/theme/fonts';
import { lightTheme as C } from '@/theme/colors';
import { formatClock } from '@/core/format';
import { WORD_GAME_NAME } from '@/games/wordle/name';
import { friendlyDate, SHARE_URL, type ResultShare } from './share';

// The shareable result image (design: "Puzzaro Share Cards", 1080 × 1350).
// Laid out at CARD_WIDTH logical px and captured at 1080 px wide, so every
// measurement from the design is multiplied by `u`. Always uses the light
// palette: shared images should look the same for everyone.

export const CARD_WIDTH = 540;
export const CARD_HEIGHT = CARD_WIDTH * (1350 / 1080);
const S = CARD_WIDTH / 1080;
const u = (n: number) => n * S;

const INK = C.ink;
const MUTED = C.textMuted;
const thousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

interface Props {
  result: ResultShare;
}

export function ShareCard({ result: r }: Props) {
  const hero = heroFor(r);
  return (
    <View style={styles.card} collapsable={false}>
      <View
        style={[styles.blob, { right: u(-120), top: u(380), transform: [{ rotate: '18deg' }] }]}
      />
      <View
        style={[
          styles.blob,
          {
            left: u(-150),
            bottom: u(120),
            width: u(300),
            height: u(300),
            transform: [{ rotate: '-14deg' }],
          },
        ]}
      />

      <View style={styles.header}>
        <View style={styles.brand}>
          <Logo />
          <Text style={styles.wordmark}>Puzzaro</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: '#FFFFFF' }]}>
          <Text style={styles.pillText}>{r.dayLabel ? friendlyDate(r.dayLabel) : 'Free play'}</Text>
        </View>
      </View>

      <View style={[styles.hero, { backgroundColor: hero.color }]}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1, gap: u(14) }}>
            <Text style={[styles.eyebrow, { color: hero.fg }]}>{hero.eyebrow}</Text>
            <Text style={[styles.title, { color: hero.fg }]}>{hero.title}</Text>
          </View>
          {hero.art}
        </View>
        {hero.panel}
        {hero.stats && (
          <View style={styles.stats}>
            {hero.stats.map(s => (
              <View
                key={s.label}
                style={[styles.statTile, s.highlight && { backgroundColor: C.sunflower }]}
              >
                <Text style={[styles.statLabel, s.highlight && { color: INK }]}>{s.label}</Text>
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                  {s.value}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={{ flex: 1, gap: u(18) }}>
          {r.won && r.dayLabel && r.streak && r.streak > 1 ? (
            <View style={[styles.chip, { backgroundColor: C.pink }]}>
              <Ionicons name="flame" size={u(34)} color={INK} />
              <Text style={styles.chipText}>{r.streak}-day streak</Text>
            </View>
          ) : !r.won ? (
            <View style={[styles.chip, { backgroundColor: '#FFFFFF' }]}>
              <Ionicons name="refresh" size={u(32)} color={INK} />
              <Text style={styles.chipText}>New puzzle tomorrow</Text>
            </View>
          ) : null}
          <Text style={styles.cta}>{r.won ? 'Can you beat me?' : 'Think you can do better?'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: u(6) }}>
          <Text style={styles.footSmall}>Play today's puzzles</Text>
          <Text style={styles.footBig}>{SHARE_URL ? 'Get Puzzaro' : 'Search “Puzzaro”'}</Text>
        </View>
      </View>
    </View>
  );
}

// ---------- Per-game content ----------

interface Hero {
  color: string;
  fg: string;
  eyebrow: string;
  title: string;
  art: React.ReactNode;
  panel: React.ReactNode;
  stats?: { label: string; value: string; highlight?: boolean }[];
}

function heroFor(r: ResultShare): Hero {
  const daily = r.dayLabel ? 'Daily ' : '';
  switch (r.game) {
    case 'sudoku': {
      const level = r.difficulty[0].toUpperCase() + r.difficulty.slice(1);
      return {
        color: r.won ? C.sudoku : C.pink,
        fg: r.won ? '#FFFFFF' : INK,
        eyebrow: `${daily}Sudoku · ${level}`,
        title: r.won ? 'Solved\nit!' : 'So\nclose!',
        art: <SudokuArt />,
        panel: (
          <TimePanel timeMs={r.timeMs} label={r.won ? 'Time' : 'Played for'}>
            <View style={{ alignItems: 'flex-end', gap: u(12) }}>
              <Text style={styles.statLabel}>Lives left</Text>
              <View style={{ flexDirection: 'row', gap: u(8) }}>
                {Array.from({ length: r.maxMistakes }).map((_, i) => (
                  <Heart key={i} full={i < r.maxMistakes - r.mistakes} />
                ))}
              </View>
            </View>
          </TimePanel>
        ),
        stats: [
          { label: 'Score', value: thousands(r.score) },
          { label: 'Hints', value: String(r.hintsUsed) },
          { label: 'Level', value: level, highlight: true },
        ],
      };
    }
    case 'mahjong':
      return {
        color: r.won ? C.mahjong : C.pink,
        fg: INK,
        eyebrow: `${daily}Mahjong`,
        title: r.won ? 'Board\ncleared!' : 'So\nclose!',
        art: <MahjongArt won={r.won} />,
        panel: r.won ? (
          <TimePanel timeMs={r.timeMs} label="Time">
            <View style={styles.trophy}>
              <Ionicons name="trophy-outline" size={u(64)} color={INK} />
            </View>
          </TimePanel>
        ) : (
          <View style={[styles.panel, { gap: u(36) }]}>
            <Text style={styles.bigNumber}>{r.tilesLeft}</Text>
            <View style={{ flex: 1, gap: u(6) }}>
              <Text style={styles.panelHeadline}>tiles left on the board</Text>
              <Text style={styles.panelSub}>Ran out of moves after {formatClock(r.timeMs)}</Text>
            </View>
          </View>
        ),
        stats: [
          { label: 'Score', value: thousands(r.score) },
          { label: 'Hints', value: String(r.hintsUsed) },
          { label: 'Shuffles', value: String(r.shufflesUsed) },
        ],
      };
    case 'wordle': {
      const tries = r.wordleGuesses.length;
      return {
        color: r.won ? C.wordle : C.pink,
        fg: INK,
        eyebrow: `${daily}${WORD_GAME_NAME}`,
        title: r.won ? `Got it in ${tries}!` : 'So close!',
        art: (
          <View style={styles.timeChip}>
            <Text style={styles.timeChipLabel}>Time</Text>
            <Text style={styles.timeChipValue}>{formatClock(r.timeMs)}</Text>
          </View>
        ),
        panel: <WordGrid guesses={r.wordleGuesses.map(g => g.states)} />,
      };
    }
  }
}

function TimePanel({
  timeMs,
  label,
  children,
}: {
  timeMs: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.panel, { justifyContent: 'space-between' }]}>
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.bigNumber}>{formatClock(timeMs)}</Text>
      </View>
      {children}
    </View>
  );
}

const SQUARE: Record<string, string> = {
  correct: C.wordleCorrect,
  present: C.wordlePresent,
  absent: C.wordleAbsent,
};

function WordGrid({ guesses }: { guesses: string[][] }) {
  // Six rows don't fit at full size; shrink the squares for long games.
  const size = guesses.length > 4 ? u(70) : u(92);
  return (
    <View style={[styles.panel, styles.gridPanel]}>
      {guesses.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: u(12) }}>
          {row.map((s, ci) => (
            <View
              key={ci}
              style={[
                styles.gridSq,
                { width: size, height: size, backgroundColor: SQUARE[s] ?? '#FFFFFF' },
              ]}
            />
          ))}
        </View>
      ))}
      <View style={styles.legend}>
        {[
          ['Right spot', C.wordleCorrect],
          ['In the word', C.wordlePresent],
          ['Not in it', C.wordleAbsent],
        ].map(([label, color]) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendSq, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------- Illustrations ----------

function Heart({ full }: { full: boolean }) {
  return (
    <View style={{ width: u(66), height: u(66) }}>
      <Ionicons name="heart" size={u(66)} color={full ? C.pink : '#FFFFFF'} style={styles.abs} />
      <Ionicons name="heart-outline" size={u(66)} color={INK} style={styles.abs} />
    </View>
  );
}

function Logo() {
  return (
    <View style={styles.logo}>
      {[C.sudoku, C.wordle, C.mahjong, C.pink].map(c => (
        <View key={c} style={[styles.logoSq, { backgroundColor: c }]} />
      ))}
    </View>
  );
}

function SudokuArt() {
  const cells = ['5', '3', '7', '6', '9', '1', '8', '2', '4'];
  const entered = new Set([1, 3, 7]);
  return (
    <View style={styles.sudokuArt}>
      {cells.map((n, i) => (
        <View key={i} style={[styles.sudokuCell, i === 4 && { backgroundColor: C.sunflower }]}>
          <Text style={[styles.sudokuDigit, entered.has(i) && { color: C.sudoku }]}>{n}</Text>
        </View>
      ))}
    </View>
  );
}

function MahjongArt({ won }: { won: boolean }) {
  const tiles: { glyph: string; color: string; style: ViewStyle; face?: string }[] = won
    ? [
        {
          glyph: '中',
          color: '#C81E45',
          style: { left: 0, top: u(40), transform: [{ rotate: '-12deg' }] },
        },
        {
          glyph: '發',
          color: '#127A50',
          style: { left: u(132), top: u(14), transform: [{ rotate: '10deg' }] },
        },
        { glyph: '東', color: INK, style: { left: u(66), top: u(70) }, face: C.sunflower },
      ]
    : [
        {
          glyph: '北',
          color: INK,
          style: { left: u(20), top: u(50), transform: [{ rotate: '-16deg' }] },
        },
        {
          glyph: '西',
          color: INK,
          style: { left: u(118), top: u(30), transform: [{ rotate: '14deg' }] },
        },
      ];
  return (
    <View style={{ width: u(250), height: u(230) }}>
      {tiles.map(t => (
        <View
          key={t.glyph}
          style={[styles.mjTile, t.style, t.face ? { backgroundColor: t.face } : null]}
        >
          <Text style={[styles.mjGlyph, { color: t.color }]}>{t.glyph}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------- Styles ----------

const label: TextStyle = {
  fontFamily: fonts.bodyHeavy,
  fontSize: u(22),
  letterSpacing: u(2),
  textTransform: 'uppercase',
  color: MUTED,
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    padding: u(72),
    gap: u(44),
    backgroundColor: C.background,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: u(340),
    height: u(340),
    borderRadius: u(72),
    backgroundColor: '#E6E0FF',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: u(22) },
  logo: {
    width: u(76),
    height: u(76),
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: u(7),
    transform: [{ rotate: '-8deg' }],
  },
  logoSq: {
    width: u(34.5),
    height: u(34.5),
    borderWidth: u(4),
    borderBottomWidth: u(8),
    borderColor: INK,
    borderRadius: u(11),
  },
  wordmark: { fontFamily: fonts.display, fontSize: u(64), color: INK, letterSpacing: u(-1) },
  pill: {
    borderWidth: u(4),
    borderBottomWidth: u(9),
    borderColor: INK,
    borderRadius: 999,
    paddingVertical: u(12),
    paddingHorizontal: u(30),
  },
  pillText: { fontFamily: fonts.bodyHeavy, fontSize: u(32), color: INK },
  hero: {
    borderWidth: u(6),
    borderBottomWidth: u(20),
    borderColor: INK,
    borderRadius: u(56),
    paddingTop: u(48),
    paddingHorizontal: u(56),
    paddingBottom: u(52),
    gap: u(36),
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: u(24) },
  eyebrow: {
    fontFamily: fonts.bodyHeavy,
    fontSize: u(30),
    letterSpacing: u(4),
    textTransform: 'uppercase',
  },
  title: { fontFamily: fonts.display, fontSize: u(104), lineHeight: u(100) },
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: u(5),
    borderBottomWidth: u(14),
    borderColor: INK,
    borderRadius: u(40),
    paddingVertical: u(30),
    paddingHorizontal: u(40),
  },
  bigNumber: { fontFamily: fonts.display, fontSize: u(150), lineHeight: u(160), color: INK },
  panelHeadline: { fontFamily: fonts.display, fontSize: u(48), lineHeight: u(52), color: INK },
  panelSub: { fontFamily: fonts.bodyHeavy, fontSize: u(28), color: MUTED },
  trophy: {
    width: u(120),
    height: u(120),
    borderRadius: u(36),
    borderWidth: u(5),
    borderColor: INK,
    backgroundColor: C.wordle,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  abs: { position: 'absolute', left: 0, top: 0 },
  stats: { flexDirection: 'row', gap: u(22) },
  statTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: u(5),
    borderColor: INK,
    borderRadius: u(32),
    paddingVertical: u(20),
    paddingHorizontal: u(26),
  },
  statLabel: label,
  statValue: { fontFamily: fonts.display, fontSize: u(64), color: INK },
  timeChip: {
    backgroundColor: INK,
    borderRadius: u(30),
    paddingVertical: u(18),
    paddingHorizontal: u(26),
    alignItems: 'center',
    transform: [{ rotate: '4deg' }],
  },
  timeChipLabel: { ...label, fontSize: u(20), color: C.gridLine },
  timeChipValue: { fontFamily: fonts.display, fontSize: u(56), color: '#FFFFFF' },
  gridPanel: { flexDirection: 'column', gap: u(12), paddingVertical: u(34) },
  gridSq: {
    borderWidth: u(5),
    borderBottomWidth: u(12),
    borderColor: INK,
    borderRadius: u(22),
  },
  legend: { flexDirection: 'row', gap: u(28), marginTop: u(10) },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: u(10) },
  legendSq: {
    width: u(26),
    height: u(26),
    borderWidth: u(3),
    borderColor: INK,
    borderRadius: u(7),
  },
  legendText: { fontFamily: fonts.bodyHeavy, fontSize: u(24), color: MUTED },
  sudokuArt: {
    width: u(232),
    height: u(232),
    padding: u(10),
    gap: u(8),
    backgroundColor: INK,
    borderRadius: u(34),
    flexDirection: 'row',
    flexWrap: 'wrap',
    transform: [{ rotate: '7deg' }],
  },
  sudokuCell: {
    width: u(65),
    height: u(65),
    borderRadius: u(14),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sudokuDigit: { fontFamily: fonts.display, fontSize: u(46), color: INK },
  mjTile: {
    position: 'absolute',
    width: u(112),
    height: u(148),
    backgroundColor: C.tileFace,
    borderWidth: u(5),
    borderBottomWidth: u(18),
    borderColor: INK,
    borderRadius: u(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  mjGlyph: { fontSize: u(68), fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'flex-end', gap: u(32) },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: u(12),
    borderWidth: u(4),
    borderBottomWidth: u(10),
    borderColor: INK,
    borderRadius: 999,
    paddingVertical: u(12),
    paddingLeft: u(20),
    paddingRight: u(28),
  },
  chipText: { fontFamily: fonts.bodyHeavy, fontSize: u(32), color: INK },
  cta: { fontFamily: fonts.display, fontSize: u(54), lineHeight: u(58), color: INK },
  footSmall: { fontFamily: fonts.body, fontSize: u(26), color: MUTED },
  footBig: { fontFamily: fonts.bodyHeavy, fontSize: u(30), color: INK },
});
