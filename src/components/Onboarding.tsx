import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';

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
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.accent }]}>
            <Ionicons name={step.icon} size={32} color="#fff" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{step.title}</Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>{step.body}</Text>

          <View style={styles.dots}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === index ? colors.accent : colors.border,
                    width: i === index ? 18 : 6,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            {index > 0 && (
              <Pressable
                onPress={() => setIndex(i => i - 1)}
                style={[styles.btn, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.text }}>Back</Text>
              </Pressable>
            )}
            <Pressable
              onPress={next}
              style={[styles.btn, { backgroundColor: colors.accent, borderColor: colors.accent }]}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                {isLast ? "Let's play" : 'Next'}
              </Text>
            </Pressable>
          </View>

          <Pressable onPress={onClose} style={styles.skip}>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>Skip</Text>
          </Pressable>
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
    gap: 8,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  body: { fontSize: 14, textAlign: 'center', paddingHorizontal: 8, lineHeight: 20 },
  dots: { flexDirection: 'row', gap: 6, marginVertical: 14 },
  dot: { height: 6, borderRadius: 3 },
  actions: { flexDirection: 'row', gap: 8, width: '100%' },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  skip: { marginTop: 6 },
});
