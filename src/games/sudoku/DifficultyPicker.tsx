import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
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
      <Text style={[styles.label, { color: colors.textMuted }]}>Difficulty:</Text>
      {DIFFICULTIES.map(d => {
        const active = d === value;
        return (
          <Pressable key={d} onPress={() => onChange(d)} hitSlop={6}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: active ? '800' : '500',
                color: active ? colors.accent : colors.textMuted,
              }}
            >
              {LABELS[d]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 4 },
  label: { fontSize: 14, marginRight: 4 },
});
