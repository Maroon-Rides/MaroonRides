import { EstimateSource, type TimeEstimate } from '$lib/data/types';
import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import {
  estimateStatusMessage,
  EstimateMessage,
  resolveStopEstimates,
  toTimeEstimate,
  upcomingEstimates,
  type StopEstimateInputs,
} from './stop_estimates';

const estimate: TimeEstimate = {
  scheduledTime: DateTime.fromISO('2026-10-10T12:00:00'),
  estimatedTime: null,
  isRealTime: false,
};

const inputs = (overrides: Partial<StopEstimateInputs>): StopEstimateInputs => ({
  hasTimetable: false,
  timetablesCurrent: true,
  isLive: false,
  scheduled: [],
  live: [],
  ...overrides,
});

describe('resolveStopEstimates', () => {
  it('shows scheduled times when the stop has a timetable today', () => {
    expect(resolveStopEstimates(inputs({ hasTimetable: true, scheduled: [estimate] }))).toEqual({
      source: EstimateSource.SCHEDULE,
      estimates: [estimate],
    });
  });

  it('shows no departures when current timetables have nothing for the stop today', () => {
    expect(resolveStopEstimates(inputs({}))).toEqual({
      source: EstimateSource.SCHEDULE,
      estimates: [],
    });
  });

  it('is unavailable when the timetables are out of date', () => {
    expect(resolveStopEstimates(inputs({ timetablesCurrent: false }))).toEqual({
      source: EstimateSource.UNAVAILABLE,
      estimates: [],
    });
  });

  it('falls back to the live feed for a stop with no timetable', () => {
    expect(
      resolveStopEstimates(inputs({ timetablesCurrent: false, isLive: true, live: [estimate] })),
    ).toEqual({ source: EstimateSource.LIVE, estimates: [estimate] });
  });
});

describe('upcomingEstimates', () => {
  const now = DateTime.fromISO('2026-10-10T12:00:00');
  const at = (time: string, estimatedAt: string | null = null) =>
    toTimeEstimate(
      DateTime.fromISO(`2026-10-10T${time}`),
      estimatedAt && `2026-10-10T${estimatedAt}`,
    );

  it('keeps a bus that left under a minute ago', () => {
    expect(upcomingEstimates([at('11:59:30')], now)).toHaveLength(1);
    expect(upcomingEstimates([at('11:58:59')], now)).toHaveLength(0);
  });

  it('orders by live estimate when there is one', () => {
    const late = at('12:01', '12:10');
    const onTime = at('12:05');
    expect(upcomingEstimates([late, onTime], now)).toEqual([onTime, late]);
  });
});

describe('estimateStatusMessage', () => {
  const live = (estimatedAt: string | null) => ({
    source: EstimateSource.LIVE,
    estimates: [toTimeEstimate(DateTime.fromISO('2026-10-10T12:00:00'), estimatedAt)],
  });

  it('explains an empty list', () => {
    expect(
      estimateStatusMessage({ source: EstimateSource.UNAVAILABLE, estimates: [] }, false),
    ).toBe(EstimateMessage.UNAVAILABLE);
    expect(estimateStatusMessage({ source: EstimateSource.LIVE, estimates: [] }, false)).toBe(
      EstimateMessage.NO_DEPARTURES,
    );
  });

  it('says when scheduled times are shown because the app is offline', () => {
    const scheduled = { source: EstimateSource.SCHEDULE, estimates: [estimate] };
    expect(estimateStatusMessage(scheduled, true)).toBe(EstimateMessage.OFFLINE_SCHEDULED);
    expect(estimateStatusMessage(scheduled, false)).toBe(EstimateMessage.SCHEDULED);
  });

  it('reports how far the next live bus is off schedule', () => {
    expect(estimateStatusMessage(live('2026-10-10T12:03:00'), false)).toBe('3 min late');
    expect(estimateStatusMessage(live('2026-10-10T11:58:00'), false)).toBe('2 min early');
    expect(estimateStatusMessage(live(null), false)).toBe(EstimateMessage.ON_TIME);
  });
});
