import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/fonts';
import { Body, Card, Chunky, Display, OUTLINE } from '@/ui/kit';

export interface OnboardingStep {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

interface Props {
  visible: boolean;
  steps: OnboardingStep[];
  onClose: () => void;
}

export function Onboarding({ visible, steps, onClose }: Props) {
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const isLast = index === steps.length - 1;
  const iconColors = [colors.sudoku, colors.wordle, colors.mahjong, colors.pink];
  const iconBg = iconColors[index % iconColors.length];

  const next = () => {
    if (isLast) {
      setIndex(0);
      onClose();
    } else {
      setIndex(i => i + 1);
    }
  };

  if (!step) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Card radius={26} depth={6} style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: iconBg, borderColor: colors.ink }]}>
            <Ionicons
              name={step.icon}
              size={34}
              color={iconBg === colors.sudoku ? '#FFFFFF' : '#1D1A33'}
            />
          </View>
          <Display style={styles.title}>{step.title}</Display>
          <Body style={[styles.body, { color: colors.textMuted }]}>{step.body}</Body>

          <View style={styles.dots}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    borderColor: colors.ink,
                    backgroundColor: i === index ? colors.ink : colors.surface,
                    width: i === index ? 22 : 10,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            {index > 0 && (
              <Chunky
                onPress={() => setIndex(i => i - 1)}
                style={{ flex: 1 }}
                contentStyle={styles.btn}
              >
                <Text style={[styles.btnText, { color: colors.text }]}>Back</Text>
              </Chunky>
            )}
            <Chunky
              onPress={next}
              color={colors.sudoku}
              style={{ flex: 1.4 }}
              contentStyle={styles.btn}
            >
              <Text style={[styles.btnText, { color: '#FFFFFF' }]}>
                {isLast ? "Let's play" : 'Next'}
              </Text>
            </Chunky>
          </View>

          <Pressable onPress={onClose} style={styles.skip} accessibilityRole="button">
            <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
          </Pressable>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(29,26,51,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: { width: '100%', maxWidth: 380, padding: 24, alignItems: 'center', gap: 8 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    borderWidth: OUTLINE + 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    transform: [{ rotate: '-6deg' }],
  },
  title: { fontSize: 26, textAlign: 'center' },
  body: { fontSize: 15, textAlign: 'center', paddingHorizontal: 8, lineHeight: 21 },
  dots: { flexDirection: 'row', gap: 6, marginVertical: 14 },
  dot: { height: 10, borderRadius: 5, borderWidth: OUTLINE },
  actions: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  btn: { height: 50, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: fonts.displaySemi, fontSize: 18 },
  skip: { marginTop: 6, padding: 8 },
  skipText: { fontFamily: fonts.bodyHeavy, fontSize: 14 },
});
