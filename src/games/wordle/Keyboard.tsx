import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import type { LetterState } from './types';

const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['ENTER', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'BACK'],
];

interface Props {
  letterStates: Record<string, LetterState>;
  onKey: (k: string) => void;
  disabled?: boolean;
}

export function Keyboard({ letterStates, onKey, disabled }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.keyboard}>
      {ROWS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map(k => {
            const wide = k === 'ENTER' || k === 'BACK';
            const state = letterStates[k];
            let bg = colors.surfaceAlt;
            let fg = colors.text;
            if (state === 'correct') {
              bg = '#4caf6f';
              fg = '#fff';
            } else if (state === 'present') {
              bg = '#d9a93a';
              fg = '#fff';
            } else if (state === 'absent') {
              bg = '#787c7e';
              fg = '#fff';
            }

            return (
              <Pressable
                key={k}
                onPress={() => !disabled && onKey(k)}
                style={[
                  styles.key,
                  wide && styles.wideKey,
                  { backgroundColor: bg, opacity: disabled ? 0.5 : 1 },
                ]}
              >
                {k === 'BACK' ? (
                  <Ionicons name="backspace-outline" size={20} color={fg} />
                ) : k === 'ENTER' ? (
                  <Text style={[styles.keyText, { color: fg, fontSize: 12 }]}>ENTER</Text>
                ) : (
                  <Text style={[styles.keyText, { color: fg }]}>{k.toUpperCase()}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: { gap: 6, alignSelf: 'stretch' },
  row: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  key: {
    flex: 1,
    height: 48,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  wideKey: { flex: 1.5 },
  keyText: { fontSize: 16, fontWeight: '700' },
});
