import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/fonts';
import { Chunky } from '@/ui/kit';
import { DIFFICULTIES, Difficulty } from './types';

const LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
  master: 'Master',
  extreme: 'Extreme',
};

interface Props {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
}

export function DifficultyPicker({ value, onChange }: Props) {
  const { colors } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {DIFFICULTIES.map(d => {
        const active = d === value;
        return (
          <Chunky
            key={d}
            onPress={() => onChange(d)}
            selected={active}
            depth={3}
            radius={999}
            color={active ? colors.ink : colors.surface}
            contentStyle={styles.chip}
          >
            <Text
              style={{
                fontFamily: fonts.bodyHeavy,
                fontSize: 14,
                color: active ? colors.onInk : colors.text,
              }}
            >
              {LABELS[d]}
            </Text>
          </Chunky>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chip: { height: 36, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
});
