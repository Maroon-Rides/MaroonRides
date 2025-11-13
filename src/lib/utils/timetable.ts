import { StopSchedule, TimeEstimate } from '@lib/types';
import moment from 'moment';
import { Theme } from 'src/app/theme';

interface TableItem {
  time: string;
  color: string;
  shouldHighlight: boolean;
  live: boolean;
  cancelled: boolean;
}

export interface TableItemRow {
  items: TableItem[];
  shouldHighlight: boolean;
}

export default function buildTimetable(
  fullSchedule: StopSchedule,
  estimates: StopSchedule[] | undefined,
  theme: Theme,
) {
  // Helper function to find the estimate for the current route and direction
  const findRouteEstimate = (estimates?: StopSchedule[]) => {
    return estimates?.find(
      (estimate) =>
        estimate.direction.id === fullSchedule.direction.id &&
        estimate.route.id === fullSchedule.route.id,
    );
  };

  // Helper function to get time estimate for a specific trip point
  const getTimeEstimate = (
    routeEstimate: StopSchedule | undefined,
    tripPointId: string,
  ) => {
    if (!routeEstimate) return null;

    const timeEstimateIndex = routeEstimate.timetable.findIndex(
      (stopTime) => stopTime.tripPointId === tripPointId,
    );

    return timeEstimateIndex >= 0
      ? routeEstimate.timetable[timeEstimateIndex]
      : null;
  };

  // Helper function to determine departure time (estimated or scheduled)
  const getDepartureTime = (
    timeEstimate: TimeEstimate | null,
    scheduledTime: moment.Moment,
  ) => {
    const estimatedTime =
      timeEstimate && moment(timeEstimate.estimatedTime).isValid()
        ? moment(timeEstimate.estimatedTime)
        : null;

    return estimatedTime ?? scheduledTime;
  };

  // Helper function to determine if time should be highlighted
  const shouldHighlightTime = (
    departTime: moment.Moment,
    timeEstimate: TimeEstimate | null,
    now: moment.Moment,
  ) => {
    const isFutureOrSameDay =
      departTime.isSame(now, 'day') && departTime.diff(now, 'minutes') >= 0;
    const isRealTimeAndNotCancelled =
      timeEstimate?.isRealTime && !timeEstimate?.isCancelled;

    return isFutureOrSameDay || isRealTimeAndNotCancelled || false;
  };

  // Helper function to process individual timetable items
  const processTimeTableItem = (
    time: any,
    routeEstimate: any,
    now: moment.Moment,
  ) => {
    const timeEstimate = getTimeEstimate(routeEstimate, time.tripPointId);
    const departTime = getDepartureTime(timeEstimate, time.scheduledTime);

    const shouldHighlight = shouldHighlightTime(departTime, timeEstimate, now);
    let color = shouldHighlight ? theme.text : theme.subtitle;

    // Highlight the next stop with tint color
    if (shouldHighlight && !foundNextStop) {
      color = fullSchedule.route.tintColor;
      foundNextStop = true;
    }

    return {
      time: departTime.format('h:mm'),
      color,
      shouldHighlight,
      live: Boolean(timeEstimate?.isRealTime),
      cancelled: Boolean(timeEstimate?.isCancelled),
    };
  };

  // Helper function to apply expired item styling
  const applyExpiredStyling = (row: TableItem[], tintColor: string) => {
    return row.map((item) => ({
      ...item,
      color: item.color === 'grey' ? tintColor + '80' : item.color,
    }));
  };

  // Helper function to chunk items into rows
  const chunkIntoRows = (processedItems: TableItem[], sliceLength: number) => {
    const rows: TableItemRow[] = [];
    let foundHighlightedRow = false;

    for (let i = 0; i < processedItems.length; i += sliceLength) {
      const rowItems = processedItems.slice(i, i + sliceLength);
      const hasHighlightedItem = rowItems.some((item) => item.shouldHighlight);
      const shouldHighlightRow = hasHighlightedItem && !foundHighlightedRow;

      // Apply expired styling to the first highlighted row
      const finalRowItems = shouldHighlightRow
        ? applyExpiredStyling(rowItems, fullSchedule.route.tintColor)
        : rowItems;

      rows.push({
        items: finalRowItems,
        shouldHighlight: shouldHighlightRow,
      });

      if (hasHighlightedItem) {
        foundHighlightedRow = true;
      }
    }

    return rows;
  };

  const now = moment();
  let foundNextStop = false;

  // Find the estimate data for this specific route and direction
  const routeEstimate = findRouteEstimate(estimates);

  // Process each timetable item to create table items with styling
  const processedItems = fullSchedule.timetable.map((estimate) =>
    processTimeTableItem(estimate, routeEstimate, now),
  );

  // Group processed items into rows of 5
  return chunkIntoRows(processedItems, 5);
}
