import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/fonts';
import { Body, Card, Display, Eyebrow, IconButton, ScreenHeader, ToolButton } from '@/ui/kit';
import { formatClock, formatTime } from '@/core/format';
import { todayISO } from '@/core/date';
import { MahjongBoard } from '@/games/mahjong/MahjongBoard';
import { freeTiles } from '@/games/mahjong/engine';
import { mahjongRepository } from '@/games/mahjong/persistence';
import {
  createMahjongGame,
  elapsedMs,
  isResumable,
  restoreSnapshot,
  selectTile,
  shuffleRemaining as shuffleState,
  snapshotOf,
  takeHint,
  type MahjongSnapshot,
} from '@/games/mahjong/session';
import type { MahjongMode, MahjongState } from '@/games/mahjong/types';
import { useFinishFlow } from '@/games/shared/useFinishFlow';
import { useNow } from '@/games/shared/useNow';
import { useToast } from '@/games/shared/useToast';
import { useUndoHistory } from '@/games/shared/useUndoHistory';
import { AdBanner } from '@/ads/AdBanner';
import { useFeedback } from '@/feedback/useFeedback';
import { ResultModal } from '@/components/ResultModal';
import { NameInputModal } from '@/components/NameInputModal';
import { Onboarding } from '@/components/Onboarding';
import { MAHJONG_ONBOARDING } from '@/onboarding/steps';
import { useOnboarding } from '@/onboarding/useOnboarding';

interface Props {
  mode: MahjongMode;
}

export function MahjongScreen({ mode }: Props) {
  const { colors, isDark } = useTheme();
  const fb = useFeedback();
  const navigation = useNavigation();
  const onboarding = useOnboarding('mahjong');
  const finishFlow = useFinishFlow('mahjong', mode.kind);
  const history = useUndoHistory<MahjongSnapshot>();
  const { message: toast, show: showToast } = useToast(1500);
  const { finish } = finishFlow;

  const [state, setState] = useState<MahjongState | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hintIds, setHintIds] = useState<Set<number>>(() => new Set());
  const finishHandled = useRef(false);
  const now = useNow(state?.outcome === 'playing');

  const resetUi = () => {
    setSelectedId(null);
    setHintIds(new Set());
    history.clear();
  };

  // Load or create on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await mahjongRepository.load(mode);
      if (cancelled) return;
      const next =
        saved && isResumable(saved, mode, Date.now()) ? saved : createMahjongGame(mode, Date.now());
      setState(next);
      finishHandled.current = next.outcome !== 'playing';
      resetUi();
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  // Persist on every change.
  useEffect(() => {
    if (state) mahjongRepository.save(mode, state);
  }, [mode, state]);

  const onSelect = (id: number) => {
    if (!state) return;
    const result = selectTile(state, selectedId, id, Date.now());
    if (!result) return;
    setHintIds(new Set());
    if (result.matched) history.push(snapshotOf(state));
    setState(result.state);
    setSelectedId(result.selectedId);
    fb.play(result.cues);
    if (result.toast) showToast(result.toast);
  };

  const undo = () => {
    if (!state || state.outcome !== 'playing') return;
    const last = history.pop();
    if (!last) return;
    setState(restoreSnapshot(state, last));
    setSelectedId(null);
    setHintIds(new Set());
  };

  const useHint = () => {
    if (!state) return;
    const result = takeHint(state);
    if (!result) return;
    if (!result.ok) {
      showToast(result.toast);
      return;
    }
    history.push(snapshotOf(state));
    setState(result.state);
    setHintIds(new Set(result.pair));
  };

  const shuffleRemaining = () => {
    if (!state) return;
    const next = shuffleState(state);
    if (!next) return;
    history.push(snapshotOf(state));
    setState(next);
    setSelectedId(null);
    setHintIds(new Set());
  };

  // Run the shared finish flow once when the game ends.
  useEffect(() => {
    if (!state || state.outcome === 'playing' || finishHandled.current) return;
    finishHandled.current = true;
    finish({
      won: state.outcome === 'won',
      timeMs: elapsedMs(state, Date.now()),
      score: state.score,
    });
  }, [state, finish]);

  const startNewGame = async () => {
    await mahjongRepository.clear(mode);
    setState(createMahjongGame(mode, Date.now()));
    resetUi();
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

  const elapsed = elapsedMs(state, now);

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
            disabled={!history.canUndo || state.outcome !== 'playing'}
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

      <NameInputModal {...finishFlow.nameModal} />

      <ResultModal
        visible={finishFlow.resultVisible}
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
          finishFlow.hideResult();
          if (mode.kind === 'random') startNewGame();
          else navigation.goBack();
        }}
        secondaryLabel={mode.kind === 'random' ? 'Back to menu' : undefined}
        onSecondary={
          mode.kind === 'random'
            ? () => {
                finishFlow.hideResult();
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
