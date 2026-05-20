import * as Haptics from 'expo-haptics';

// Tiny wrapper around expo-haptics so callers don't have to thread the
// preference flag through everywhere. Read it from the store-backed
// preferences before each trigger.
//
// Call shape:
//   haptics.light(prefs.hapticsEnabled)
//   haptics.success(prefs.hapticsEnabled)

type HapticFn = (enabled: boolean) => void;

const safe = (fn: () => Promise<unknown>): void => {
  fn().catch(() => {});
};

export const haptics: Record<
  'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection',
  HapticFn
> = {
  light: enabled => {
    if (enabled) safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },
  medium: enabled => {
    if (enabled) safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  },
  heavy: enabled => {
    if (enabled) safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
  },
  success: enabled => {
    if (enabled) safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
  warning: enabled => {
    if (enabled) safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  },
  error: enabled => {
    if (enabled) safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  },
  selection: enabled => {
    if (enabled) safe(() => Haptics.selectionAsync());
  },
};
