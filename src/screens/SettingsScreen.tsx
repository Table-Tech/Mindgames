import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { useEntitlements } from '@/iap/EntitlementsProvider';

export function SettingsScreen() {
  const { colors } = useTheme();
  const { adsRemoved, purchaseRemoveAds, restorePurchases } = useEntitlements();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Remove ads</Text>
        <Text style={{ color: colors.textMuted, marginBottom: 12 }}>
          One-time purchase · €2.99
        </Text>
        {adsRemoved ? (
          <Text style={{ color: colors.accent }}>Purchased — thanks!</Text>
        ) : (
          <Pressable
            onPress={async () => {
              await purchaseRemoveAds();
              Alert.alert('Thank you!', 'Ads have been removed.');
            }}
            style={[styles.btn, { backgroundColor: colors.accent }]}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Buy · €2.99</Text>
          </Pressable>
        )}
        <Pressable onPress={restorePurchases} style={styles.linkRow}>
          <Text style={{ color: colors.textMuted }}>Restore purchases</Text>
        </Pressable>
      </View>

      <Text style={[styles.note, { color: colors.textMuted }]}>
        Theme follows your system (light/dark).
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  title: { fontSize: 24, fontWeight: '700' },
  card: { padding: 16, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  btn: { paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  linkRow: { paddingVertical: 12, alignItems: 'center' },
  note: { fontSize: 12, textAlign: 'center' },
});
