import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useEntitlements } from '@/iap/EntitlementsProvider';
import { track } from '@/analytics/analytics';
import { adUnitId } from './config';
import { adsModule, useAdsState } from './admob';

// After a failed load (no fill, offline) the banner hides and tries again
// after a growing delay, so one bad request doesn't cost the whole session.
const RETRY_DELAYS_MS = [15_000, 30_000, 60_000, 120_000];

// Anchored adaptive banner at the bottom of the screen. Renders nothing until
// consent is gathered, while purchases are still loading, for paying users,
// in Expo Go, or when the build has no banner unit configured.
export function AdBanner() {
  const { colors } = useTheme();
  const { adsRemoved, loading } = useEntitlements();
  const { ready } = useAdsState();
  const [failures, setFailures] = useState(0);
  const [hidden, setHidden] = useState(false);
  const unit = adUnitId('banner');

  useEffect(() => {
    if (!hidden) return;
    const delay = RETRY_DELAYS_MS[Math.min(failures, RETRY_DELAYS_MS.length) - 1];
    const t = setTimeout(() => setHidden(false), delay);
    return () => clearTimeout(t);
  }, [hidden, failures]);

  if (!adsModule || !ready || loading || adsRemoved || !unit || hidden) return null;
  const { BannerAd, BannerAdSize } = adsModule;

  return (
    <View style={[styles.banner, { backgroundColor: colors.surfaceAlt, borderColor: colors.ink }]}>
      <BannerAd
        unitId={unit}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={() => setFailures(0)}
        onAdFailedToLoad={() => {
          setFailures(f => f + 1);
          setHidden(true);
        }}
        onPaid={paid =>
          track('ad_paid', {
            ad_format: 'banner',
            value: paid.value,
            currency: paid.currency,
            precision: paid.precision,
          })
        }
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
