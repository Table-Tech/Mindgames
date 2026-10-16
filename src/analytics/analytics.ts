// Product analytics through Google Analytics for Firebase (Android + iOS).
//
// Collection starts with every Consent Mode signal denied (firebase.json) and
// is only opened up once the ad consent flow (src/ads/admob.ts) reports what
// the user allowed. In Expo Go and tests every call is a no-op.
//
// Never send personal data here: no player names, no free text.

import { isExpoGo } from '@/core/runtime';

type AnalyticsModule = typeof import('@react-native-firebase/analytics');

function load(): AnalyticsModule | null {
  if (isExpoGo) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@react-native-firebase/analytics');
  } catch {
    return null;
  }
}

const fb = load();

export type AnalyticsEvent =
  | 'game_end'
  | 'ad_request'
  | 'ad_loaded'
  | 'ad_failed'
  | 'ad_opportunity'
  | 'ad_shown'
  | 'ad_closed'
  | 'ad_paid'
  | 'remove_ads_purchase'
  | 'remove_ads_restore';

/** Event parameters. Booleans are sent as 0/1, undefined values are dropped. */
export type EventParams = Record<string, string | number | boolean | undefined>;

/** Google Consent Mode v2 signals. */
export interface AnalyticsConsent {
  analytics_storage: boolean;
  ad_storage: boolean;
  ad_user_data: boolean;
  ad_personalization: boolean;
}

function clean(params: EventParams): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    out[k] = typeof v === 'boolean' ? (v ? 1 : 0) : v;
  }
  return out;
}

// Analytics must never break the app, so every call swallows its errors.
function run(fn: (m: AnalyticsModule) => Promise<unknown>): void {
  if (!fb) return;
  try {
    fn(fb).catch(() => {});
  } catch {
    // Native module missing or misconfigured.
  }
}

export function track(name: AnalyticsEvent, params: EventParams = {}): void {
  run(m => m.logEvent(m.getAnalytics(), name, clean(params)));
}

export function trackScreen(screen: string): void {
  run(m => m.logScreenView(m.getAnalytics(), { screen_name: screen, screen_class: screen }));
}

export function setUserProperty(name: string, value: string | null): void {
  run(m => m.setUserProperty(m.getAnalytics(), name, value));
}

/** Clears the analytics ID and data stored on this device ("Clear all data"). */
export function resetAnalytics(): void {
  run(m => m.resetAnalyticsData(m.getAnalytics()));
}

export function applyConsent(consent: AnalyticsConsent): void {
  run(m => m.setConsent(m.getAnalytics(), { ...consent }));
}
