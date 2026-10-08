import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/fonts';
import {
  Body,
  Card,
  Display,
  Eyebrow,
  formatClock,
  IconButton,
  ScreenHeader,
  ToolButton,
} from '@/ui/kit';
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
  const { colors, isDark } = useTheme();
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
        mode.kind !== 'daily' || (saved && saved.startedAt > Date.now() - 36 * 3600 * 1000);
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
        await submitScore({ name: prefs.playerName, timeMs, date: todayISO(), game: 'mahjong' });
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

  const remaining = useMemo(() => (state ? state.tiles.length - state.removed.size : 0), [state]);
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.background : '#E3F7EE' }]}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={mode.kind === 'daily' ? 'Daily Mahjong' : 'Mahjong'}
          subtitle="Match free pairs"
          right={<IconButton icon="refresh" label="New game" onPress={startNewGame} />}
        />

        <View style={styles.statsRow}>
          <Stat label="Time" value={formatClock(elapsed)} />
          <Stat label="Tiles left" value={`${remaining}`} />
          <Stat label="Free" value={`${freeCount}`} />
          <Stat label="Score" value={`${state.score}`} />
        </View>

        <Card color={colors.mahjong} radius={24} depth={5} style={styles.table}>
          <ScrollView
            horizontal
            contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 6, flexGrow: 1 }}
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
        </Card>

        <View style={styles.toastSlot}>
          {toast && (
            <View style={[styles.toast, { backgroundColor: colors.ink }]}>
              <Body style={{ fontFamily: fonts.bodyHeavy, color: colors.onInk }}>{toast}</Body>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          <ToolButton
            icon="arrow-undo"
            label="Undo"
            disabled={history.length === 0 || state.outcome !== 'playing'}
            onPress={undo}
          />
          <ToolButton
            icon="bulb-outline"
            label="Hint"
            color={colors.wordle}
            badge={state.hintsLeft}
            disabled={state.hintsLeft === 0 || state.outcome !== 'playing'}
            onPress={useHint}
          />
          <ToolButton
            icon="shuffle"
            label="Shuffle"
            badge={state.shufflesLeft}
            disabled={state.shufflesLeft === 0 || state.outcome !== 'playing'}
            onPress={shuffleRemaining}
          />
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
        message="We'll remember your name for future daily scores. You can change it later in Settings."
        defaultValue={prefs.playerName}
        onSubmit={async name => {
          setNameModalVisible(false);
          const finalName = name || 'Anon';
          setPref('playerName', name);
          const r = pendingDailyRef.current;
          if (r)
            await submitScore({
              name: finalName,
              timeMs: r.timeMs,
              date: todayISO(),
              game: 'mahjong',
            });
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
        accent={colors.mahjong}
        title={state.outcome === 'won' ? 'Board cleared!' : 'No more moves'}
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
        onSecondary={
          mode.kind === 'random'
            ? () => {
                setResultVisible(false);
                navigation.goBack();
              }
            : undefined
        }
      />
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card depth={0} radius={14} style={styles.stat}>
      <Eyebrow style={{ fontSize: 10, letterSpacing: 0.5 }}>{label}</Eyebrow>
      <Display style={{ fontSize: 19, fontVariant: ['tabular-nums'] }}>{value}</Display>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingTop: 8, gap: 14 },
  statsRow: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 7 },
  table: { overflow: 'hidden' },
  toastSlot: { height: 34, alignItems: 'center', justifyContent: 'center' },
  toast: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999 },
  actionRow: { flexDirection: 'row', gap: 10 },
});
