import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useEntitlements } from '@/iap/EntitlementsProvider';
import { adUnitId } from './config';
import { adsModule, useAdsState } from './admob';

// Anchored adaptive banner at the bottom of the screen. Renders nothing until
// consent is gathered, for paying users, in Expo Go, or when the build has no
// banner unit configured.
export function AdBanner() {
  const { colors } = useTheme();
  const { adsRemoved } = useEntitlements();
  const { ready } = useAdsState();
  const [failed, setFailed] = useState(false);
  const unit = adUnitId('banner');

  if (!adsModule || !ready || adsRemoved || !unit || failed) return null;
  const { BannerAd, BannerAdSize } = adsModule;

  return (
    <View style={[styles.banner, { backgroundColor: colors.surfaceAlt, borderColor: colors.ink }]}>
      <BannerAd
        unitId={unit}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 2,
  },
});
