import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/fonts';
import { Chunky } from '@/ui/kit';
import { letterColors } from './WordleGrid';
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
    <View style={[styles.keyboard, { opacity: disabled ? 0.5 : 1 }]}>
      {ROWS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map(k => {
            const wide = k === 'ENTER' || k === 'BACK';
            const scored = letterColors(letterStates[k], colors);
            let bg = scored?.bg ?? colors.surface;
            let fg = scored?.fg ?? colors.text;
            if (k === 'ENTER') {
              bg = colors.ink;
              fg = colors.onInk;
            }
            return (
              <Chunky
                key={k}
                onPress={() => !disabled && onKey(k)}
                accessibilityLabel={k === 'BACK' ? 'Delete' : k === 'ENTER' ? 'Enter' : k}
                depth={3}
                radius={10}
                color={bg}
                style={{ flex: wide ? 1.6 : 1, minWidth: 0 }}
                contentStyle={styles.key}
              >
                {k === 'BACK' ? (
                  <Ionicons name="backspace-outline" size={22} color={fg} />
                ) : (
                  <Text
                    allowFontScaling={false}
                    style={[styles.keyText, { color: fg, fontSize: k === 'ENTER' ? 13 : 20 }]}
                  >
                    {k.toUpperCase()}
                  </Text>
                )}
              </Chunky>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: { gap: 7, alignSelf: 'stretch' },
  row: { flexDirection: 'row', justifyContent: 'center', gap: 5 },
  key: { height: 52, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontFamily: fonts.displaySemi },
});
