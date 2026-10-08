import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/fonts';
import { Body, Card, Chunky, Display, Eyebrow, OUTLINE, Segmented, TabBar, Toggle } from '@/ui/kit';
import { useEntitlements } from '@/iap/EntitlementsProvider';
import { usePreferences, type ThemeMode } from '@/prefs/PreferencesProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import {
  cancelDailyReminder,
  ensurePermission,
  scheduleDailyReminder,
} from '@/notifications/dailyReminder';
import { flushPush, fullSync, getLastSyncedAt, schedulePush } from '@/cloud/cloudSave';
import { ActivityIndicator } from 'react-native';

export function SettingsScreen() {
  const { colors } = useTheme();
  const { adsRemoved, purchasing, restoring, purchaseRemoveAds, restorePurchases } =
    useEntitlements();
  const { prefs, setPref, resetPrefs } = usePreferences();
  const [nameDraft, setNameDraft] = useState(prefs.playerName);
  const [syncBusy, setSyncBusy] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  useEffect(() => {
    getLastSyncedAt().then(setLastSyncedAt);
  }, []);

  // Refresh the playerName draft when the cloud sync writes a new value
  // back to local prefs.
  useEffect(() => {
    setNameDraft(prefs.playerName);
  }, [prefs.playerName]);

  const onSyncNow = useCallback(async () => {
    setSyncBusy(true);
    try {
      const res = await fullSync();
      if (!res.ok) {
        Alert.alert(
          'Sync failed',
          res.error ?? 'Could not reach the cloud. Check your connection and try again.',
        );
      }
      setLastSyncedAt(await getLastSyncedAt());
    } finally {
      setSyncBusy(false);
    }
  }, []);

  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: 'Auto' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  const clearProgress = () => {
    Alert.alert(
      'Clear all progress',
      'This deletes all in-progress games, stats, leaderboards, and preferences on this device. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            resetPrefs();
            // Tell the cloud the user's snapshot is now empty.
            schedulePush(0);
            Alert.alert('Cleared', 'All local data has been removed.');
          },
        },
      ],
    );
  };

  const clearStats = async () => {
    Alert.alert(
      'Clear statistics',
      'Reset all play stats and streaks on this device? Cloud-synced stats will repopulate on next sign-in unless you also clear the cloud copy.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['stats.records.v1', 'sudoku.daily.leaderboard.v1']);
            // Push the empty record set so cloud reflects the wipe too.
            await flushPush().catch(() => {});
            setLastSyncedAt(await getLastSyncedAt());
            Alert.alert('Done', 'Statistics cleared.');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Display style={{ fontSize: 30 }}>Settings</Display>

        <Card radius={22} style={styles.profile}>
          <View
            style={[styles.avatar, { backgroundColor: colors.wordle, borderColor: colors.ink }]}
          >
            <Text style={styles.avatarText}>{(nameDraft.trim()[0] ?? '?').toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Eyebrow style={{ fontSize: 11, letterSpacing: 0.4 }}>Leaderboard name</Eyebrow>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              onBlur={() => setPref('playerName', nameDraft.trim())}
              placeholder="Anon"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Leaderboard name"
              style={[styles.nameInput, { color: colors.text }]}
              maxLength={16}
            />
          </View>
          <View
            style={[
              styles.syncPill,
              { borderColor: colors.ink, backgroundColor: colors.surfaceAlt },
            ]}
          >
            <Ionicons name="cloud-done-outline" size={14} color={colors.text} />
            <Text style={[styles.syncPillText, { color: colors.text }]}>
              {formatLastSynced(lastSyncedAt)}
            </Text>
          </View>
        </Card>

        <Section title="Appearance">
          <Segmented
            options={themeOptions}
            value={prefs.themeMode}
            onChange={v => setPref('themeMode', v)}
          />
        </Section>

        <Section title="Game feel">
          <Group>
            <SwitchRow
              label="Sounds"
              sub="Pops, chimes and fanfares"
              value={prefs.soundEnabled}
              onChange={v => setPref('soundEnabled', v)}
            />
            <SwitchRow
              label="Haptics"
              sub="Little buzzes on every tap"
              value={prefs.hapticsEnabled}
              onChange={v => setPref('hapticsEnabled', v)}
            />
          </Group>
        </Section>

        <Section title="Sudoku">
          <Group>
            <SwitchRow
              label="Auto-clear notes"
              sub="Remove notes when placing a value"
              value={prefs.sudokuAutoCleanupNotes}
              onChange={v => setPref('sudokuAutoCleanupNotes', v)}
            />
            <SwitchRow
              label="Highlight mistakes"
              sub="Show wrong numbers in red"
              value={prefs.sudokuHighlightMistakes}
              onChange={v => setPref('sudokuHighlightMistakes', v)}
            />
          </Group>
        </Section>

        <Section title="Wordle">
          <Group>
            <SwitchRow
              label="Hard mode"
              sub="Revealed hints must be used"
              value={prefs.wordleHardMode}
              onChange={v => setPref('wordleHardMode', v)}
            />
          </Group>
        </Section>

        <Section title="Daily reminder">
          <Group>
            <SwitchRow
              label="Daily reminder"
              sub="Nudge me when new puzzles drop"
              value={prefs.dailyReminderEnabled}
              onChange={async v => {
                if (v) {
                  const granted = await ensurePermission();
                  if (!granted) {
                    Alert.alert(
                      'Permission denied',
                      'Enable notifications for Puzzaro in system settings to use reminders.',
                    );
                    return;
                  }
                  await scheduleDailyReminder(prefs.dailyReminderHour, prefs.dailyReminderMinute);
                } else {
                  await cancelDailyReminder();
                }
                setPref('dailyReminderEnabled', v);
              }}
            />
            {prefs.dailyReminderEnabled && (
              <Row label="Time">
                <TimeStepper
                  hour={prefs.dailyReminderHour}
                  minute={prefs.dailyReminderMinute}
                  onChange={async (h, m) => {
                    setPref('dailyReminderHour', h);
                    setPref('dailyReminderMinute', m);
                    await scheduleDailyReminder(h, m);
                  }}
                />
              </Row>
            )}
          </Group>
        </Section>

        <Section title="Cloud sync">
          <Chunky
            onPress={onSyncNow}
            disabled={syncBusy}
            contentStyle={[styles.bigBtn, { flexDirection: 'row', gap: 8 }]}
          >
            {syncBusy ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Ionicons name="cloud-upload-outline" size={20} color={colors.text} />
            )}
            <Text style={[styles.bigBtnText, { color: colors.text }]}>
              {syncBusy ? 'Syncing…' : 'Sync now'}
            </Text>
          </Chunky>
          <Body style={[styles.note, { color: colors.textMuted }]}>
            Stats records and your leaderboard name sync across devices via Firebase. Device-only
            settings (theme, sound, haptics, hard mode) stay on this device.
          </Body>
        </Section>

        <Card color={colors.sudoku} radius={24} depth={5} style={styles.adsCard}>
          {adsRemoved ? (
            <>
              <Display style={{ fontSize: 22, color: '#FFFFFF' }}>Ads removed</Display>
              <Body style={{ color: '#FFFFFF' }}>Thanks for the support!</Body>
            </>
          ) : (
            <>
              <Display style={{ fontSize: 22, color: '#FFFFFF' }}>Play without ads</Display>
              <Body style={{ color: '#FFFFFF' }}>One purchase, every game, forever.</Body>
              <Chunky
                disabled={purchasing}
                color={colors.wordle}
                contentStyle={styles.bigBtn}
                onPress={async () => {
                  const r = await purchaseRemoveAds();
                  if (r.ok) {
                    Alert.alert('Thank you!', 'Ads have been removed.');
                  } else if (!r.cancelled) {
                    Alert.alert('Purchase failed', r.error ?? 'Please try again.');
                  }
                }}
              >
                {purchasing ? (
                  <ActivityIndicator color={INK} />
                ) : (
                  <Text style={[styles.bigBtnText, { color: INK }]}>Remove ads · €2.99</Text>
                )}
              </Chunky>
            </>
          )}
          <Pressable
            disabled={restoring}
            accessibilityRole="button"
            onPress={async () => {
              const r = await restorePurchases();
              if (!r.ok) {
                Alert.alert('Restore failed', r.error ?? 'Please try again.');
              } else if (!adsRemoved) {
                Alert.alert('Nothing to restore', 'No previous purchases were found.');
              }
            }}
            style={[styles.linkRow, { opacity: restoring ? 0.5 : 1 }]}
          >
            <Text style={styles.restoreText}>{restoring ? 'Restoring…' : 'Restore purchases'}</Text>
          </Pressable>
        </Card>

        <Section title="Data">
          <Group>
            <LinkRow label="Clear statistics" onPress={clearStats} />
            <LinkRow label="Clear all data" danger onPress={clearProgress} />
          </Group>
        </Section>

        <Body style={[styles.version, { color: colors.textMuted }]}>Puzzaro · v0.1.0</Body>
      </ScrollView>
      <TabBar active="Settings" />
    </SafeAreaView>
  );
}

const INK = '#1D1A33';

function formatLastSynced(ms: number | null): string {
  if (!ms) return 'Not synced';
  const delta = Date.now() - ms;
  const sec = Math.floor(delta / 1000);
  if (sec < 60) return 'Synced';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Eyebrow style={{ paddingHorizontal: 4 }}>{title}</Eyebrow>
      {children}
    </View>
  );
}

// Groups rows into one outlined card with dividers between them.
function Group({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <Card depth={0} radius={20} style={{ overflow: 'hidden' }}>
      {items.map((child, i) => (
        <View
          key={i}
          style={i > 0 ? { borderTopWidth: 2, borderTopColor: colors.surfaceAlt } : undefined}
        >
          {child}
        </View>
      ))}
    </Card>
  );
}

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Body style={{ fontFamily: fonts.bodyHeavy, fontSize: 16 }}>{label}</Body>
        {sub ? <Body style={{ fontSize: 13, color: colors.textMuted }}>{sub}</Body> : null}
      </View>
      {children}
    </View>
  );
}

function SwitchRow({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Row label={label} sub={sub}>
      <Toggle value={value} onChange={onChange} label={label} />
    </Row>
  );
}

function LinkRow({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  const color = danger ? colors.error : colors.text;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.row}>
      <Body style={{ flex: 1, fontFamily: fonts.bodyHeavy, fontSize: 16, color }}>{label}</Body>
      <Ionicons name="chevron-forward" size={18} color={color} />
    </Pressable>
  );
}

function TimeStepper({
  hour,
  minute,
  onChange,
}: {
  hour: number;
  minute: number;
  onChange: (h: number, m: number) => void;
}) {
  const { colors } = useTheme();
  const adjust = (h: number, m: number) => {
    const total = (((h * 60 + m) % (24 * 60)) + 24 * 60) % (24 * 60);
    onChange(Math.floor(total / 60), total % 60);
  };
  const Step = ({
    icon,
    label,
    onPress,
  }: {
    icon: 'remove' | 'add';
    label: string;
    onPress: () => void;
  }) => (
    <Chunky
      onPress={onPress}
      accessibilityLabel={label}
      depth={2}
      radius={10}
      contentStyle={styles.step}
    >
      <Ionicons name={icon} size={16} color={colors.text} />
    </Chunky>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Step icon="remove" label="Hour earlier" onPress={() => adjust(hour - 1, minute)} />
      <Display style={styles.timeValue}>{hour.toString().padStart(2, '0')}</Display>
      <Step icon="add" label="Hour later" onPress={() => adjust(hour + 1, minute)} />
      <Display style={{ fontSize: 18 }}>:</Display>
      <Step icon="remove" label="15 minutes earlier" onPress={() => adjust(hour, minute - 15)} />
      <Display style={styles.timeValue}>{minute.toString().padStart(2, '0')}</Display>
      <Step icon="add" label="15 minutes later" onPress={() => adjust(hour, minute + 15)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingTop: 12, gap: 18 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: OUTLINE,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-6deg' }],
  },
  avatarText: { fontFamily: fonts.display, fontSize: 24, color: INK },
  nameInput: { fontFamily: fonts.displaySemi, fontSize: 20, paddingVertical: 2 },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: OUTLINE,
  },
  syncPillText: { fontFamily: fonts.bodyHeavy, fontSize: 11 },
  section: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  step: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  timeValue: { fontSize: 18, minWidth: 24, textAlign: 'center', fontVariant: ['tabular-nums'] },
  bigBtn: { height: 52, alignItems: 'center', justifyContent: 'center' },
  bigBtnText: { fontFamily: fonts.displaySemi, fontSize: 18 },
  note: { fontSize: 12, lineHeight: 17, paddingHorizontal: 4 },
  adsCard: { padding: 18, gap: 10 },
  linkRow: { alignItems: 'center', paddingVertical: 8 },
  restoreText: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 14,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  version: { textAlign: 'center', fontSize: 12, marginTop: 4 },
});
