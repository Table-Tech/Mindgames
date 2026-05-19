import { Audio } from 'expo-av';

// Lightweight sound service. Drop .mp3 / .wav files into assets/sounds/ with
// the keys below and they will be loaded on first use. If a file is missing
// the call is a no-op so the rest of the app is unaffected.
//
// Suggested files (any short, royalty-free SFX):
//   assets/sounds/tap.mp3
//   assets/sounds/correct.mp3
//   assets/sounds/wrong.mp3
//   assets/sounds/win.mp3
//   assets/sounds/lose.mp3

export type SoundKey = 'tap' | 'correct' | 'wrong' | 'win' | 'lose';

// To wire real assets, uncomment the requires below.
// TODO(sounds): add actual audio files and uncomment these requires.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SOURCES: Record<SoundKey, any | null> = {
  tap: null,     // require('../../assets/sounds/tap.mp3'),
  correct: null, // require('../../assets/sounds/correct.mp3'),
  wrong: null,   // require('../../assets/sounds/wrong.mp3'),
  win: null,     // require('../../assets/sounds/win.mp3'),
  lose: null,    // require('../../assets/sounds/lose.mp3'),
};

const cache = new Map<SoundKey, Audio.Sound>();
let audioModeConfigured = false;

async function ensureAudioMode() {
  if (audioModeConfigured) return;
  audioModeConfigured = true;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch {
    // silent on platforms that don't support this
  }
}

export async function playSound(key: SoundKey, enabled: boolean): Promise<void> {
  if (!enabled) return;
  const source = SOURCES[key];
  if (!source) return; // no asset wired yet

  try {
    await ensureAudioMode();
    let sound = cache.get(key);
    if (!sound) {
      const { sound: s } = await Audio.Sound.createAsync(source);
      cache.set(key, s);
      sound = s;
    }
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // Audio errors are non-fatal; swallow.
  }
}

export async function unloadAllSounds(): Promise<void> {
  for (const s of cache.values()) {
    try { await s.unloadAsync(); } catch { /* ignore */ }
  }
  cache.clear();
}
