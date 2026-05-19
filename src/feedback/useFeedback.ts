import { useCallback } from 'react';
import { haptics } from './haptics';
import { playSound, type SoundKey } from './sounds';
import { usePreferences } from '@/prefs/PreferencesProvider';

// Combined haptic + sound helper. Components use this so they don't have to
// know about preferences plumbing.
//
//   const fb = useFeedback();
//   fb.correct();   // light haptic + correct sound
//   fb.win();       // success haptic + win sound

export function useFeedback() {
  const { prefs } = usePreferences();

  const fire = useCallback(
    (haptic: keyof typeof haptics, sound: SoundKey | null) => {
      haptics[haptic](prefs.hapticsEnabled);
      if (sound) playSound(sound, prefs.soundEnabled);
    },
    [prefs.hapticsEnabled, prefs.soundEnabled],
  );

  return {
    tap:     () => fire('selection', 'tap'),
    correct: () => fire('light', 'correct'),
    wrong:   () => fire('warning', 'wrong'),
    win:     () => fire('success', 'win'),
    lose:    () => fire('error', 'lose'),
    select:  () => fire('selection', null),
  };
}
