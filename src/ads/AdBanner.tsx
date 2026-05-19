import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useEntitlements } from '@/iap/EntitlementsProvider';

// TODO(ads): replace this stub with `react-native-google-mobile-ads`.
//   yarn add react-native-google-mobile-ads
//   - Configure AdMob app ID in app.json under expo.plugins.
//   - Render <BannerAd unitId={AdUnit.banner} size={BannerAdSize.ADAPTIVE_BANNER}/>
// This stub keeps the layout slot reserved so the UI looks identical with/without ads.
export function AdBanner() {
  const { colors } = useTheme();
  const { adsRemoved } = useEntitlements();
  if (adsRemoved) return null;
  return (
    <View style={[styles.banner, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      <Text style={{ color: colors.textMuted, fontSize: 12 }}>Ad slot (AdMob banner)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
