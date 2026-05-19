import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { AdBanner } from '@/ads/AdBanner';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[styles.title, { color: colors.text }]}>Mindgames</Text>

        <Text style={[styles.section, { color: colors.textMuted }]}>Daily challenges</Text>
        <View style={styles.row}>
          <DailyCard
            label="Sudoku"
            sub="One puzzle a day"
            onPress={() => navigation.navigate('Sudoku', { mode: { kind: 'daily' } })}
          />
          <DailyCard
            label="Wordle"
            sub="One word a day"
            onPress={() => navigation.navigate('Wordle', { mode: { kind: 'daily' } })}
          />
        </View>
        <View style={styles.row}>
          <DailyCard
            label="Mahjong"
            sub="One layout a day"
            onPress={() => navigation.navigate('Mahjong', { mode: { kind: 'daily' } })}
          />
        </View>

        <Text style={[styles.section, { color: colors.textMuted }]}>Practice</Text>

        <Pressable
          onPress={() => navigation.navigate('Sudoku', { mode: { kind: 'random', difficulty: 'medium' } })}
          style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>Sudoku</Text>
          <Text style={[styles.cardSub, { color: colors.textMuted }]}>
            6 difficulties · hints · undo
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Wordle', { mode: { kind: 'random' } })}
          style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>Wordle</Text>
          <Text style={[styles.cardSub, { color: colors.textMuted }]}>
            5 letters · 6 guesses
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Mahjong', { mode: { kind: 'random' } })}
          style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>Mahjong</Text>
          <Text style={[styles.cardSub, { color: colors.textMuted }]}>
            144 tiles · pyramid layout · solvable
          </Text>
        </Pressable>

        <View style={styles.bottomRow}>
          <Pressable
            onPress={() => navigation.navigate('Leaderboard')}
            style={[styles.linkBtn, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text }}>Leaderboard</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            style={[styles.linkBtn, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text }}>Settings</Text>
          </Pressable>
        </View>
      </ScrollView>
      <AdBanner />
    </SafeAreaView>
  );
}

function DailyCard({ label, sub, onPress }: { label: string; sub: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.dailyCard, { backgroundColor: colors.accent }]}>
      <Text style={[styles.cardTitle, { color: '#fff' }]}>{label}</Text>
      <Text style={[styles.cardSub, { color: '#ffffffcc' }]}>{sub}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { padding: 20, gap: 12 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 4 },
  section: { fontSize: 13, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: 12 },
  dailyCard: { flex: 1, borderRadius: 12, padding: 16 },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  cardSub: { fontSize: 13, marginTop: 2 },
  bottomRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  linkBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
