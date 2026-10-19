import { EstimateSource, type StopEstimates, type TimeEstimate } from '$lib/data/types';

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
