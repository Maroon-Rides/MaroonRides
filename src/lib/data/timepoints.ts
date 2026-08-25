import { createLoggingQuery } from '$lib/utils/queries';
import moment from 'moment';
import { z } from 'zod';

const TIMEPOINTS_URL = 'https://auth.maroonrides.app/timepoints.json';

export const TimepointStopsSchema = z.record(z.string(), z.array(z.string()));
export type TimepointStops = z.infer<typeof TimepointStopsSchema>;

export const useTimepointsAPI = () => {
  const query = createLoggingQuery<TimepointStops>(() => ({
    label: 'MRTimepoints',
    queryKey: ['MRTimepoints'],
    // never rejects: the route list depends on this, so a missing or malformed
    // file has to degrade to "no timepoints" rather than block every route
    queryFn: async () => {
      try {
        const res = await fetch(TIMEPOINTS_URL);
        if (!res.ok) return {};

        return TimepointStopsSchema.parse(await res.json());
      } catch {
        return {};
      }
    },
    staleTime: moment.duration(1, 'day'),
  }));

  return query;
};

export function isTimepoint(
  timepoints: TimepointStops,
  routeCode: string,
  stopId: string,
): boolean {
  return timepoints[routeCode]?.includes(stopId) ?? false;
}
