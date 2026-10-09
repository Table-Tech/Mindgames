import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/fonts';
import type { ThemeColors } from '@/theme/colors';
import type { Guess, LetterState } from './types';
import { MAX_GUESSES, WORD_LENGTH } from './types';

interface Props {
  guesses: Guess[];
  current: string;
  shakeRow?: boolean;
}

const GAP = 7;

// Fits six rows in roughly half the screen height so the keyboard always fits,
// including on small phones like the iPhone SE.
function useTileSize() {
  const { width, height } = useWindowDimensions();
  const byWidth = (width - 32 - GAP * (WORD_LENGTH - 1)) / WORD_LENGTH;
  const byHeight = (height * 0.46 - GAP * (MAX_GUESSES - 1)) / MAX_GUESSES;
  return Math.round(Math.max(38, Math.min(62, byWidth, byHeight)));
}

export function WordleGrid({ guesses, current }: Props) {
  const { colors } = useTheme();
  const size = useTileSize();
  const rows: { letters: string[]; states: LetterState[] }[] = [];

  for (const g of guesses) {
    rows.push({ letters: g.word.toUpperCase().split(''), states: g.states });
  }
  if (rows.length < MAX_GUESSES) {
    rows.push({
      letters: current.toUpperCase().padEnd(WORD_LENGTH, ' ').split(''),
      states: new Array(WORD_LENGTH).fill('pending'),
    });
  }
  while (rows.length < MAX_GUESSES) {
    rows.push({
      letters: new Array(WORD_LENGTH).fill(' '),
      states: new Array(WORD_LENGTH).fill('empty'),
    });
  }

  return (
    <View style={styles.grid}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.letters.map((ch, ci) => {
            const filled = ch.trim().length > 0;
            const t = tileStyle(row.states[ci], filled, colors);
            return (
              <View
                key={ci}
                style={[
                  styles.tile,
                  {
                    width: size,
                    height: size,
                    backgroundColor: t.bg,
                    borderColor: t.border,
                    borderBottomWidth: 2.5 + t.lift,
                  },
                ]}
              >
                <Text
                  allowFontScaling={false}
                  style={[styles.letter, { color: t.fg, fontSize: Math.round(size * 0.52) }]}
                >
                  {ch.trim()}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function letterColors(state: LetterState | undefined, colors: ThemeColors) {
  switch (state) {
    case 'correct':
      return { bg: colors.wordleCorrect, fg: '#FFFFFF' };
    case 'present':
      return { bg: colors.wordlePresent, fg: '#1D1A33' };
    case 'absent':
      return { bg: colors.wordleAbsent, fg: colors.text };
    default:
      return null;
  }
}

function tileStyle(state: LetterState, filled: boolean, colors: ThemeColors) {
  const scored = letterColors(state, colors);
  if (scored) return { ...scored, border: colors.ink, lift: 3 };
  if (state === 'pending' && filled)
    return { bg: colors.surface, fg: colors.text, border: colors.ink, lift: 2 };
  return { bg: colors.surface, fg: colors.text, border: colors.gridLine, lift: 0 };
}

const styles = StyleSheet.create({
  grid: { gap: GAP, alignSelf: 'center' },
  row: { flexDirection: 'row', gap: GAP },
  tile: {
    borderWidth: 2.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { fontFamily: fonts.display },
});
