import { useCallback, useEffect, useState } from 'react';
import { usePreferences } from '@/prefs/PreferencesProvider';

// Returns { visible, dismiss } and auto-shows the modal the first time it's
// mounted for a given id.

export function useOnboarding(id: string) {
  const { prefs, markOnboardingSeen, loaded } = usePreferences();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    if (!prefs.onboardingSeen[id]) setVisible(true);
  }, [id, loaded, prefs.onboardingSeen]);

  const dismiss = useCallback(() => {
    setVisible(false);
    markOnboardingSeen(id);
  }, [id, markOnboardingSeen]);

  return { visible, dismiss };
}
