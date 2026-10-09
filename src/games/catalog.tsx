import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { GameId } from '@/core/game';
import { capitalize } from '@/core/format';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/fonts';
import type { ThemeColors } from '@/theme/colors';
import { OUTLINE } from '@/ui/kit';
import type { RootStackParamList } from '@/navigation/types';
import type { Difficulty } from './sudoku/types';
import { WORD_GAME_NAME } from './wordle/name';

// Only the ability to navigate is needed, not the whole navigation object.
type Nav = Pick<NativeStackNavigationProp<RootStackParamList>, 'navigate'>;

export interface PracticeOptions {
  difficulty: Difficulty;
}

// UI-level description of a game: how it looks on the home/stats screens and
// how to open it. Screens iterate this list instead of naming games.
export interface GameCatalogEntry {
  id: GameId;
  label: string;
  /** The game's signature color in the theme. */
  colorKey: keyof Pick<ThemeColors, 'sudoku' | 'wordle' | 'mahjong'>;
  /** Text color that reads on the signature color. */
  onColor: string;
  DailyArt: React.ComponentType;
  PracticeIcon: React.ComponentType;
  practiceSubtitle(opts: PracticeOptions): string;
  openDaily(nav: Nav): void;
  openPractice(nav: Nav, opts: PracticeOptions): void;
}

const INK = '#1D1A33';

export const GAME_CATALOG: GameCatalogEntry[] = [
  {
    id: 'sudoku',
    label: 'Sudoku',
    colorKey: 'sudoku',
    onColor: '#FFFFFF',
    DailyArt: SudokuArt,
    PracticeIcon: () => <Ionicons name="grid" size={20} color="#FFFFFF" />,
    practiceSubtitle: ({ difficulty }) => capitalize(difficulty),
    openDaily: nav => nav.navigate('Sudoku', { mode: { kind: 'daily' } }),
    openPractice: (nav, { difficulty }) =>
      nav.navigate('Sudoku', { mode: { kind: 'random', difficulty } }),
  },
  {
    id: 'wordle',
    label: WORD_GAME_NAME,
    colorKey: 'wordle',
    onColor: INK,
    DailyArt: WordleArt,
    PracticeIcon: () => <Text style={styles.glyph}>W</Text>,
    practiceSubtitle: () => '5 letters',
    openDaily: nav => nav.navigate('Wordle', { mode: { kind: 'daily' } }),
    openPractice: nav => nav.navigate('Wordle', { mode: { kind: 'random' } }),
  },
  {
    id: 'mahjong',
    label: 'Mahjong',
    colorKey: 'mahjong',
    onColor: INK,
    DailyArt: MahjongArt,
    PracticeIcon: () => <Text style={[styles.glyph, styles.cjk]}>中</Text>,
    practiceSubtitle: () => '144 tiles',
    openDaily: nav => nav.navigate('Mahjong', { mode: { kind: 'daily' } }),
    openPractice: nav => nav.navigate('Mahjong', { mode: { kind: 'random' } }),
  },
];

// ---------- Card illustrations ----------

function SudokuArt() {
  const cells = ['5', '', '7', '', '3', '1', '9', '', '4'];
  return (
    <View style={[styles.sudokuArt, { transform: [{ rotate: '6deg' }] }]}>
      {cells.map((c, i) => (
        <View
          key={i}
          style={[styles.sudokuArtCell, { backgroundColor: i === 4 ? '#FFD84D' : '#FFFFFF' }]}
        >
          <Text style={styles.sudokuArtText}>{c}</Text>
        </View>
      ))}
    </View>
  );
}

function WordleArt() {
  const { colors } = useTheme();
  const top = [colors.wordleAbsent, colors.wordleCorrect, colors.wordleCorrect, '#B9B4D0'];
  return (
    <View style={{ gap: 4, transform: [{ rotate: '-5deg' }] }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {top.map((c, i) => (
          <View key={i} style={[styles.wordleArtTile, { backgroundColor: c }]} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={[styles.wordleArtTile, { backgroundColor: '#FFFFFF' }]} />
        ))}
      </View>
    </View>
  );
}

function MahjongArt() {
  const tile = (glyph: string, color: string, style: object) => (
    <View style={[styles.mjArtTile, style]}>
      <Text style={{ fontSize: 22, fontWeight: '700', color }}>{glyph}</Text>
    </View>
  );
  return (
    <View style={{ width: 96, height: 88 }}>
      {tile('中', '#C81E45', { left: 0, top: 14, transform: [{ rotate: '-10deg' }] })}
      {tile('發', '#127A50', { left: 50, top: 6, transform: [{ rotate: '8deg' }] })}
      {tile('東', INK, { left: 26, top: 24 })}
    </View>
  );
}

const styles = StyleSheet.create({
  glyph: { fontFamily: fonts.display, fontSize: 20, color: INK },
  cjk: { fontFamily: undefined, fontWeight: '700' },
  sudokuArt: {
    width: 92,
    height: 92,
    padding: 4,
    gap: 3,
    backgroundColor: INK,
    borderRadius: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sudokuArtCell: {
    width: 26.6,
    height: 26.6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sudokuArtText: { fontFamily: fonts.displaySemi, fontSize: 17, color: INK },
  wordleArtTile: { width: 24, height: 24, borderRadius: 6, borderWidth: OUTLINE, borderColor: INK },
  mjArtTile: {
    position: 'absolute',
    width: 42,
    height: 56,
    borderRadius: 9,
    borderWidth: OUTLINE,
    borderBottomWidth: OUTLINE + 4,
    borderColor: INK,
    backgroundColor: '#FFFDF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
