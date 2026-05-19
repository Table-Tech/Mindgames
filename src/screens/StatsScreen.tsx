import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import {
  computeStats,
  computeSudokuByDifficulty,
  formatTime,
  getRecords,
  winRate,
  type DifficultyStats,
  type FinishRecord,
  type GameId,
  type GameStats,
} from '@/stats/stats';

const GAMES: { id: GameId; label: string }[] = [
  { id: 'sudoku', label: 'Sudoku' },
  { id: 'wordle', label: 'Wordle' },
  { id: 'mahjong', label: 'Mahjong' },
];

export function StatsScreen() {
  const { colors } = useTheme();
  const [records, setRecords] = useState<FinishRecord[] | null>(null);

  useEffect(() => {
    getRecords().then(setRecords);
  }, []);

  if (records === null) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.text }]}>Statistics</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>
          Stored on this device only
        </Text>

        {GAMES.map(g => (
          <GameCard
            key={g.id}
            game={g.id}
            label={g.label}
            stats={computeStats(records, g.id)}
            sudokuByDifficulty={g.id === 'sudoku' ? computeSudokuByDifficulty(records) : undefined}
          />
        ))}

        {records.length === 0 && (
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            No games finished yet. Play a daily or practice round to start tracking.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function GameCard({
  game,
  label,
  stats,
  sudokuByDifficulty,
}: {
  game: GameId;
  label: string;
  stats: GameStats;
  sudokuByDifficulty?: DifficultyStats[];
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>{label}</Text>
      <View style={styles.grid}>
        <StatBox label="Played" value={`${stats.played}`} />
        <StatBox label="Win rate" value={`${winRate(stats)}%`} />
        <StatBox label="Best time" value={formatTime(stats.bestTimeMs)} />
        <StatBox label="Avg time" value={formatTime(stats.avgTimeMs)} />
        <StatBox label="Current streak" value={`${stats.currentStreak}`} accent />
        <StatBox label="Best streak" value={`${stats.bestStreak}`} />
      </View>

      {game === 'wordle' && stats.avgGuesses != null && (
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.subHeading, { color: colors.textMuted }]}>
            Guess distribution · avg {stats.avgGuesses}
          </Text>
          <GuessHistogram histogram={stats.guessHistogram} />
        </View>
      )}

      {sudokuByDifficulty && sudokuByDifficulty.some(d => d.played > 0) && (
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.subHeading, { color: colors.textMuted }]}>By difficulty</Text>
          <View style={styles.diffTable}>
            <View style={[styles.diffRow, styles.diffHeader]}>
              <Text style={[styles.diffCell, { color: colors.textMuted, flex: 1.4 }]}>Level</Text>
              <Text style={[styles.diffCell, { color: colors.textMuted }]}>Wins</Text>
              <Text style={[styles.diffCell, { color: colors.textMuted }]}>Best</Text>
              <Text style={[styles.diffCell, { color: colors.textMuted }]}>Avg</Text>
            </View>
            {sudokuByDifficulty.map(d => (
              <View key={d.difficulty} style={styles.diffRow}>
                <Text style={[styles.diffCell, { color: colors.text, flex: 1.4 }]}>
                  {d.difficulty[0].toUpperCase() + d.difficulty.slice(1)}
                </Text>
                <Text style={[styles.diffCell, { color: colors.text }]}>
                  {d.won}/{d.played}
                </Text>
                <Text style={[styles.diffCell, { color: colors.text }]}>
                  {formatTime(d.bestTimeMs)}
                </Text>
                <Text style={[styles.diffCell, { color: colors.text }]}>
                  {formatTime(d.avgTimeMs)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function StatBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.box}>
      <Text style={[styles.boxLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text
        style={[
          styles.boxValue,
          { color: accent ? colors.accent : colors.text },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function GuessHistogram({ histogram }: { histogram: number[] }) {
  const { colors } = useTheme();
  const max = Math.max(1, ...histogram);
  return (
    <View style={{ gap: 4, marginTop: 6 }}>
      {histogram.map((count, i) => (
        <View key={i} style={styles.histRow}>
          <Text style={[styles.histLabel, { color: colors.textMuted }]}>{i + 1}</Text>
          <View style={[styles.histBarBg, { backgroundColor: colors.surfaceAlt }]}>
            <View
              style={[
                styles.histBar,
                {
                  width: `${(count / max) * 100}%`,
                  backgroundColor: colors.accent,
                },
              ]}
            />
          </View>
          <Text style={[styles.histCount, { color: colors.text }]}>{count}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 12 },
  title: { fontSize: 28, fontWeight: '800' },
  sub: { fontSize: 13, marginBottom: 8 },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  cardTitle: { fontSize: 20, fontWeight: '700' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  box: { width: '30%' },
  boxLabel: { fontSize: 11, marginBottom: 2 },
  boxValue: { fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
  subHeading: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  histLabel: { width: 12, fontSize: 12, fontWeight: '600' },
  histBarBg: { flex: 1, height: 16, borderRadius: 4, overflow: 'hidden' },
  histBar: { height: '100%' },
  histCount: { width: 28, textAlign: 'right', fontSize: 12, fontVariant: ['tabular-nums'] },
  empty: { textAlign: 'center', marginTop: 24, paddingHorizontal: 24 },
  diffTable: { marginTop: 6 },
  diffRow: { flexDirection: 'row', paddingVertical: 4 },
  diffHeader: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#888', marginBottom: 2 },
  diffCell: { flex: 1, fontSize: 12, fontVariant: ['tabular-nums'] },
});
