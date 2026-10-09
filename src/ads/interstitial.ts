// Interstitial cadence: show after every N completed puzzles, only for non-paying users.
// TODO(ads): wire to InterstitialAd from `react-native-google-mobile-ads`:
//   const ad = InterstitialAd.createForAdRequest(unitId);
//   ad.load(); ad.show();
import { getJSON, setJSON } from '@/storage/storage';
import { ADS_ENABLED } from './config';

const KEY = 'ads.puzzlesSinceLastInterstitial';
const SHOW_EVERY = 3;

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

/** Shows the interstitial. No-op until the ads SDK is wired up. */
export async function showInterstitial(): Promise<void> {
  // TODO(ads): load + show the real InterstitialAd here.
}
