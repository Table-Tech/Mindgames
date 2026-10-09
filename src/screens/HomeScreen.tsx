import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/fonts';
import { AdBanner } from '@/ads/AdBanner';
import type { RootStackParamList } from '@/navigation/types';
import { loadHomeStatus, type DailyStatus, type HomeStatus } from '@/home/homeStatus';
import { DIFFICULTIES, type Difficulty } from '@/games/sudoku/types';
import { GAME_CATALOG } from '@/games/catalog';
import { capitalize } from '@/core/format';
import { Body, Chunky, Display, Eyebrow, OUTLINE, Pill, TabBar, CONTENT_MAX_WIDTH } from '@/ui/kit';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const INK = '#1D1A33';

export function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [status, setStatus] = useState<HomeStatus | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const refresh = useCallback(async () => {
    setStatus(await loadHomeStatus());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const games = status ? Object.values(status) : [];
  const doneCount = games.filter(g => g.daily.done).length;
  const streak = Math.max(0, ...games.map(g => g.streak));
  const total = GAME_CATALOG.length;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.brand}>
            <Logo />
            <Display style={{ fontSize: 30, letterSpacing: -0.5 }}>Puzzaro</Display>
          </View>
          {streak > 0 && (
            <View
              style={[styles.streakChip, { backgroundColor: colors.pink, borderColor: colors.ink }]}
            >
              <Ionicons name="flame" size={16} color={INK} />
              <Text style={styles.streakText}>{streak} day streak</Text>
            </View>
          )}
        </View>

        <View style={{ gap: 10 }}>
          <Body style={{ fontSize: 14, color: colors.textMuted }}>{today}</Body>
          <View style={styles.titleRow}>
            <Display style={{ fontSize: 30, lineHeight: 34 }}>
              Your daily {total === 3 ? 'three' : total}
            </Display>
            <Body style={{ fontFamily: fonts.bodyHeavy, fontSize: 14 }}>
              {doneCount} / {total} done
            </Body>
          </View>
          <View style={styles.progress}>
            {GAME_CATALOG.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressSeg,
                  {
                    borderColor: colors.ink,
                    backgroundColor: i < doneCount ? colors.mahjong : colors.surface,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {GAME_CATALOG.map(game => (
          <DailyCard
            key={game.id}
            title={game.label}
            color={colors[game.colorKey]}
            fg={game.onColor}
            status={status?.[game.id].daily}
            streak={status?.[game.id].streak}
            art={<game.DailyArt />}
            onPress={() => game.openDaily(navigation)}
          />
        ))}

        <View style={{ gap: 12, marginTop: 6 }}>
          <View style={styles.titleRow}>
            <Display style={{ fontSize: 22 }}>Free play</Display>
            <Body style={{ fontSize: 13, color: colors.textMuted }}>Unlimited puzzles</Body>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 2 }}
          >
            {DIFFICULTIES.map(d => {
              const on = d === difficulty;
              return (
                <Chunky
                  key={d}
                  onPress={() => setDifficulty(d)}
                  selected={on}
                  depth={3}
                  radius={999}
                  color={on ? colors.ink : colors.surface}
                  contentStyle={styles.chip}
                >
                  <Text
                    style={{
                      fontFamily: fonts.bodyHeavy,
                      fontSize: 14,
                      color: on ? colors.onInk : colors.text,
                    }}
                  >
                    {capitalize(d)}
                  </Text>
                </Chunky>
              );
            })}
          </ScrollView>
          <View style={styles.practiceRow}>
            {GAME_CATALOG.map(game => (
              <PracticeCard
                key={game.id}
                label={game.label}
                sub={game.practiceSubtitle({ difficulty })}
                color={colors[game.colorKey]}
                icon={<game.PracticeIcon />}
                resumable={status?.[game.id].resume.hasPractice}
                onPress={() => game.openPractice(navigation, { difficulty })}
              />
            ))}
          </View>
        </View>
      </ScrollView>
      <AdBanner />
      <TabBar active="Home" />
    </SafeAreaView>
  );
}

function Logo() {
  const { colors } = useTheme();
  const squares = [colors.sudoku, colors.wordle, colors.mahjong, colors.pink];
  return (
    <View style={styles.logo}>
      {squares.map(c => (
        <View key={c} style={[styles.logoSq, { backgroundColor: c, borderColor: colors.ink }]} />
      ))}
    </View>
  );
}

function DailyCard({
  title,
  color,
  fg,
  status,
  streak,
  art,
  onPress,
}: {
  title: string;
  color: string;
  fg: string; // text color that reads on `color`
  status?: DailyStatus;
  streak?: number;
  art: React.ReactNode;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const tone: 'new' | 'progress' | 'done' = status?.done
    ? 'done'
    : status?.inProgress
      ? 'progress'
      : 'new';
  const light = fg !== '#FFFFFF';
  const eyebrow =
    tone === 'done' ? 'Daily · Completed' : tone === 'progress' ? 'Daily · In progress' : 'Daily';
  const pill =
    tone === 'done'
      ? { label: 'Solved', icon: 'checkmark' as const }
      : tone === 'progress'
        ? { label: 'Continue', icon: 'chevron-forward' as const }
        : { label: 'Play', icon: 'play' as const };

  return (
    <Chunky
      onPress={onPress}
      color={color}
      depth={5}
      radius={24}
      accessibilityLabel={`${title} daily: ${pill.label}`}
      contentStyle={styles.daily}
    >
      <View style={{ gap: 6, flex: 1 }}>
        <Eyebrow style={{ color: fg }}>{eyebrow}</Eyebrow>
        <Display style={{ fontSize: 28, lineHeight: 30, color: fg }}>{title}</Display>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, alignItems: 'center' }}>
          <Pill
            label={pill.label}
            icon={pill.icon}
            color={light ? colors.ink : '#FFFFFF'}
            textColor={light ? '#FFFFFF' : INK}
            style={{ borderColor: colors.ink }}
          />
          {!!streak && streak > 0 && (
            <View style={styles.cardStreak}>
              <Ionicons name="flame" size={14} color={fg} />
              <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 13, color: fg }}>{streak}</Text>
            </View>
          )}
        </View>
      </View>
      {art}
    </Chunky>
  );
}

function PracticeCard({
  label,
  sub,
  color,
  icon,
  resumable,
  onPress,
}: {
  label: string;
  sub: string;
  color: string;
  icon: React.ReactNode;
  resumable?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Chunky
      onPress={onPress}
      depth={4}
      radius={18}
      style={{ flex: 1 }}
      accessibilityLabel={`${label} free play${resumable ? ', resume' : ''}`}
      contentStyle={styles.practice}
    >
      <View style={[styles.practiceIcon, { backgroundColor: color, borderColor: colors.ink }]}>
        {icon}
      </View>
      <Display style={{ fontFamily: fonts.displaySemi, fontSize: 17 }}>{label}</Display>
      <Body style={{ fontSize: 12, color: colors.textMuted }}>{sub}</Body>
      {resumable && (
        <View style={[styles.resume, { backgroundColor: colors.pink, borderColor: colors.ink }]}>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 11, color: INK }}>Resume</Text>
        </View>
      )}
    </Chunky>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: {
    padding: 16,
    paddingTop: 12,
    gap: 18,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    width: 34,
    height: 34,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    transform: [{ rotate: '-8deg' }],
  },
  logoSq: { width: 15.5, height: 15.5, borderRadius: 5, borderWidth: OUTLINE },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingLeft: 9,
    paddingRight: 12,
    borderRadius: 999,
    borderWidth: OUTLINE,
    borderBottomWidth: OUTLINE + 3,
  },
  streakText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: INK },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  progress: { flexDirection: 'row', gap: 6 },
  progressSeg: { flex: 1, height: 12, borderRadius: 99, borderWidth: OUTLINE },
  daily: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 18,
    paddingLeft: 20,
    paddingRight: 18,
  },
  cardStreak: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  chip: { height: 38, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  practiceRow: { flexDirection: 'row', gap: 10 },
  practice: { padding: 12, paddingVertical: 14, gap: 8 },
  practiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: OUTLINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resume: {
    position: 'absolute',
    top: -10,
    right: -6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: OUTLINE,
  },
});
