// Interstitial cadence: show after every N completed puzzles, only for
// non-paying users. The ad is preloaded so it appears instantly.
import { getJSON, setJSON } from '@/storage/storage';
import { ADS_ENABLED, adUnitId } from './config';
import { adsModule, getAdsState } from './admob';
import type { InterstitialAd } from 'react-native-google-mobile-ads';

const KEY = 'ads.puzzlesSinceLastInterstitial';
const SHOW_EVERY = 3;

let ad: InterstitialAd | null = null;

/** Creates and loads the next interstitial in the background. */
export function preloadInterstitial(): void {
  const unit = adUnitId('interstitial');
  if (!adsModule || !unit || !getAdsState().ready || ad) return;
  ad = adsModule.InterstitialAd.createForAdRequest(unit);
  const { AdEventType } = adsModule;
  ad.addAdEventListener(AdEventType.ERROR, () => {
    ad = null; // try again next time
  });
  ad.load();
}

/** Counts a finished puzzle and returns true when an interstitial is due. */
export async function maybeShowInterstitial(adsRemoved: boolean): Promise<boolean> {
  if (!ADS_ENABLED || adsRemoved) return false;
  const n = (await getJSON<number>(KEY)) ?? 0;
  const next = n + 1;
  if (next >= SHOW_EVERY) {
    await setJSON(KEY, 0);
    return true;
  }
  await setJSON(KEY, next);
  return false;
}

/**
 * Shows the preloaded interstitial and resolves when it closes, so the result
 * screen appears after the ad. Resolves immediately when nothing is loaded.
 */
export function showInterstitial(): Promise<void> {
  const current = ad;
  if (!adsModule || !current || !current.loaded) {
    preloadInterstitial();
    return Promise.resolve();
  }
  ad = null;
  const { AdEventType } = adsModule;
  return new Promise(resolve => {
    const done = () => {
      offClosed();
      offError();
      preloadInterstitial();
      resolve();
    };
    const offClosed = current.addAdEventListener(AdEventType.CLOSED, done);
    const offError = current.addAdEventListener(AdEventType.ERROR, done);
    current.show().catch(done);
  });
}
