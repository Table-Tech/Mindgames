import { useCallback, useMemo } from 'react';
import { haptics } from './haptics';
import { playSound, type SoundKey } from './sounds';
import { usePreferences } from '@/prefs/PreferencesProvider';
import type { FeedbackCue } from '@/core/game';

// Combined haptic + sound helper. Components use this so they don't have to
// know about preferences plumbing.
//
//   const fb = useFeedback();
//   fb.correct();            // light haptic + correct sound
//   fb.play(['correct', 'win']);  // cues returned by a game session

const CUES: Record<FeedbackCue, { haptic: keyof typeof haptics; sound: SoundKey | null }> = {
  tap: { haptic: 'selection', sound: 'tap' },
  correct: { haptic: 'light', sound: 'correct' },
  wrong: { haptic: 'warning', sound: 'wrong' },
  win: { haptic: 'success', sound: 'win' },
  lose: { haptic: 'error', sound: 'lose' },
  select: { haptic: 'selection', sound: null },
};

export function useFeedback() {
  const { prefs } = usePreferences();

  const fire = useCallback(
    (cue: FeedbackCue) => {
      const { haptic, sound } = CUES[cue];
      haptics[haptic](prefs.hapticsEnabled);
      if (sound) playSound(sound, prefs.soundEnabled);
    },
    [prefs.hapticsEnabled, prefs.soundEnabled],
  );

  return useMemo(
    () => ({
      tap: () => fire('tap'),
      correct: () => fire('correct'),
      wrong: () => fire('wrong'),
      win: () => fire('win'),
      lose: () => fire('lose'),
      select: () => fire('select'),
      play: (cues: readonly FeedbackCue[]) => cues.forEach(fire),
    }),
    [fire],
  );
}
