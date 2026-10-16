// Interstitial cadence: one ad per SHOW_EVERY finished puzzles, only for
// non-paying users, shown when the player leaves the result screen (a natural
// break, never mid-tap).
//
// The ad is preloaded so it appears instantly. A failed load retries with
// backoff, a stale ad (AdMob ads expire after an hour) is replaced, and the
// puzzle counter only resets once an ad was actually shown, so a due ad that
// wasn't ready is offered again after the next puzzle.
import { AppState } from 'react-native';
import type { InterstitialAd, PaidEvent } from 'react-native-google-mobile-ads';
import { getJSON, setJSON } from '@/storage/storage';
import { track } from '@/analytics/analytics';
import { ADS_ENABLED, adUnitId } from './config';
import { adsModule, getAdsState, onAdsStateChange } from './admob';

const KEY = 'ads.puzzlesSinceLastInterstitial';
export const SHOW_EVERY = 3;
const MAX_AGE_MS = 55 * 60 * 1000;
const RETRY_DELAYS_MS = [5_000, 15_000, 60_000, 5 * 60_000];
/** Give up waiting when the ad hasn't opened this long after show(). */
const OPEN_TIMEOUT_MS = 5_000;

const FORMAT = 'interstitial';

interface Slot {
  ad: InterstitialAd;
  /** When the ad finished loading; null while loading. */
  loadedAt: number | null;
  /** Removes every listener attached to the ad. */
  detach: () => void;
}

let slot: Slot | null = null;
let showing = false;
let failures = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

function isFresh(s: Slot | null): s is Slot & { loadedAt: number } {
  return !!s && s.loadedAt != null && Date.now() - s.loadedAt < MAX_AGE_MS;
}

function scheduleRetry() {
  if (retryTimer) return;
  const delay = RETRY_DELAYS_MS[Math.min(failures, RETRY_DELAYS_MS.length) - 1] ?? 5_000;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    preloadInterstitial();
  }, delay);
}

/** Creates and loads the next interstitial in the background (if needed). */
export function preloadInterstitial(): void {
  const ads = adsModule;
  const unit = adUnitId('interstitial');
  if (!ads || !unit || !getAdsState().ready || showing) return;
  if (slot && (slot.loadedAt == null || isFresh(slot))) return; // loading, or ready to show

  slot?.detach();
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  const { AdEventType } = ads;
  const ad = ads.InterstitialAd.createForAdRequest(unit);
  const offs = [
    ad.addAdEventListener(AdEventType.LOADED, () => {
      if (slot?.ad !== ad) return;
      slot.loadedAt = Date.now();
      failures = 0;
      track('ad_loaded', { ad_format: FORMAT });
    }),
    ad.addAdEventListener(AdEventType.ERROR, error => {
      // Errors while showing are handled by showInterstitialIfDue.
      if (slot?.ad !== ad) return;
      slot.detach();
      slot = null;
      failures += 1;
      track('ad_failed', { ad_format: FORMAT, error_code: errorCode(error) });
      scheduleRetry();
    }),
    // The SDK types this payload as undefined, but it carries the PaidEvent.
    ad.addAdEventListener(AdEventType.PAID, (payload: unknown) => {
      const paid = payload as PaidEvent | undefined;
      if (!paid) return;
      track('ad_paid', {
        ad_format: FORMAT,
        value: paid.value,
        currency: paid.currency,
        precision: paid.precision,
      });
    }),
  ];
  slot = { ad, loadedAt: null, detach: () => offs.forEach(off => off()) };
  track('ad_request', { ad_format: FORMAT });
  ad.load();
}

function errorCode(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' ? code : 'unknown';
}

let initialized = false;

/** Keeps an interstitial loaded: once ads are ready and whenever the app returns. */
export function initInterstitials(): void {
  if (initialized || !adsModule) return;
  initialized = true;
  onAdsStateChange(s => {
    if (s.ready) preloadInterstitial();
  });
  AppState.addEventListener('change', s => {
    if (s === 'active') preloadInterstitial();
  });
  preloadInterstitial();
}

/** Counts a finished puzzle towards the next interstitial. */
export async function countFinishedPuzzle(): Promise<void> {
  const n = (await getJSON<number>(KEY)) ?? 0;
  await setJSON(KEY, n + 1);
}

/** True when enough puzzles were finished since the last interstitial. */
export async function interstitialDue(adsRemoved: boolean): Promise<boolean> {
  if (!ADS_ENABLED || adsRemoved || !adsModule) return false;
  return ((await getJSON<number>(KEY)) ?? 0) >= SHOW_EVERY;
}

/**
 * Shows the interstitial when one is due and loaded; resolves once it closes
 * (or right away when nothing is shown). Resolves true when an ad was shown.
 */
export async function showInterstitialIfDue(adsRemoved: boolean): Promise<boolean> {
  if (showing || !(await interstitialDue(adsRemoved)) || !adsModule) return false;

  const current = slot;
  const ready = isFresh(current);
  track('ad_opportunity', { ad_format: FORMAT, ready });
  if (!ready) {
    preloadInterstitial(); // the counter stays due: we try again next puzzle
    return false;
  }

  slot = null;
  showing = true;
  const { AdEventType } = adsModule;
  const shown = await new Promise<boolean>(resolve => {
    let opened = false;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      offs.forEach(off => off());
      resolve(opened);
    };
    const timeout = setTimeout(() => {
      if (!opened) finish();
    }, OPEN_TIMEOUT_MS);
    const offs = [
      current.ad.addAdEventListener(AdEventType.OPENED, () => {
        opened = true;
        track('ad_shown', { ad_format: FORMAT });
        setJSON(KEY, 0).catch(() => {});
      }),
      current.ad.addAdEventListener(AdEventType.CLOSED, () => {
        track('ad_closed', { ad_format: FORMAT });
        finish();
      }),
      current.ad.addAdEventListener(AdEventType.ERROR, finish),
    ];
    current.ad.show().catch(finish);
  });
  // Keep the PAID listener until the ad is gone, then drop everything.
  current.detach();
  showing = false;
  preloadInterstitial();
  return shown;
}
