import { EstimateSource, type StopEstimates, type TimeEstimate } from '$lib/data/types';
import { DateTime, Duration } from 'luxon';

// A bus that left a minute ago is often still at the stop.
const DEPARTED_GRACE = Duration.fromObject({ minutes: 1 });

const departsAt = (estimate: TimeEstimate) => estimate.estimatedTime ?? estimate.scheduledTime;

export function toTimeEstimate(
  scheduledTime: DateTime,
  estimatedAt: string | null | undefined,
): TimeEstimate {
  const estimatedTime = estimatedAt ? DateTime.fromISO(estimatedAt) : null;
  return { scheduledTime, estimatedTime, isRealTime: estimatedTime !== null };
}

/** Drops buses that have already left and puts the rest soonest first. */
export function upcomingEstimates(
  estimates: TimeEstimate[],
  now: DateTime = DateTime.now(),
): TimeEstimate[] {
  const earliest = now.minus(DEPARTED_GRACE);
  return estimates
    .filter((estimate) => departsAt(estimate) >= earliest)
    .sort((a, b) => departsAt(a).toMillis() - departsAt(b).toMillis());
}

export interface StopEstimateInputs {
  /** The stop has a timetable for today. */
  hasTimetable: boolean;
  /** The local timetables are recent enough that a missing one means no service today. */
  timetablesCurrent: boolean;
  isLive: boolean;
  /** Today's scheduled times, marked with live estimates. */
  scheduled: TimeEstimate[];
  /** Departures the live feed sent for the stop. */
  live: TimeEstimate[];
}

export function resolveStopEstimates({
  hasTimetable,
  timetablesCurrent,
  isLive,
  scheduled,
  live,
}: StopEstimateInputs): StopEstimates {
  const source = isLive ? EstimateSource.LIVE : EstimateSource.SCHEDULE;
  if (hasTimetable) return { source, estimates: scheduled };

  if (isLive && live.length > 0) return { source: EstimateSource.LIVE, estimates: live };
  if (timetablesCurrent) return { source, estimates: [] };
  return { source: EstimateSource.UNAVAILABLE, estimates: [] };
}
