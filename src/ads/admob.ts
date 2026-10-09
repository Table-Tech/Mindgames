// AdMob bootstrap: consent (UMP) → iOS tracking prompt → SDK init.
//
// The native module only exists in real builds, so it is loaded lazily and
// everything is a no-op in Expo Go.

import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { isExpoGo } from '@/core/runtime';
import { createEmitter } from '@/core/events';
import { ADS_ENABLED } from './config';

type AdsModule = typeof import('react-native-google-mobile-ads');

export const adsModule: AdsModule | null =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ADS_ENABLED && !isExpoGo ? require('react-native-google-mobile-ads') : null;

export interface AdsState {
  /** Consent gathered and SDK initialized: ads may be requested. */
  ready: boolean;
  /** EEA/UK users must be able to reopen the consent form (Settings). */
  privacyOptionsRequired: boolean;
}

let state: AdsState = { ready: false, privacyOptionsRequired: false };
const changed = createEmitter<AdsState>();

function setState(next: Partial<AdsState>) {
  state = { ...state, ...next };
  changed.emit(state);
}

export function getAdsState(): AdsState {
  return state;
}

export function useAdsState(): AdsState {
  const [s, set] = useState(state);
  useEffect(() => changed.on(set), []);
  return s;
}

async function requestTrackingIfNeeded() {
  if (Platform.OS !== 'ios') return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const tt: typeof import('expo-tracking-transparency') = require('expo-tracking-transparency');
    const { status } = await tt.getTrackingPermissionsAsync();
    if (status === 'undetermined') await tt.requestTrackingPermissionsAsync();
  } catch {
    // Not fatal: ads fall back to non-personalized.
  }
}

let started: Promise<void> | null = null;

/** Gathers consent and initializes AdMob once. Safe to call repeatedly. */
export function startAds(): Promise<void> {
  if (!adsModule) return Promise.resolve();
  if (started) return started;
  const { AdsConsent, AdsConsentPrivacyOptionsRequirementStatus, MaxAdContentRating } = adsModule;
  const mobileAds = adsModule.default;

  started = (async () => {
    let canRequestAds = false;
    try {
      // Shows Google's consent form when the user's region requires it.
      const info = await AdsConsent.gatherConsent();
      canRequestAds = info.canRequestAds;
      setState({
        privacyOptionsRequired:
          info.privacyOptionsRequirementStatus ===
          AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
      });
    } catch {
      // Consent service unreachable: use what was stored last time.
      canRequestAds = (await AdsConsent.getConsentInfo().catch(() => null))?.canRequestAds ?? false;
    }
    if (!canRequestAds) return;

    await requestTrackingIfNeeded();
    await mobileAds().setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.PG,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });
    await mobileAds().initialize();
    setState({ ready: true });
  })().catch(() => {
    // Ads failing must never break the app.
  });
  return started;
}

/** Re-opens the consent form so users can change their choice. */
export async function showPrivacyOptions(): Promise<void> {
  if (!adsModule) return;
  await adsModule.AdsConsent.showPrivacyOptionsForm();
}
