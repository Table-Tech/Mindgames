import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { AdBanner } from '@/ads/AdBanner';
import type { RootStackParamList } from '@/navigation/types';
import { loadHomeStatus, type HomeStatus } from '@/home/homeStatus';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [status, setStatus] = useState<HomeStatus | null>(null);

  const refresh = useCallback(async () => {
    setStatus(await loadHomeStatus());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Mindgames</Text>
          {status && totalStreak(status) > 0 && (
            <View style={[styles.streakChip, { backgroundColor: colors.accent }]}>
              <Ionicons name="flame" size={14} color="#fff" />
              <Text style={styles.streakText}>{totalStreak(status)}</Text>
            </View>
          )}
        </View>

        <Text style={[styles.section, { color: colors.textMuted }]}>Daily challenges</Text>
        <DailyRow
          label="Sudoku"
          status={status?.sudoku.daily}
          streak={status?.sudoku.streak}
          onPress={() => navigation.navigate('Sudoku', { mode: { kind: 'daily' } })}
        />
        <DailyRow
          label="Wordle"
          status={status?.wordle.daily}
          streak={status?.wordle.streak}
          onPress={() => navigation.navigate('Wordle', { mode: { kind: 'daily' } })}
        />
        <DailyRow
          label="Mahjong"
          status={status?.mahjong.daily}
          streak={status?.mahjong.streak}
          onPress={() => navigation.navigate('Mahjong', { mode: { kind: 'daily' } })}
        />

        <Text style={[styles.section, { color: colors.textMuted }]}>Practice</Text>

        <PracticeCard
          label="Sudoku"
          sub="6 difficulties · hints · undo"
          resumable={status?.sudoku.resume.hasPractice}
          onPress={() => navigation.navigate('Sudoku', { mode: { kind: 'random', difficulty: 'medium' } })}
        />
        <PracticeCard
          label="Wordle"
          sub="5 letters · 6 guesses"
          resumable={status?.wordle.resume.hasPractice}
          onPress={() => navigation.navigate('Wordle', { mode: { kind: 'random' } })}
        />
        <PracticeCard
          label="Mahjong"
          sub="144 tiles · pyramid · solvable"
          resumable={status?.mahjong.resume.hasPractice}
          onPress={() => navigation.navigate('Mahjong', { mode: { kind: 'random' } })}
        />

        <View style={styles.bottomRow}>
          <LinkBtn icon="stats-chart-outline" label="Stats" onPress={() => navigation.navigate('Stats')} />
          <LinkBtn icon="trophy-outline" label="Leaderboard" onPress={() => navigation.navigate('Leaderboard')} />
          <LinkBtn icon="settings-outline" label="Settings" onPress={() => navigation.navigate('Settings')} />
        </View>
      </ScrollView>
      <AdBanner />
    </SafeAreaView>
  );
}

function totalStreak(s: HomeStatus) {
  return s.sudoku.streak + s.wordle.streak + s.mahjong.streak;
}

interface DailyRowProps {
  label: string;
  status?: { done: boolean; inProgress: boolean };
  streak?: number;
  onPress: () => void;
}

function DailyRow({ label, status, streak, onPress }: DailyRowProps) {
  const { colors } = useTheme();
  const tone: 'new' | 'progress' | 'done' = status?.done
    ? 'done'
    : status?.inProgress
      ? 'progress'
      : 'new';

  const icon =
    tone === 'done' ? 'checkmark-circle' :
    tone === 'progress' ? 'time-outline' : 'sparkles-outline';

  const iconColor =
    tone === 'done' ? '#4caf6f' :
    tone === 'progress' ? '#d9a93a' : '#fff';

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.dailyRow,
        {
          backgroundColor: tone === 'new' ? colors.accent : colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.dailyLeft}>
        <Ionicons name={icon} size={22} color={iconColor} />
        <View>
          <Text style={[styles.dailyLabel, { color: tone === 'new' ? '#fff' : colors.text }]}>
            {label}
          </Text>
          <Text
            style={[
              styles.dailySub,
              { color: tone === 'new' ? '#ffffffcc' : colors.textMuted },
            ]}
          >
            {tone === 'done' ? 'Completed today' :
             tone === 'progress' ? 'Continue today\'s puzzle' :
             'Play today\'s puzzle'}
          </Text>
        </View>
      </View>
      {!!streak && streak > 0 && (
        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={12} color={tone === 'new' ? '#fff' : '#d64545'} />
          <Text style={[styles.streakBadgeText, { color: tone === 'new' ? '#fff' : colors.text }]}>
            {streak}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

interface PracticeCardProps {
  label: string;
  sub: string;
  resumable?: boolean;
  onPress: () => void;
}

function PracticeCard({ label, sub, resumable, onPress }: PracticeCardProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.cardSub, { color: colors.textMuted }]}>{sub}</Text>
      </View>
      {resumable && (
        <View style={[styles.resumePill, { backgroundColor: colors.accent }]}>
          <Ionicons name="play" size={10} color="#fff" />
          <Text style={styles.resumePillText}>Resume</Text>
        </View>
      )}
    </Pressable>
  );
}

function LinkBtn({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.linkBtn, { borderColor: colors.border }]}>
      <Ionicons name={icon} size={20} color={colors.text} />
      <Text style={[styles.linkBtnText, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { padding: 20, gap: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '800' },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  streakText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  section: {
    fontSize: 13,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dailyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dailyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dailyLabel: { fontSize: 16, fontWeight: '700' },
  dailySub: { fontSize: 12, marginTop: 2 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  streakBadgeText: { fontSize: 12, fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  cardSub: { fontSize: 13, marginTop: 2 },
  resumePill: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  resumePillText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  bottomRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  linkBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  linkBtnText: { fontSize: 12 },
});
