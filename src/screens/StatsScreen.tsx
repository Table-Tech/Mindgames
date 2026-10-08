import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/fonts';
import { usePreferences } from '@/prefs/PreferencesProvider';
import {
  computeStats,
  computeSudokuByDifficulty,
  formatTime,
  getRecords,
  winRate,
  type FinishRecord,
  type GameId,
} from '@/stats/stats';
import { loadLeaderboard, todayISO, type LeaderboardEntry } from '@/leaderboard/leaderboard';
import { Body, Card, Chunky, Display, Eyebrow, OUTLINE, Segmented, TabBar } from '@/ui/kit';

const INK = '#1D1A33';

type Tab = 'stats' | 'board';

export function StatsScreen() {
  const { colors } = useTheme();
  const [records, setRecords] = useState<FinishRecord[] | null>(null);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [tab, setTab] = useState<Tab>('stats');

  const refresh = useCallback(() => {
    getRecords().then(setRecords);
    loadLeaderboard().then(setBoard);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Cloud sync writes merged records back to local storage asynchronously
  // after the screen mounts; refetch when this screen regains focus so the
  // numbers stay up to date.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Display style={{ fontSize: 30 }}>Your progress</Display>
        <Segmented
          options={[
            { value: 'stats', label: 'My stats' },
            { value: 'board', label: 'Leaderboard' },
          ]}
          value={tab}
          onChange={setTab}
        />
        {records === null ? null : tab === 'stats' ? (
          <MyStats records={records} />
        ) : (
          <Leaderboard entries={board} />
        )}
      </ScrollView>
      <TabBar active="Stats" />
    </SafeAreaView>
  );
}

// ---------- My stats ----------

const GAMES: { id: GameId; label: string }[] = [
  { id: 'sudoku', label: 'Sudoku' },
  { id: 'wordle', label: 'Wordle' },
  { id: 'mahjong', label: 'Mahjong' },
];

function shiftISO(iso: string, days: number) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

function MyStats({ records }: { records: FinishRecord[] }) {
  const { colors } = useTheme();
  const [game, setGame] = useState<GameId>('sudoku');

  const all = GAMES.map(g => computeStats(records, g.id));
  const currentStreak = Math.max(...all.map(s => s.currentStreak));
  const bestStreak = Math.max(...all.map(s => s.bestStreak));

  // Current week, Monday first, marked when any daily was won that day.
  const today = todayISO();
  const [y, m, d] = today.split('-').map(Number);
  const weekday = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
  const monday = shiftISO(today, -weekday);
  const wonDays = new Set(
    records.filter(r => r.mode === 'daily' && r.outcome === 'won').map(r => r.date),
  );
  const week = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => {
    const iso = shiftISO(monday, i);
    return { label, done: wonDays.has(iso), isToday: iso === today };
  });

  const gameColor = { sudoku: colors.sudoku, wordle: colors.wordle, mahjong: colors.mahjong }[game];
  const gameFg = game === 'sudoku' ? '#FFFFFF' : INK;
  const stats = computeStats(records, game);

  const bars: { label: string; n: number }[] =
    game === 'wordle'
      ? stats.guessHistogram.map((n, i) => ({ label: `${i + 1}`, n }))
      : game === 'sudoku'
        ? computeSudokuByDifficulty(records).map(s => ({
            label: s.difficulty[0].toUpperCase() + s.difficulty.slice(1),
            n: s.won,
          }))
        : [];
  const maxBar = Math.max(1, ...bars.map(b => b.n));

  const tiles =
    game === 'wordle'
      ? [
          ['Played', `${stats.played}`],
          ['Win rate', `${winRate(stats)}%`],
          ['Avg guesses', stats.avgGuesses != null ? `${stats.avgGuesses}` : '—'],
          ['Best streak', `${stats.bestStreak}`],
        ]
      : [
          ['Played', `${stats.played}`],
          ['Win rate', `${winRate(stats)}%`],
          ['Best time', formatTime(stats.bestTimeMs)],
          ['Avg time', formatTime(stats.avgTimeMs)],
        ];

  return (
    <View style={{ gap: 16 }}>
      <Card color={colors.pink} radius={24} depth={5} style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Eyebrow style={{ color: INK }}>Current streak</Eyebrow>
            <Text style={styles.heroNumber}>
              {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
            </Text>
          </View>
          <View style={[styles.heroIcon, { borderColor: colors.ink }]}>
            <Ionicons name="flame" size={34} color={colors.pink} />
          </View>
        </View>
        <View style={styles.week}>
          {week.map((w, i) => (
            <View key={i} style={{ alignItems: 'center', gap: 4 }}>
              <View
                style={[
                  styles.weekDot,
                  {
                    borderColor: colors.ink,
                    backgroundColor: w.done ? colors.ink : '#FFFFFF',
                    borderWidth: w.isToday ? 3 : OUTLINE,
                  },
                ]}
              >
                {w.done && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
              <Text style={styles.weekLabel}>{w.label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.heroFoot}>Best streak: {bestStreak} days</Text>
      </Card>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {GAMES.map(g => {
          const on = g.id === game;
          const c = { sudoku: colors.sudoku, wordle: colors.wordle, mahjong: colors.mahjong }[g.id];
          return (
            <Chunky
              key={g.id}
              onPress={() => setGame(g.id)}
              selected={on}
              depth={3}
              radius={999}
              color={on ? c : colors.surface}
              style={{ flex: 1 }}
              contentStyle={styles.gameChip}
            >
              <Text
                style={{
                  fontFamily: fonts.bodyHeavy,
                  fontSize: 14,
                  color: on ? (g.id === 'sudoku' ? '#FFFFFF' : INK) : colors.text,
                }}
              >
                {g.label}
              </Text>
            </Chunky>
          );
        })}
      </View>

      <View style={styles.tileGrid}>
        {tiles.map(([label, value]) => (
          <Card key={label} radius={18} style={styles.tile}>
            <Body style={{ fontSize: 12, color: colors.textMuted }}>{label}</Body>
            <Display style={{ fontSize: 28, fontVariant: ['tabular-nums'] }}>{value}</Display>
          </Card>
        ))}
      </View>

      {bars.length > 0 && bars.some(b => b.n > 0) && (
        <Card radius={20} style={{ padding: 16, gap: 10 }}>
          <Display style={{ fontFamily: fonts.displaySemi, fontSize: 18 }}>
            {game === 'wordle' ? 'Guess distribution' : 'Wins by difficulty'}
          </Display>
          {bars.map(b => (
            <View key={b.label} style={styles.barRow}>
              <Body style={{ width: 58, fontFamily: fonts.bodyHeavy, fontSize: 12 }}>
                {b.label}
              </Body>
              <View style={[styles.barTrack, { backgroundColor: colors.surfaceAlt }]}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${Math.max(12, (b.n / maxBar) * 100)}%`,
                      backgroundColor: gameColor,
                      borderColor: colors.ink,
                    },
                  ]}
                >
                  <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 11, color: gameFg }}>
                    {b.n}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Card>
      )}

      {records.length === 0 && (
        <Body style={{ textAlign: 'center', color: colors.textMuted, paddingHorizontal: 24 }}>
          No games finished yet. Play a daily or free-play round to start tracking.
        </Body>
      )}
    </View>
  );
}

// ---------- Leaderboard ----------

function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  const { colors } = useTheme();
  const { prefs } = usePreferences();
  const today = todayISO();
  const todays = entries.filter(e => e.date === today);
  const medals = [colors.wordle, '#D9D6E8', '#F2A26B'];

  if (todays.length === 0) {
    return (
      <Body style={{ textAlign: 'center', color: colors.textMuted, marginTop: 24 }}>
        No scores yet today. Solve a daily challenge!
      </Body>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      <Body style={{ fontSize: 14, color: colors.textMuted }}>
        Today's dailies · fastest times on this device
      </Body>
      {todays.map((e, i) => {
        const me = !!prefs.playerName && e.name === prefs.playerName;
        return (
          <Card
            key={`${e.name}-${i}`}
            color={me ? colors.sunflower : colors.surface}
            radius={18}
            depth={me ? 4 : 3}
            style={styles.lbRow}
          >
            <View
              style={[
                styles.medal,
                { backgroundColor: medals[i] ?? colors.surface, borderColor: colors.ink },
              ]}
            >
              <Text style={{ fontFamily: fonts.display, fontSize: 16, color: INK }}>{i + 1}</Text>
            </View>
            <Body
              style={{
                flex: 1,
                fontFamily: fonts.bodyHeavy,
                fontSize: 16,
                color: me ? INK : colors.text,
              }}
              numberOfLines={1}
            >
              {e.name}
              {e.game ? ` · ${e.game[0].toUpperCase() + e.game.slice(1)}` : ''}
            </Body>
            <Display
              style={{
                fontFamily: fonts.displaySemi,
                fontSize: 18,
                fontVariant: ['tabular-nums'],
                color: me ? INK : colors.text,
              }}
            >
              {formatTime(e.timeMs)}
            </Display>
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingTop: 12, gap: 16 },
  hero: { padding: 18, paddingHorizontal: 20, gap: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroNumber: { fontFamily: fonts.display, fontSize: 46, lineHeight: 50, color: INK },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: OUTLINE + 0.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '8deg' }],
  },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDot: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabel: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: INK },
  heroFoot: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: INK },
  gameChip: { height: 40, alignItems: 'center', justifyContent: 'center' },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48%', flexGrow: 1, padding: 14 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barTrack: { flex: 1, height: 24, borderRadius: 8, overflow: 'hidden' },
  bar: {
    height: '100%',
    borderRadius: 8,
    borderWidth: OUTLINE,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 6,
  },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  medal: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: OUTLINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
