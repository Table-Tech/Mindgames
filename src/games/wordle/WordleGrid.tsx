import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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

export function WordleGrid({ guesses, current }: Props) {
  const { colors } = useTheme();
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
                    backgroundColor: t.bg,
                    borderColor: t.border,
                    borderBottomWidth: 2.5 + t.lift,
                  },
                ]}
              >
                <Text allowFontScaling={false} style={[styles.letter, { color: t.fg }]}>
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
  grid: { gap: 7, alignSelf: 'center' },
  row: { flexDirection: 'row', gap: 7 },
  tile: {
    width: 58,
    height: 58,
    borderWidth: 2.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { fontFamily: fonts.display, fontSize: 30 },
});
