// Date helpers. All "ISO dates" are yyyy-mm-dd in UTC so a daily puzzle is the
// same worldwide and streaks don't shift with the device's time zone.

export interface Clock {
  now(): number;
}

export const systemClock: Clock = { now: () => Date.now() };

export function toISODate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function todayISO(clock: Clock = systemClock): string {
  return toISODate(clock.now());
}

export function shiftISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return toISODate(Date.UTC(y, m - 1, d + days));
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}
