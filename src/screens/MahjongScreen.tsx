import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { MahjongBoard } from '@/games/mahjong/MahjongBoard';
import {
  dailySeed,
  findHint,
  freeTiles,
  generateMahjong,
  isStuck,
  randomSeed,
  solvableShuffle,
} from '@/games/mahjong/engine';
import { clearGame, loadGame, saveGame } from '@/games/mahjong/persistence';
import type { MahjongMode, MahjongState, Tile } from '@/games/mahjong/types';
import { AdBanner } from '@/ads/AdBanner';
import { maybeShowInterstitial } from '@/ads/interstitial';
import { useEntitlements } from '@/iap/EntitlementsProvider';
import { submitScore, todayISO } from '@/leaderboard/leaderboard';
import { recordFinish } from '@/stats/stats';
import { useFeedback } from '@/feedback/useFeedback';
import { usePreferences } from '@/prefs/PreferencesProvider';
import { ResultModal } from '@/components/ResultModal';
import { NameInputModal } from '@/components/NameInputModal';
import { Onboarding } from '@/components/Onboarding';
import { MAHJONG_ONBOARDING } from '@/onboarding/steps';
import { useOnboarding } from '@/onboarding/useOnboarding';
import { useNavigation } from '@react-navigation/native';

const STARTING_HINTS = 3;
const STARTING_SHUFFLES = 2;
const MATCH_POINTS = 100;
const HINT_PENALTY = 100;
const SHUFFLE_PENALTY = 200;

interface Props {
  mode: MahjongMode;
}

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

function newState(mode: MahjongMode): MahjongState {
  const seed = mode.kind === 'daily' ? dailySeed() : randomSeed();
  return {
    tiles: generateMahjong(seed),
    removed: new Set(),
    startedAt: Date.now(),
    finishedAt: null,
    outcome: 'playing',
    hintsLeft: STARTING_HINTS,
    shufflesLeft: STARTING_SHUFFLES,
    score: 0,
  };
}

interface Snapshot {
  removed: Set<number>;
  hintsLeft: number;
  shufflesLeft: number;
  score: number;
}

export function MahjongScreen({ mode }: Props) {
  const { colors } = useTheme();
  const { adsRemoved } = useEntitlements();
  const fb = useFeedback();
  const { prefs, setPref } = usePreferences();
  const navigation = useNavigation();

  const [state, setState] = useState<MahjongState | null>(null);
  const [resultVisible, setResultVisible] = useState(false);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const pendingDailyRef = React.useRef<{ timeMs: number } | null>(null);
  const onboarding = useOnboarding('mahjong');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hintIds, setHintIds] = useState<Set<number>>(() => new Set());
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState<string | null>(null);
  const finishHandled = useRef(false);

  // Load or create on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await loadGame(mode);
      if (cancelled) return;
      const stillTodaysDaily =
        mode.kind !== 'daily' ||
        (saved && saved.startedAt > Date.now() - 36 * 3600 * 1000);
      if (saved && stillTodaysDaily) {
        setState(saved);
        finishHandled.current = saved.outcome !== 'playing';
      } else {
        setState(newState(mode));
        finishHandled.current = false;
      }
      setSelectedId(null);
      setHintIds(new Set());
      setHistory([]);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  // Live timer.
  useEffect(() => {
    if (!state || state.outcome !== 'playing') return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state]);

  // Persist on every change.
  useEffect(() => {
    if (!state) return;
    saveGame(mode, state);
  }, [mode, state]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(t => (t === msg ? null : t)), 1500);
  };

  const pushSnapshot = useCallback((s: MahjongState) => {
    setHistory(h => [
      ...h,
      {
        removed: new Set(s.removed),
        hintsLeft: s.hintsLeft,
        shufflesLeft: s.shufflesLeft,
        score: s.score,
      },
    ]);
  }, []);

  const tryMatch = useCallback(
    (a: Tile, b: Tile) => {
      if (!state) return;
      if (a.group !== b.group) {
        fb.wrong();
        setSelectedId(null);
        showToast('No match');
        return;
      }
      fb.correct();
      pushSnapshot(state);
      const removed = new Set(state.removed);
      removed.add(a.id);
      removed.add(b.id);

      const finishedAll = removed.size === state.tiles.length;
      const stuck = !finishedAll && isStuck(state.tiles, removed);

      if (finishedAll) fb.win();
      else if (stuck) fb.lose();
      const next: MahjongState = {
        ...state,
        removed,
        finishedAt: finishedAll || stuck ? Date.now() : null,
        outcome: finishedAll ? 'won' : stuck ? 'stuck' : 'playing',
        score: state.score + MATCH_POINTS,
      };
      setState(next);
      setSelectedId(null);
      setHintIds(new Set());
    },
    [state, pushSnapshot],
  );

  const onSelect = (id: number) => {
    if (!state || state.outcome !== 'playing') return;
    setHintIds(new Set());
    const tile = state.tiles[id];
    if (selectedId === null) {
      setSelectedId(id);
      return;
    }
    if (selectedId === id) {
      setSelectedId(null);
      return;
    }
    const prev = state.tiles[selectedId];
    tryMatch(prev, tile);
  };

  const undo = () => {
    if (!state || state.outcome !== 'playing') return;
    const last = history[history.length - 1];
    if (!last) return;
    setHistory(h => h.slice(0, -1));
    setState({
      ...state,
      removed: last.removed,
      hintsLeft: last.hintsLeft,
      shufflesLeft: last.shufflesLeft,
      score: last.score,
    });
    setSelectedId(null);
    setHintIds(new Set());
  };

  const useHint = () => {
    if (!state || state.outcome !== 'playing' || state.hintsLeft <= 0) return;
    const pair = findHint(state.tiles, state.removed);
    if (!pair) {
      showToast('No matches available');
      return;
    }
    pushSnapshot(state);
    setState({
      ...state,
      hintsLeft: state.hintsLeft - 1,
      score: Math.max(0, state.score - HINT_PENALTY),
    });
    setHintIds(new Set(pair));
  };

  const shuffleRemaining = () => {
    if (!state || state.outcome !== 'playing' || state.shufflesLeft <= 0) return;
    pushSnapshot(state);
    const next = solvableShuffle(state.tiles, state.removed);
    setState({
      ...state,
      tiles: next,
      shufflesLeft: state.shufflesLeft - 1,
      score: Math.max(0, state.score - SHUFFLE_PENALTY),
    });
    setSelectedId(null);
    setHintIds(new Set());
  };

  // Finish flow.
  useEffect(() => {
    if (!state || state.outcome === 'playing' || finishHandled.current) return;
    finishHandled.current = true;
    (async () => {
      const timeMs = (state.finishedAt ?? Date.now()) - state.startedAt;
      const shouldInterstitial = await maybeShowInterstitial(adsRemoved);
      if (shouldInterstitial) Alert.alert('Ad', '(Interstitial would show here)');

      await recordFinish({
        game: 'mahjong',
        mode: mode.kind,
        outcome: state.outcome === 'won' ? 'won' : 'lost',
        timeMs,
        date: todayISO(),
        score: state.score,
      });

      if (state.outcome === 'won' && mode.kind === 'daily') {
        pendingDailyRef.current = { timeMs };
        if (!prefs.playerName) {
          setNameModalVisible(true);
          return;
        }
        await submitScore({ name: prefs.playerName, timeMs, date: todayISO() });
      }
      setResultVisible(true);
    })();
  }, [state, adsRemoved, mode, prefs.playerName]);

  const startNewGame = async () => {
    await clearGame(mode);
    setState(newState(mode));
    setSelectedId(null);
    setHintIds(new Set());
    setHistory([]);
    finishHandled.current = false;
  };

  const remaining = useMemo(
    () => (state ? state.tiles.length - state.removed.size : 0),
    [state],
  );
  const freeCount = useMemo(
    () => (state ? freeTiles(state.tiles, state.removed).length : 0),
    [state],
  );

  if (!state) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  const elapsed =
    state.outcome === 'playing'
      ? now - state.startedAt
      : (state.finishedAt ?? state.startedAt) - state.startedAt;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {mode.kind === 'daily' ? 'Daily Mahjong' : 'Mahjong'}
          </Text>
          <Text style={[styles.headerStat, { color: colors.textMuted }]}>
            {formatTime(elapsed)}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <Stat label="Tiles left" value={`${remaining}`} />
          <Stat label="Free" value={`${freeCount}`} />
          <Stat label="Score" value={`${state.score}`} />
        </View>

        <ScrollView
          horizontal
          contentContainerStyle={{ paddingVertical: 4 }}
          showsHorizontalScrollIndicator={false}
        >
          <MahjongBoard
            tiles={state.tiles}
            removed={state.removed}
            selectedId={selectedId}
            hintIds={hintIds}
            onSelect={onSelect}
          />
        </ScrollView>

        {toast && (
          <View style={[styles.toast, { backgroundColor: colors.text }]}>
            <Text style={{ color: colors.background, fontWeight: '600' }}>{toast}</Text>
          </View>
        )}

        <View style={styles.actionRow}>
          <ActionButton
            icon="arrow-undo"
            label="Undo"
            disabled={history.length === 0 || state.outcome !== 'playing'}
            onPress={undo}
          />
          <ActionButton
            icon="bulb-outline"
            label="Hint"
            badge={state.hintsLeft}
            disabled={state.hintsLeft === 0 || state.outcome !== 'playing'}
            onPress={useHint}
          />
          <ActionButton
            icon="shuffle"
            label="Shuffle"
            badge={state.shufflesLeft}
            disabled={state.shufflesLeft === 0 || state.outcome !== 'playing'}
            onPress={shuffleRemaining}
          />
          <ActionButton icon="refresh" label="New" onPress={startNewGame} />
        </View>
      </ScrollView>
      <AdBanner />

      <Onboarding
        visible={onboarding.visible}
        steps={MAHJONG_ONBOARDING}
        onClose={onboarding.dismiss}
      />

      <NameInputModal
        visible={nameModalVisible}
        title="Save your daily score"
        message="Your name will appear on the daily leaderboard."
        defaultValue={prefs.playerName}
        onSubmit={async name => {
          setNameModalVisible(false);
          const finalName = name || 'Anon';
          setPref('playerName', name);
          const r = pendingDailyRef.current;
          if (r) await submitScore({ name: finalName, timeMs: r.timeMs, date: todayISO() });
          setResultVisible(true);
        }}
        onDismiss={() => {
          setNameModalVisible(false);
          setResultVisible(true);
        }}
      />

      <ResultModal
        visible={resultVisible}
        won={state.outcome === 'won'}
        title={state.outcome === 'won' ? 'Solved!' : 'No more moves'}
        subtitle={state.outcome === 'won' ? 'All tiles cleared' : 'No matching free pairs left.'}
        stats={[
          { label: 'Time', value: formatTime(elapsed) },
          { label: 'Score', value: `${state.score}` },
          { label: 'Tiles', value: `${state.tiles.length - state.removed.size}` },
        ]}
        share={{
          game: 'mahjong',
          timeMs: elapsed,
          score: state.score,
          won: state.outcome === 'won',
          dayLabel: mode.kind === 'daily' ? todayISO() : undefined,
        }}
        primaryLabel={mode.kind === 'daily' ? 'Back to menu' : 'New game'}
        onPrimary={() => {
          setResultVisible(false);
          if (mode.kind === 'random') startNewGame();
          else navigation.goBack();
        }}
        secondaryLabel={mode.kind === 'random' ? 'Back to menu' : undefined}
        onSecondary={mode.kind === 'random' ? () => { setResultVisible(false); navigation.goBack(); } : undefined}
      />
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={{ fontSize: 12, color: colors.textMuted }}>{label}</Text>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>{value}</Text>
    </View>
  );
}

interface ActionBtnProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  badge?: number;
}

function ActionButton({ icon, label, onPress, disabled, badge }: ActionBtnProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.actionBtn,
        {
          backgroundColor: colors.surfaceAlt,
          borderColor: colors.border,
          opacity: disabled ? 0.4 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={22} color={colors.text} />
      <Text style={{ fontSize: 10, marginTop: 2, color: colors.textMuted }}>{label}</Text>
      {badge != null && (
        <View style={[styles.badge, { backgroundColor: colors.accent }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 12, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800' },
  headerStat: { fontSize: 14, fontVariant: ['tabular-nums'] },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  toast: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 4 },
  actionBtn: {
    width: 64,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
