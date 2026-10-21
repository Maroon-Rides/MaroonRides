import type { TimetableDeparture } from '$lib/data/types';
import { chunk } from 'lodash-es';
import { DateTime } from 'luxon';

const ITEMS_PER_ROW = 5;
const DEPARTURE_TIME_FORMAT = 'h:mm';

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
  departures: TimetableDeparture[],
  now: DateTime = DateTime.now(),
): TableItemRow[] {
  const currentMinute = now.startOf('minute');
  const hasLiveData = departures.some((d) => d.estimatedTime !== null);

  const items = departures.map((d) => {
    const departsAt = d.estimatedTime ?? d.scheduledTime;
    return {
      time: departsAt.toFormat(DEPARTURE_TIME_FORMAT),
      highlighted: false,
      live: d.estimatedTime !== null,
      cancelled: d.isCancelled,
      expired: departsAt < currentMinute,
    };
  });

  const next = hasLiveData ? items.find((item) => !item.cancelled && !item.expired) : undefined;
  if (next) next.highlighted = true;

  return chunk(items, ITEMS_PER_ROW).map((row) => ({
    items: row,
    highlighted: row.some((item) => item.highlighted),
  }));
}
