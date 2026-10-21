import { DateTime } from 'luxon';

export function formatClock(iso: string): string {
  return DateTime.fromISO(iso).toLocaleString(DateTime.TIME_SIMPLE);
}
