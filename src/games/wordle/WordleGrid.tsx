import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
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
      letters: current.padEnd(WORD_LENGTH, ' ').split(''),
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
            const bg = colorFor(row.states[ci], colors);
            const border = row.states[ci] === 'pending' && filled ? colors.text : colors.border;
            const fg =
              row.states[ci] === 'empty' || row.states[ci] === 'pending' ? colors.text : '#fff';
            return (
              <View key={ci} style={[styles.tile, { backgroundColor: bg, borderColor: border }]}>
                <Text style={[styles.letter, { color: fg }]}>{ch.trim()}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function colorFor(state: LetterState, colors: ReturnType<typeof useTheme>['colors']) {
  switch (state) {
    case 'correct':
      return '#4caf6f';
    case 'present':
      return '#d9a93a';
    case 'absent':
      return '#787c7e';
    case 'pending':
      return colors.surface;
    case 'empty':
    default:
      return colors.surface;
  }
}

const styles = StyleSheet.create({
  grid: { gap: 6, alignSelf: 'center' },
  row: { flexDirection: 'row', gap: 6 },
  tile: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { fontSize: 28, fontWeight: '800' },
});
