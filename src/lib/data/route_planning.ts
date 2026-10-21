import { planTrip, type TripItinerary, type TripTimeKind } from '$lib/api/client';
import { Deadline, type PlaceSuggestion } from '$lib/data/types';
import { db } from '$lib/db/database';
import { direction, route, stop } from '$lib/db/schema';
import { createDbQuery, createLoggingQuery } from '$lib/utils/queries';
import { toStopSuggestions } from '$lib/utils/route-planning';
import { and, asc, eq, sql } from 'drizzle-orm';
import { Duration } from 'luxon';

export enum QueryKey {
  STOP_SEARCH = 'stopSearch',
  TRIP_PLAN = 'MRTripPlan',
}

const TRIP_PLAN_STALE_TIME = Duration.fromObject({ minutes: 1 });

const TIME_KINDS: Record<Deadline, TripTimeKind> = {
  [Deadline.LEAVE_BY]: 'departAt',
  [Deadline.ARRIVE_BY]: 'arriveBy',
};

export const useStopSearch = (params: () => { query: string }) =>
  createDbQuery<PlaceSuggestion[]>(() => {
    const query = params().query.trim();
    return {
      key: [QueryKey.STOP_SEARCH, query],
      enabled: query.length > 0,
      queryFn: async () =>
        toStopSuggestions(
          await db
            .select({
              id: stop.id,
              name: stop.name,
              lat: stop.lat,
              lon: stop.lon,
              routeCode: route.shortName,
            })
            .from(stop)
            .innerJoin(direction, eq(direction.id, stop.directionId))
            .innerJoin(route, eq(route.id, direction.routeId))
            .where(
              and(
                eq(route.active, true),
                sql`instr(lower(${stop.name}), ${query.toLowerCase()}) > 0`,
              ),
            )
            .orderBy(asc(stop.name)),
          query,
        ),
    };
  });

function toEndpoint(place: PlaceSuggestion) {
  return { name: place.name, lat: place.location!.latitude, lon: place.location!.longitude };
}

export const useTripPlan = (
  params: () => {
    origin: PlaceSuggestion | null;
    destination: PlaceSuggestion | null;
    date: Date;
    deadline: Deadline;
  },
) =>
  createLoggingQuery<TripItinerary[]>(() => {
    const { origin, destination, date, deadline } = params();
    return {
      queryKey: [QueryKey.TRIP_PLAN, origin, destination, date.toISOString(), deadline],
      queryFn: () =>
        planTrip({
          origin: toEndpoint(origin!),
          destination: toEndpoint(destination!),
          time: date.toISOString(),
          timeKind: TIME_KINDS[deadline],
        }),
      enabled: !!origin?.location && !!destination?.location,
      staleTime: TRIP_PLAN_STALE_TIME,
    };
  });
