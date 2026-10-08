import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/fonts';
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

const BOX_GAP = 4;
const CELL_GAP = 1.5;
const RADIUS = 16;

// The board is drawn as nine 3x3 boxes sitting in an ink frame, so the thick
// box separators are just the gaps between boxes.
export function SudokuBoard({ board, given, notes, selected, wrong, hidden, onSelect }: Props) {
  const { colors } = useTheme();
  const selectedVal = selected != null ? board[selected] : 0;
  const selRow = selected != null ? Math.floor(selected / 9) : -1;
  const selCol = selected != null ? selected % 9 : -1;
  const selBox = selected != null ? Math.floor(selRow / 3) * 3 + Math.floor(selCol / 3) : -1;

  const renderCell = (r: number, c: number) => {
    const i = r * 9 + c;
    const val = board[i];
    const isGiven = given[i] !== 0;
    const isSelected = selected === i;
    const inPeer =
      !isSelected &&
      (r === selRow || c === selCol || Math.floor(r / 3) * 3 + Math.floor(c / 3) === selBox);
    const sameNumber = !isSelected && val !== 0 && val === selectedVal;
    const isWrong = wrong.has(i);

    let bg = colors.given;
    if (inPeer) bg = colors.highlight;
    if (sameNumber) bg = colors.sameNumber;
    if (isWrong) bg = colors.wrongCell;
    if (isSelected) bg = colors.selection;

    const cellNotes = notes[i];
    const showNotes = val === 0 && cellNotes.size > 0;

    return (
      <Pressable
        key={c}
        onPress={() => onSelect(i)}
        accessibilityLabel={`Row ${r + 1} column ${c + 1}, ${val || 'empty'}`}
        style={[styles.cell, { backgroundColor: bg }]}
      >
        {hidden ? null : val !== 0 ? (
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: isGiven ? fonts.display : fonts.displaySemi,
              fontSize: 22,
              color: isWrong ? colors.error : isGiven ? colors.text : colors.accent,
            }}
          >
            {val}
          </Text>
        ) : showNotes ? (
          <View style={styles.notesGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <View key={n} style={styles.noteCell}>
                <Text
                  allowFontScaling={false}
                  style={[styles.noteText, { color: colors.textMuted }]}
                >
                  {cellNotes.has(n) ? n : ''}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <View style={[styles.board, { backgroundColor: colors.ink }]}>
      {[0, 1, 2].map(br => (
        <View key={br} style={styles.band}>
          {[0, 1, 2].map(bc => {
            const corner = {
              borderTopLeftRadius: br === 0 && bc === 0 ? RADIUS - 5 : 0,
              borderTopRightRadius: br === 0 && bc === 2 ? RADIUS - 5 : 0,
              borderBottomLeftRadius: br === 2 && bc === 0 ? RADIUS - 5 : 0,
              borderBottomRightRadius: br === 2 && bc === 2 ? RADIUS - 5 : 0,
            };
            return (
              <View key={bc} style={[styles.box, corner, { backgroundColor: colors.gridLine }]}>
                {[0, 1, 2].map(k => (
                  <View key={k} style={styles.boxRow}>
                    {[0, 1, 2].map(m => renderCell(br * 3 + k, bc * 3 + m))}
                  </View>
                ))}
              </View>
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
    alignSelf: 'stretch',
    padding: BOX_GAP,
    paddingBottom: BOX_GAP + 4,
    gap: BOX_GAP,
    borderRadius: RADIUS,
  },
  band: { flex: 1, flexDirection: 'row', gap: BOX_GAP },
  box: { flex: 1, gap: CELL_GAP, overflow: 'hidden' },
  boxRow: { flex: 1, flexDirection: 'row', gap: CELL_GAP },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notesGrid: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 1,
  },
  noteCell: {
    width: '33.33%',
    height: '33.33%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteText: { fontFamily: fonts.bodyHeavy, fontSize: 9 },
});
