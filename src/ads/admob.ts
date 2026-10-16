// AdMob bootstrap: consent (UMP) → iOS tracking prompt → SDK init.
//
// The native module only exists in real builds, so it is loaded lazily and
// everything is a no-op in Expo Go.
//
// If consent or init fails (eg. offline on first launch) the next call, or
// the app coming back to the foreground, tries again.

import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import type { AdsConsentInfo } from 'react-native-google-mobile-ads';
import { isExpoGo } from '@/core/runtime';
import { createEmitter } from '@/core/events';
import { applyConsent, type AnalyticsConsent } from '@/analytics/analytics';
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

export const onAdsStateChange = changed.on;

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

const DENIED: AnalyticsConsent = {
  analytics_storage: false,
  ad_storage: false,
  ad_user_data: false,
  ad_personalization: false,
};

/** Maps the UMP (IAB TCF) choices onto Google Consent Mode for analytics. */
async function syncAnalyticsConsent(ads: AdsModule, info: AdsConsentInfo): Promise<void> {
  const { AdsConsent, AdsConsentStatus } = ads;
  if (info.status === AdsConsentStatus.NOT_REQUIRED) {
    applyConsent({
      analytics_storage: true,
      ad_storage: true,
      ad_user_data: true,
      ad_personalization: true,
    });
    return;
  }
  if (info.status !== AdsConsentStatus.OBTAINED) {
    applyConsent(DENIED);
    return;
  }
  const c = await AdsConsent.getUserChoices().catch(() => null);
  if (!c) {
    applyConsent(DENIED);
    return;
  }
  applyConsent({
    analytics_storage: c.storeAndAccessInformationOnDevice && c.measureContentPerformance,
    ad_storage: c.storeAndAccessInformationOnDevice,
    ad_user_data: c.storeAndAccessInformationOnDevice && c.measureAdPerformance,
    ad_personalization: c.createAPersonalisedAdsProfile && c.selectPersonalisedAds,
  });
}

/** Gathers consent and initializes the SDK; resolves true when ads may be requested. */
async function gatherAndInit(ads: AdsModule): Promise<boolean> {
  const { AdsConsent, AdsConsentPrivacyOptionsRequirementStatus, MaxAdContentRating } = ads;
  let info: AdsConsentInfo | null;
  try {
    // Shows Google's consent form when the user's region requires it.
    info = await AdsConsent.gatherConsent();
  } catch {
    // Consent service unreachable: use what was stored last time.
    info = await AdsConsent.getConsentInfo().catch(() => null);
  }
  if (!info) return false;
  setState({
    privacyOptionsRequired:
      info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
  });
  await syncAnalyticsConsent(ads, info);
  if (!info.canRequestAds) return false;

  await requestTrackingIfNeeded();
  const mobileAds = ads.default;
  await mobileAds().setRequestConfiguration({
    maxAdContentRating: MaxAdContentRating.PG,
    tagForChildDirectedTreatment: false,
    tagForUnderAgeOfConsent: false,
  });
  await mobileAds().initialize();
  return true;
}

let started: Promise<void> | null = null;
let retryOnForeground = false;

/**
 * Gathers consent and initializes AdMob once. Safe to call repeatedly: after
 * a failure the next call (or returning to the app) tries again.
 */
export function startAds(): Promise<void> {
  const ads = adsModule;
  if (!ads) return Promise.resolve();
  if (!retryOnForeground) {
    retryOnForeground = true;
    AppState.addEventListener('change', s => {
      if (s === 'active' && !state.ready) startAds();
    });
  }
  if (started) return started;
  const attempt = gatherAndInit(ads)
    // Ads failing must never break the app.
    .catch(() => false)
    .then(ok => {
      if (ok) setState({ ready: true });
      else if (started === attempt) started = null;
    });
  started = attempt;
  return attempt;
}

/** Re-opens the consent form so users can change their choice. */
export async function showPrivacyOptions(): Promise<void> {
  const ads = adsModule;
  if (!ads) return;
  const info = await ads.AdsConsent.showPrivacyOptionsForm();
  await syncAnalyticsConsent(ads, info);
  // A user who declined before may have just allowed ads.
  if (info.canRequestAds && !state.ready) await startAds();
}
