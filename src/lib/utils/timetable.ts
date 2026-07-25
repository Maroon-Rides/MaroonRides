import type { StopSchedule } from '$lib/data/types';
import moment from 'moment';

interface TableItem {
  time: string;
  highlighted: boolean;
  live: boolean;
  cancelled: boolean;
  expired: boolean;
}

export interface TableItemRow {
  items: TableItem[];
  highlighted: boolean;
}

export default function buildTimetable(
  fullSchedule: StopSchedule,
  estimates: StopSchedule[] | undefined,
) {
  const now = moment();
  const ITEMS_PER_ROW = 5;

  // Find the estimate data for this specific route and direction
  const routeEstimate = estimates?.find(
    (estimate) =>
      estimate.direction.id === fullSchedule.direction.id &&
      estimate.route.id === fullSchedule.route.id,
  );

  // Step 1: Process all times and compute departure times
  const processedTimes = fullSchedule.timetable.map((scheduledItem) => {
    // Find live estimate for this trip point
    const liveEstimate = routeEstimate?.timetable.find(
      (stopTime) => stopTime.tripPointId === scheduledItem.tripPointId,
    );

    // Determine actual departure time (live estimate or scheduled)
    const departureTime =
      liveEstimate && moment(liveEstimate.estimatedTime).isValid()
        ? moment(liveEstimate.estimatedTime)
        : scheduledItem.scheduledTime;

    const hasLiveEstimate = Boolean(liveEstimate?.isRealTime);
    const isCancelled = Boolean(liveEstimate?.isCancelled);
    const isExpired = departureTime.isBefore(now, 'minute');

    return {
      time: departureTime.format('h:mm'),
      departureTime,
      live: hasLiveEstimate,
      cancelled: isCancelled,
      expired: isExpired,
      highlighted: false, // Will be set in next step
    };
  });

  // Step 2: Find the next (first non-expired, non-cancelled) time and highlight only that one
  // Only highlight if we have live estimates available
  const hasEstimates = routeEstimate && routeEstimate.timetable.length > 0;
  const nextTimeIndex = hasEstimates
    ? processedTimes.findIndex((item) => !item.expired && !item.cancelled)
    : -1;

  // Explicitly set highlighted status: only the next time should be true, all others false
  processedTimes.forEach((item, index) => {
    item.highlighted = index === nextTimeIndex && nextTimeIndex !== -1;
  });

  // Step 3: Chunk into rows and highlight the row containing the next time
  const rows: TableItemRow[] = [];
  for (let i = 0; i < processedTimes.length; i += ITEMS_PER_ROW) {
    const rowItems = processedTimes.slice(i, i + ITEMS_PER_ROW);
    const hasNextTime = rowItems.some((item) => item.highlighted);

    rows.push({
      items: rowItems.map(({ departureTime, ...item }) => item), // Remove departureTime (only needed for processing)
      highlighted: hasNextTime,
    });
  }

  return rows;
}
