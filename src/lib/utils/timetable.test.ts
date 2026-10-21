import type { TimetableDeparture } from '$lib/data/types';
import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import buildTimetable from './timetable';

const NOW = DateTime.fromISO('2026-10-10T12:00:30');

function departure(time: string, overrides: Partial<TimetableDeparture> = {}): TimetableDeparture {
  return {
    scheduledTime: DateTime.fromISO(`2026-10-10T${time}`),
    estimatedTime: null,
    isCancelled: false,
    ...overrides,
  };
}

const highlightedTimes = (departures: TimetableDeparture[]) =>
  buildTimetable(departures, NOW)
    .flatMap((row) => row.items)
    .filter((item) => item.highlighted)
    .map((item) => item.time);

describe('buildTimetable', () => {
  it('does not point at a next bus without live data', () => {
    expect(highlightedTimes([departure('11:50'), departure('12:10')])).toEqual([]);
  });

  it('points at the first live-confirmed bus that has not left or been cancelled', () => {
    const departures = [
      departure('11:50'),
      departure('12:05', { isCancelled: true }),
      departure('12:10', { estimatedTime: DateTime.fromISO('2026-10-10T12:12') }),
    ];

    expect(highlightedTimes(departures)).toEqual(['12:12']);
  });

  it('keeps a bus due this minute as upcoming', () => {
    const [row] = buildTimetable([departure('12:00')], NOW);

    expect(row!.items[0]!.expired).toBe(false);
  });

  it('marks the row holding the next bus', () => {
    const departures = ['11:51', '11:52', '11:53', '11:54', '11:55', '12:06'].map((time) =>
      departure(time),
    );
    departures[0] = { ...departures[0]!, estimatedTime: departures[0]!.scheduledTime };

    expect(buildTimetable(departures, NOW).map((row) => row.highlighted)).toEqual([false, true]);
  });
});
