import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/fonts';
import { Body, Card, Chunky, Display, Eyebrow, OUTLINE } from '@/ui/kit';
import { letterColors } from '@/games/wordle/WordleGrid';
import type { Guess } from '@/games/wordle/types';
import { Confetti } from './Confetti';
import { captureRef } from 'react-native-view-shot';
import { shareResult, withStreak, type ResultShare } from '@/share/share';
import { CARD_HEIGHT, CARD_WIDTH, ShareCard } from '@/share/ShareCard';

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
  /** The game's signature color; used for the win card. */
  accent?: string;
  /** When set, shows the colored guess grid (Wordle). */
  wordleGuesses?: Guess[];
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onDismiss?: () => void;
}

const INK = '#1D1A33';

export function ResultModal({
  visible,
  won,
  title,
  subtitle,
  stats,
  share,
  accent,
  wordleGuesses,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  onDismiss,
}: Props) {
  const { colors } = useTheme();
  const cardRef = useRef<View>(null);
  const [card, setCard] = useState<ResultShare | null>(null);
  const [sharing, setSharing] = useState(false);

  // Prepare the share image (with the streak filled in) while the modal is open.
  useEffect(() => {
    if (!visible || !share) return;
    let live = true;
    withStreak(share)
      .catch(() => share)
      .then(r => live && setCard(r));
    return () => {
      live = false;
    };
  }, [visible, share]);

  const onShare = async () => {
    if (!share || sharing) return;
    setSharing(true);
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        width: 1080,
        height: 1350,
        result: 'tmpfile',
      }).catch(() => null);
      await shareResult(card ?? share, uri);
    } finally {
      setSharing(false);
    }
  };
  const cardColor = won ? (accent ?? colors.sudoku) : colors.surface;
  // Blue is the only signature color dark enough for white text.
  const onCard = won && cardColor === colors.sudoku ? '#FFFFFF' : won ? INK : colors.text;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        {card && (
          // Rendered off-screen only so it can be captured as an image.
          <View style={styles.offscreen} pointerEvents="none">
            <View ref={cardRef} collapsable={false}>
              <ShareCard result={card} />
            </View>
          </View>
        )}
        {won && (
          <Confetti
            colors={[colors.sudoku, colors.wordle, colors.mahjong, colors.pink, '#FFFFFF']}
          />
        )}
        <Card color={cardColor} radius={26} depth={6} style={styles.card}>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: won ? colors.sunflower : colors.surfaceAlt,
                borderColor: colors.ink,
              },
            ]}
          >
            <Ionicons
              name={won ? 'trophy' : 'heart-dislike-outline'}
              size={34}
              color={won ? INK : colors.text}
            />
          </View>
          <Display style={[styles.title, { color: onCard }]}>{title}</Display>
          {subtitle && (
            <Body style={[styles.subtitle, { color: onCard, opacity: won ? 0.9 : 1 }]}>
              {subtitle}
            </Body>
          )}

          {wordleGuesses && wordleGuesses.length > 0 && (
            <View style={styles.guessGrid}>
              {wordleGuesses.map((g, gi) => (
                <View key={gi} style={{ flexDirection: 'row', gap: 4 }}>
                  {g.states.map((s, si) => (
                    <View
                      key={si}
                      style={[
                        styles.guessSq,
                        {
                          borderColor: colors.ink,
                          backgroundColor: letterColors(s, colors)?.bg ?? colors.surface,
                        },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          )}

          {stats && stats.length > 0 && (
            <View style={styles.statsRow}>
              {stats.map(s => (
                <View
                  key={s.label}
                  style={[
                    styles.stat,
                    { backgroundColor: colors.surface, borderColor: colors.ink },
                  ]}
                >
                  <Eyebrow style={{ fontSize: 10, color: colors.textMuted }}>{s.label}</Eyebrow>
                  <Display style={{ fontSize: 22, fontVariant: ['tabular-nums'] }}>
                    {s.value}
                  </Display>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <Chunky
              onPress={onPrimary}
              color={won ? colors.sunflower : colors.pink}
              contentStyle={styles.bigBtn}
            >
              <Text style={styles.bigBtnText}>{primaryLabel}</Text>
            </Chunky>
            {share && (
              <Chunky
                onPress={onShare}
                disabled={sharing}
                contentStyle={[styles.bigBtn, styles.row]}
              >
                <Ionicons name="share-outline" size={18} color={colors.text} />
                <Text style={[styles.bigBtnText, { color: colors.text, fontSize: 17 }]}>
                  Share result
                </Text>
              </Chunky>
            )}
            {secondaryLabel && onSecondary && (
              <Pressable onPress={onSecondary} style={styles.link} accessibilityRole="button">
                <Text style={[styles.linkText, { color: onCard }]}>{secondaryLabel}</Text>
              </Pressable>
            )}
          </View>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    left: -CARD_WIDTH * 3,
    top: 0,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(29,26,51,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: { width: '100%', maxWidth: 380, padding: 24, alignItems: 'center', gap: 8 },
  iconWrap: {
    width: 70,
    height: 70,
    borderRadius: 22,
    borderWidth: OUTLINE + 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    transform: [{ rotate: '-8deg' }],
  },
  title: { fontSize: 32, textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center' },
  guessGrid: { gap: 4, marginTop: 8 },
  guessSq: { width: 22, height: 22, borderRadius: 5, borderWidth: OUTLINE },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignSelf: 'stretch' },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: OUTLINE,
  },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 14 },
  bigBtn: { height: 52, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 8 },
  bigBtnText: { fontFamily: fonts.displaySemi, fontSize: 19, color: INK },
  link: { alignItems: 'center', paddingVertical: 10 },
  linkText: { fontFamily: fonts.bodyHeavy, fontSize: 15, textDecorationLine: 'underline' },
});
