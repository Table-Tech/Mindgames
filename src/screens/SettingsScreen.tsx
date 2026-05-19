import React, { useState } from 'react';
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
import { useEntitlements } from '@/iap/EntitlementsProvider';
import { usePreferences, type ThemeMode } from '@/prefs/PreferencesProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import {
  cancelDailyReminder,
  ensurePermission,
  scheduleDailyReminder,
} from '@/notifications/dailyReminder';

export function SettingsScreen() {
  const { colors } = useTheme();
  const { adsRemoved, purchaseRemoveAds, restorePurchases } = useEntitlements();
  const { prefs, setPref, resetPrefs } = usePreferences();
  const [nameDraft, setNameDraft] = useState(prefs.playerName);

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
            Alert.alert('Cleared', 'All local data has been removed.');
          },
        },
      ],
    );
  };

  const clearStats = async () => {
    Alert.alert('Clear statistics', 'Reset all play stats and streaks?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['stats.records.v1', 'sudoku.daily.leaderboard.v1']);
          Alert.alert('Done', 'Statistics cleared.');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        <Section title="Appearance">
          <Row label="Theme">
            <View style={styles.segmented}>
              {themeOptions.map(opt => {
                const active = prefs.themeMode === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setPref('themeMode', opt.value)}
                    style={[
                      styles.segment,
                      {
                        backgroundColor: active ? colors.accent : 'transparent',
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: active ? '#fff' : colors.text }}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Row>
        </Section>

        <Section title="Feedback">
          <SwitchRow
            label="Sound effects"
            value={prefs.soundEnabled}
            onChange={v => setPref('soundEnabled', v)}
          />
          <SwitchRow
            label="Haptic feedback"
            value={prefs.hapticsEnabled}
            onChange={v => setPref('hapticsEnabled', v)}
          />
        </Section>

        <Section title="Sudoku">
          <SwitchRow
            label="Auto-clear notes when placing a value"
            value={prefs.sudokuAutoCleanupNotes}
            onChange={v => setPref('sudokuAutoCleanupNotes', v)}
          />
          <SwitchRow
            label="Highlight mistakes in red"
            value={prefs.sudokuHighlightMistakes}
            onChange={v => setPref('sudokuHighlightMistakes', v)}
          />
        </Section>

        <Section title="Wordle">
          <SwitchRow
            label="Hard mode (revealed hints must be used)"
            value={prefs.wordleHardMode}
            onChange={v => setPref('wordleHardMode', v)}
          />
        </Section>

        <Section title="Daily reminder">
          <SwitchRow
            label="Notify me when a new daily is available"
            value={prefs.dailyReminderEnabled}
            onChange={async v => {
              if (v) {
                const granted = await ensurePermission();
                if (!granted) {
                  Alert.alert('Permission denied', 'Enable notifications for Mindgames in system settings to use reminders.');
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
        </Section>

        <Section title="Profile">
          <Row label="Leaderboard name">
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              onBlur={() => setPref('playerName', nameDraft.trim())}
              placeholder="Anon"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              maxLength={16}
            />
          </Row>
        </Section>

        <Section title="Purchases">
          {adsRemoved ? (
            <Text style={{ color: colors.accent, paddingVertical: 8 }}>
              Ads removed — thanks for the support.
            </Text>
          ) : (
            <Pressable
              onPress={async () => {
                await purchaseRemoveAds();
                Alert.alert('Thank you!', 'Ads have been removed.');
              }}
              style={[styles.bigBtn, { backgroundColor: colors.accent }]}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Remove ads · €2.99</Text>
            </Pressable>
          )}
          <Pressable onPress={restorePurchases} style={styles.linkRow}>
            <Text style={{ color: colors.textMuted }}>Restore purchases</Text>
          </Pressable>
        </Section>

        <Section title="Data" danger>
          <Pressable
            onPress={clearStats}
            style={[styles.bigBtn, { backgroundColor: 'transparent', borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth }]}
          >
            <Text style={{ color: colors.text }}>Clear statistics</Text>
          </Pressable>
          <Pressable
            onPress={clearProgress}
            style={[styles.bigBtn, { backgroundColor: 'transparent', borderColor: colors.error, borderWidth: StyleSheet.hairlineWidth }]}
          >
            <Text style={{ color: colors.error }}>Clear all data</Text>
          </Pressable>
        </Section>

        <Text style={[styles.version, { color: colors.textMuted }]}>Mindgames · v0.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode; danger?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>
      <View style={[styles.sectionBody, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={{ color: colors.text, flex: 1 }}>{label}</Text>
      {children}
    </View>
  );
}

function SwitchRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row label={label}>
      <Switch value={value} onValueChange={onChange} />
    </Row>
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
    const total = ((h * 60 + m) % (24 * 60) + 24 * 60) % (24 * 60);
    onChange(Math.floor(total / 60), total % 60);
  };
  const Step = ({ icon, onPress }: { icon: 'remove' | 'add'; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      style={{
        padding: 6,
        borderRadius: 6,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
      }}
    >
      <Ionicons name={icon} size={14} color={colors.text} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Step icon="remove" onPress={() => adjust(hour - 1, minute)} />
      <Text style={[styles.timeValue, { color: colors.text, minWidth: 24, textAlign: 'center' }]}>
        {hour.toString().padStart(2, '0')}
      </Text>
      <Step icon="add" onPress={() => adjust(hour + 1, minute)} />
      <Text style={{ color: colors.textMuted, marginHorizontal: 2 }}>:</Text>
      <Step icon="remove" onPress={() => adjust(hour, minute - 15)} />
      <Text style={[styles.timeValue, { color: colors.text, minWidth: 24, textAlign: 'center' }]}>
        {minute.toString().padStart(2, '0')}
      </Text>
      <Step icon="add" onPress={() => adjust(hour, minute + 15)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 18 },
  title: { fontSize: 28, fontWeight: '800' },
  section: { gap: 6 },
  sectionTitle: { fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', paddingHorizontal: 4 },
  sectionBody: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  segmented: { flexDirection: 'row', gap: 4 },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  timeValue: { fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] },
  input: {
    minWidth: 120,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bigBtn: {
    margin: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  linkRow: { alignItems: 'center', paddingVertical: 10 },
  version: { textAlign: 'center', fontSize: 12, marginTop: 12 },
});
