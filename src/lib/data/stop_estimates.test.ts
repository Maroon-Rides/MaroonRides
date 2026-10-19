import { EstimateSource, type TimeEstimate } from '$lib/data/types';
import moment from 'moment';
import { describe, expect, it } from 'vitest';
import { resolveStopEstimates, type StopEstimateInputs } from './stop_estimates';

const estimate: TimeEstimate = {
  scheduledTime: moment('2026-10-10T12:00:00'),
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
