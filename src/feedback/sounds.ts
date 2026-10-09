import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';

// Lightweight sound service. Short synthesized effects live in
// assets/sounds/ (regenerate with `node scripts/generate-assets.mjs`, or drop
// in your own files with the same names).

export type SoundKey = 'tap' | 'correct' | 'wrong' | 'win' | 'lose';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SOURCES: Record<SoundKey, number> = {
  tap: require('../../assets/sounds/tap.wav'),
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  win: require('../../assets/sounds/win.wav'),
  lose: require('../../assets/sounds/lose.wav'),
};

const cache = new Map<SoundKey, AudioPlayer>();
let audioModeConfigured = false;

async function ensureAudioMode() {
  if (audioModeConfigured) return;
  audioModeConfigured = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
      interruptionMode: 'duckOthers',
    });
  } catch {
    // silent on platforms that don't support this
  }
}

export async function playSound(key: SoundKey, enabled: boolean): Promise<void> {
  if (!enabled) return;
  const source = SOURCES[key];

  try {
    await ensureAudioMode();
    let player = cache.get(key);
    if (!player) {
      player = createAudioPlayer(source);
      cache.set(key, player);
    }
    await player.seekTo(0);
    player.play();
  } catch {
    // Audio errors are non-fatal; swallow.
  }
}

export async function unloadAllSounds(): Promise<void> {
  for (const p of cache.values()) {
    try {
      p.remove();
    } catch {
      /* ignore */
    }
  }
  cache.clear();
}
