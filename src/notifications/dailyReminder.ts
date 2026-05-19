import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Schedules / cancels a single local notification that fires every day at the
// user's chosen time as a "new daily challenge is available" nudge. No remote
// push service needed; expo-notifications handles permission + scheduling.

const REMINDER_ID = 'mindgames.daily.reminder';

export async function ensurePermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  const req = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return req.granted;
}

export async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  await cancelDailyReminder();
  // Android needs a channel before any notification displays.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily', {
      name: 'Daily challenges',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: 'Today’s puzzles are ready',
      body: 'Solve Sudoku, Wordle, and Mahjong before the day’s over.',
      sound: true,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
      channelId: 'daily',
    } as Notifications.NotificationTriggerInput,
  });
}

export async function cancelDailyReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
  } catch {
    // No existing schedule — fine.
  }
}
