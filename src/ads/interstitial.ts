// Interstitial cadence: show after every N completed puzzles, only for non-paying users.
// TODO(ads): wire to InterstitialAd from `react-native-google-mobile-ads`:
//   const ad = InterstitialAd.createForAdRequest(unitId);
//   ad.load(); ad.show();
import { getJSON, setJSON } from '@/storage/storage';

const KEY = 'ads.puzzlesSinceLastInterstitial';
const SHOW_EVERY = 3;

export async function maybeShowInterstitial(adsRemoved: boolean): Promise<boolean> {
  if (adsRemoved) return false;
  const n = (await getJSON<number>(KEY)) ?? 0;
  const next = n + 1;
  if (next >= SHOW_EVERY) {
    await setJSON(KEY, 0);
    // TODO(ads): replace with real ad.show()
    return true;
  }
  await setJSON(KEY, next);
  return false;
}
