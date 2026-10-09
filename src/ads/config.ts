import { Platform } from 'react-native';

// Master switch for advertising. When off, no ad UI is shown and the
// "Remove ads" purchase is hidden (selling ad removal without ads would be
// misleading).
//
// v1 ships without ads. To turn them on (see README → AdMob):
//   1. set this to true
//   2. remove "react-native-google-mobile-ads" from expo.autolinking.exclude in package.json
//   3. add the plugin config from docs/admob-plugin.json back to app.json "plugins"
//      (with your real AdMob app IDs), then make a new build
export const ADS_ENABLED = false;

export type AdKind = 'banner' | 'interstitial';

// Google's public test units — always used in development so we never click
// our own live ads (which can get the AdMob account suspended).
const TEST_UNITS: Record<AdKind, Record<'ios' | 'android', string>> = {
  banner: {
    ios: 'ca-app-pub-3940256099942544/2435281174',
    android: 'ca-app-pub-3940256099942544/9214589741',
  },
  interstitial: {
    ios: 'ca-app-pub-3940256099942544/4411468910',
    android: 'ca-app-pub-3940256099942544/1033173712',
  },
};

// Production units come from EAS environment variables. Inline references so
// Expo can substitute them at build time.
const PROD_UNITS: Record<AdKind, Record<'ios' | 'android', string | undefined>> = {
  banner: {
    ios: process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS,
    android: process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID,
  },
  interstitial: {
    ios: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS,
    android: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID,
  },
};

/**
 * The ad unit to request, or null when this build has none configured
 * (a release build without production IDs simply shows no ads).
 */
export function adUnitId(kind: AdKind): string | null {
  const os = Platform.OS === 'ios' ? 'ios' : 'android';
  if (__DEV__) return TEST_UNITS[kind][os];
  return PROD_UNITS[kind][os] || null;
}
