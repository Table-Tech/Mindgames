import { useCallback, useEffect, useState } from 'react';
import { usePreferences, type Preferences } from '@/prefs/PreferencesProvider';

// Returns { visible, dismiss } and auto-shows the modal the first time it's
// mounted for a given id. `eligible` can further restrict who sees it.

export function useOnboarding(id: string, eligible?: (prefs: Preferences) => boolean) {
  const { prefs, markOnboardingSeen, loaded } = usePreferences();
  const [visible, setVisible] = useState(false);
  const isEligible = !eligible || eligible(prefs);

  useEffect(() => {
    if (!loaded) return;
    if (!prefs.onboardingSeen[id] && isEligible) setVisible(true);
  }, [id, loaded, prefs.onboardingSeen, isEligible]);

  const dismiss = useCallback(() => {
    setVisible(false);
    markOnboardingSeen(id);
  }, [id, markOnboardingSeen]);

  return { visible, dismiss };
}
