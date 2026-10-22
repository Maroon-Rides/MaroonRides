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

export enum EstimateMessage {
  LOADING = 'Loading departures',
  UNAVAILABLE = 'Stop estimates unavailable',
  NO_DEPARTURES = 'No upcoming departures',
  SCHEDULED = 'Scheduled times',
  OFFLINE = 'Offline, live estimates unavailable',
  ON_TIME = 'On time',
}

function deviationMessage(estimates: TimeEstimate[]): string {
  const first = estimates.find((estimate) => estimate.estimatedTime);
  if (!first?.estimatedTime) return EstimateMessage.ON_TIME;

  const minutes = Math.round(first.estimatedTime.diff(first.scheduledTime, 'minutes').minutes);
  if (minutes > 0) return `${minutes} min late`;
  if (minutes < 0) return `${-minutes} min early`;
  return EstimateMessage.ON_TIME;
}

export function estimateStatusMessage({ source, estimates }: StopEstimates): string {
  if (source === EstimateSource.LOADING) return EstimateMessage.LOADING;
  if (source === EstimateSource.UNAVAILABLE) return EstimateMessage.UNAVAILABLE;
  if (estimates.length === 0) return EstimateMessage.NO_DEPARTURES;
  if (source === EstimateSource.SCHEDULE) return EstimateMessage.SCHEDULED;
  return deviationMessage(estimates);
}
