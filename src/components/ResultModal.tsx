import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { Confetti } from './Confetti';
import { shareResult, type ResultShare } from '@/share/share';

interface Stat {
  label: string;
  value: string;
}

interface Props {
  visible: boolean;
  won: boolean;
  title: string;
  subtitle?: string;
  stats?: Stat[];
  share?: ResultShare;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onDismiss?: () => void;
}

export function ResultModal({
  visible,
  won,
  title,
  subtitle,
  stats,
  share,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  onDismiss,
}: Props) {
  const { colors } = useTheme();

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        {won && <Confetti />}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: won ? '#4caf6f' : colors.surfaceAlt },
            ]}
          >
            <Ionicons
              name={won ? 'trophy' : 'sad-outline'}
              size={32}
              color={won ? '#fff' : colors.textMuted}
            />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          )}

          {stats && stats.length > 0 && (
            <View style={styles.statsRow}>
              {stats.map(s => (
                <View key={s.label} style={styles.stat}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <Pressable
              onPress={onPrimary}
              style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>{primaryLabel}</Text>
            </Pressable>
            {secondaryLabel && onSecondary && (
              <Pressable
                onPress={onSecondary}
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.text }}>{secondaryLabel}</Text>
              </Pressable>
            )}
            {share && (
              <Pressable
                onPress={() => shareResult(share)}
                style={[styles.secondaryBtn, { borderColor: colors.border, flexDirection: 'row', gap: 6 }]}
              >
                <Ionicons name="share-outline" size={16} color={colors.text} />
                <Text style={{ color: colors.text }}>Share</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    padding: 24,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: 6,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center' },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 18,
    marginTop: 14,
    marginBottom: 6,
  },
  stat: { alignItems: 'center', minWidth: 80 },
  statValue: { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 2 },
  actions: { width: '100%', gap: 8, marginTop: 14 },
  primaryBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  secondaryBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
