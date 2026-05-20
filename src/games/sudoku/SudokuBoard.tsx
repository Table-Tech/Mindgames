import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { Board } from './types';

export type NotesBoard = ReadonlyArray<ReadonlySet<number>>;

interface Props {
  board: Board;
  given: Board;
  notes: NotesBoard;
  selected: number | null;
  wrong: Set<number>;
  hidden?: boolean;
  onSelect: (index: number) => void;
}

export function SudokuBoard({ board, given, notes, selected, wrong, hidden, onSelect }: Props) {
  const { colors } = useTheme();
  const selectedVal = selected != null ? board[selected] : 0;
  const selRow = selected != null ? Math.floor(selected / 9) : -1;
  const selCol = selected != null ? selected % 9 : -1;
  const selBox = selected != null ? Math.floor(selRow / 3) * 3 + Math.floor(selCol / 3) : -1;

  return (
    <View style={[styles.board, { borderColor: colors.text }]}>
      {Array.from({ length: 9 }).map((_, r) => (
        <View key={r} style={styles.row}>
          {Array.from({ length: 9 }).map((__, c) => {
            const i = r * 9 + c;
            const val = board[i];
            const isGiven = given[i] !== 0;
            const isSelected = selected === i;
            const inPeer =
              !isSelected &&
              (r === selRow ||
                c === selCol ||
                Math.floor(r / 3) * 3 + Math.floor(c / 3) === selBox);
            const sameNumber = !isSelected && val !== 0 && val === selectedVal;
            const isWrong = wrong.has(i);

            let bg = colors.surface;
            if (isGiven) bg = colors.given;
            if (inPeer) bg = colors.highlight;
            if (sameNumber) bg = colors.sameNumber;
            if (isSelected) bg = colors.selection;

            const borderRight = (c + 1) % 3 === 0 && c !== 8 ? 2 : StyleSheet.hairlineWidth;
            const borderBottom = (r + 1) % 3 === 0 && r !== 8 ? 2 : StyleSheet.hairlineWidth;

            const cellNotes = notes[i];
            const showNotes = val === 0 && cellNotes.size > 0;

            return (
              <Pressable
                key={c}
                onPress={() => onSelect(i)}
                style={[
                  styles.cell,
                  {
                    backgroundColor: bg,
                    borderRightWidth: borderRight,
                    borderBottomWidth: borderBottom,
                    borderColor: colors.border,
                  },
                ]}
              >
                {hidden ? null : val !== 0 ? (
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: isGiven ? '700' : '500',
                      color: isWrong ? colors.error : isGiven ? colors.text : colors.accent,
                    }}
                  >
                    {val}
                  </Text>
                ) : showNotes ? (
                  <View style={styles.notesGrid}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                      <View key={n} style={styles.noteCell}>
                        <Text style={[styles.noteText, { color: colors.textMuted }]}>
                          {cellNotes.has(n) ? n : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    aspectRatio: 1,
    borderWidth: 2,
    alignSelf: 'stretch',
  },
  row: { flexDirection: 'row', flex: 1 },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  notesGrid: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  noteCell: {
    width: '33.33%',
    height: '33.33%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteText: {
    fontSize: 9,
    fontWeight: '500',
  },
});
