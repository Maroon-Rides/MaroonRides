import type { TimetableDeparture } from '$lib/data/types';
import { chunk } from 'lodash-es';
import moment from 'moment';

const ITEMS_PER_ROW = 5;

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

export default function buildTimetable(departures: TimetableDeparture[]): TableItemRow[] {
  const now = moment();
  const hasLiveData = departures.some((d) => d.estimatedTime !== null);
  const departsAt = (d: TimetableDeparture) => d.estimatedTime ?? d.scheduledTime;

  // Only point at the next bus when live data can confirm it.
  const next = hasLiveData
    ? departures.find((d) => !d.isCancelled && !departsAt(d).isBefore(now, 'minute'))
    : undefined;

  const items = departures.map((d) => ({
    time: departsAt(d).format('h:mm'),
    highlighted: d === next,
    live: d.estimatedTime !== null,
    cancelled: d.isCancelled,
    expired: departsAt(d).isBefore(now, 'minute'),
  }));

  return chunk(items, ITEMS_PER_ROW).map((row) => ({
    items: row,
    highlighted: row.some((item) => item.highlighted),
  }));
}
