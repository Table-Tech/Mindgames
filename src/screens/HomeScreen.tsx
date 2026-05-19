import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text }]}>Mindgames</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Pick a mode</Text>

        <Pressable
          onPress={() => navigation.navigate('Sudoku', { mode: { kind: 'daily' } })}
          style={[styles.card, { backgroundColor: colors.accent }]}
        >
          <Text style={[styles.cardTitle, { color: '#fff' }]}>Daily Challenge</Text>
          <Text style={[styles.cardSub, { color: '#ffffffcc' }]}>One puzzle, leaderboard</Text>
        </Pressable>

        {(['easy', 'medium', 'hard', 'expert'] as const).map(d => (
          <Pressable
            key={d}
            onPress={() => navigation.navigate('Sudoku', { mode: { kind: 'random', difficulty: d } })}
            style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {d[0].toUpperCase() + d.slice(1)}
            </Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>Endless practice</Text>
          </Pressable>
        ))}

        <View style={styles.row}>
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
      </View>
      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, padding: 20, gap: 12 },
  title: { fontSize: 32, fontWeight: '800', marginTop: 12 },
  subtitle: { fontSize: 14, marginBottom: 8 },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  cardSub: { fontSize: 13, marginTop: 2 },
  row: { flexDirection: 'row', gap: 12, marginTop: 'auto' },
  linkBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
