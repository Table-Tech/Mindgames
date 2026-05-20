import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { loadLeaderboard, todayISO, LeaderboardEntry } from '@/leaderboard/leaderboard';

export function LeaderboardScreen() {
  const { colors } = useTheme();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    loadLeaderboard().then(setEntries);
  }, []);

  const today = todayISO();
  const todayEntries = entries.filter(e => e.date === today);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Daily Leaderboard</Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>{today} · local device only</Text>
      <FlatList
        data={todayEntries}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListEmptyComponent={
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 32 }}>
            No scores yet today. Solve the daily challenge!
          </Text>
        }
        renderItem={({ item, index }) => (
          <View
            style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={{ color: colors.textMuted, width: 28 }}>{index + 1}</Text>
            <Text style={{ color: colors.text, flex: 1 }}>{item.name}</Text>
            <Text style={{ color: colors.accent, fontVariant: ['tabular-nums'] }}>
              {formatTime(item.timeMs)}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', paddingHorizontal: 16, paddingTop: 12 },
  sub: { fontSize: 13, paddingHorizontal: 16, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
});
