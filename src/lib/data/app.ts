import {
  EstimateSource,
  type Alert,
  type Amenity,
  type Bus,
  type Direction,
  type Route,
  type Stop,
  type StopEstimates,
  type TimeEstimate,
  type TimetableDeparture,
} from '$lib/data/types';
import { db } from '$lib/db/database';
import { alert, alertDirection, direction, route, stop, timetable } from '$lib/db/schema';
import { TODAY_SQL } from '$lib/db/sql';
import { resolveStopEstimates } from '$lib/data/stop_estimates';
import { liveDataManager } from '$lib/managers/live-data.manager.svelte';
import { syncManager } from '$lib/managers/sync.manager.svelte';
import { findBoundingBox } from '$lib/utils/geo';
import { createDbQuery } from '$lib/utils/queries';
import { decode } from '@googlemaps/polyline-codec';
import { and, asc, eq, gte, isNull, or, sql, type SQL } from 'drizzle-orm';
import { DateTime, Duration } from 'luxon';

// Upcoming times are relative to "now", so they refresh even when nothing is synced.
const SCHEDULE_REFRESH_INTERVAL = Duration.fromObject({ seconds: 30 });
const STOP_ESTIMATE_LIMIT = 3;
// A late bus is still coming after its scheduled time, so recent times stay in play for live estimates.
const LATE_DEPARTURE_WINDOW = '-30 minutes';
const UPCOMING_TIME_LIMIT = 10;
// A bus that left a minute ago is often still at the stop.
const DEPARTED_GRACE = Duration.fromObject({ minutes: 1 });

const slotTime = sql<string>`slot.value`;

function routeTree(where?: SQL) {
  return db.query.route.findMany({
    where: and(eq(route.active, true), where),
    orderBy: asc(route.shortName),
    with: {
      directions: {
        orderBy: asc(direction.sequence),
        with: {
          stops: { orderBy: asc(stop.sequence) },
        },
      },
    },
  });
}

type RouteRow = Awaited<ReturnType<typeof routeTree>>[number];
type DirectionRow = RouteRow['directions'][number];
type StopRow = DirectionRow['stops'][number];

function toStop(row: StopRow, index: number, all: StopRow[]): Stop {
  return {
    id: row.id,
    name: row.name,
    location: { latitude: row.lat, longitude: row.lon },
    amenities: row.amenities as Amenity[],
    isTimepoint: row.isTimepoint,
    isLastOnDirection: index === all.length - 1,
  };
}

function toDirection(row: DirectionRow, _: number, all: DirectionRow[]): Direction {
  return {
    id: row.id,
    name: row.destination,
    pathPoints: decode(row.path).map(([latitude, longitude]) => ({ latitude, longitude })),
    stops: row.stops.map(toStop),
    isOnlyDirection: all.length === 1,
  };
}

function toRoute(row: RouteRow): Route {
  const directions = row.directions.map(toDirection);
  return {
    id: row.id,
    name: row.longName,
    routeCode: row.shortName,
    lightColor: row.lightColor,
    darkColor: row.darkColor,
    directions,
    bounds: findBoundingBox(directions.flatMap((d) => d.pathPoints)),
  };
}

export const useRoutes = () =>
  createDbQuery<Route[]>(() => ({
    key: ['routes'],
    queryFn: async () => (await routeTree()).map(toRoute),
  }));

export const useRoute = (params: () => { routeId: string }) =>
  createDbQuery<Route | null>(() => {
    const { routeId } = params();
    return {
      key: ['route', routeId],
      queryFn: async () => (await routeTree(eq(route.id, routeId))).map(toRoute)[0] ?? null,
    };
  });

export const useAlerts = (params: () => { routeId: string | null }) =>
  createDbQuery<Alert[]>(() => {
    const { routeId } = params();
    return {
      key: ['alerts', routeId],
      enabled: routeId !== null,
      queryFn: () =>
        db
          .selectDistinct({ id: alert.id, title: alert.title, description: alert.description })
          .from(alert)
          .innerJoin(alertDirection, eq(alertDirection.alertId, alert.id))
          .innerJoin(direction, eq(direction.id, alertDirection.directionId))
          .where(
            and(
              eq(direction.routeId, routeId!),
              or(isNull(alert.endsAt), gte(sql`unixepoch(${alert.endsAt})`, sql`unixepoch('now')`)),
            ),
          ),
    };
  });

/** Every scheduled time at a stop on one day. */
function scheduledTimes(stop: Stop, serviceDate: string | SQL, where?: SQL) {
  return db
    .select({ scheduledAt: slotTime })
    .from(timetable)
    .innerJoin(sql`json_each(${timetable.departures}) slot`, sql`true`)
    .where(and(eq(timetable.stopId, stop.id), eq(timetable.serviceDate, serviceDate), where))
    .orderBy(sql`unixepoch(${slotTime})`);
}

interface UpcomingTimes {
  hasTimetable: boolean;
  hasTimetablesFromToday: boolean;
  times: DateTime[];
}

/** Today's scheduled times at a stop that may still be coming, including late ones. */
const useUpcomingTimes = (params: () => { stop: Stop }) =>
  createDbQuery<UpcomingTimes>(() => {
    const { stop } = params();
    return {
      key: ['upcomingTimes', stop.id],
      refetchInterval: SCHEDULE_REFRESH_INTERVAL,
      queryFn: async () => {
        const [rows, timetables, timetablesFromToday] = await Promise.all([
          scheduledTimes(
            stop,
            TODAY_SQL,
            gte(sql`unixepoch(${slotTime})`, sql`unixepoch('now', ${LATE_DEPARTURE_WINDOW})`),
          ).limit(UPCOMING_TIME_LIMIT),
          db
            .select({ id: timetable.id })
            .from(timetable)
            .where(and(eq(timetable.stopId, stop.id), eq(timetable.serviceDate, TODAY_SQL)))
            .limit(1),
          db
            .select({ id: timetable.id })
            .from(timetable)
            .where(gte(timetable.serviceDate, TODAY_SQL))
            .limit(1),
        ]);

        return {
          hasTimetable: timetables.length > 0,
          hasTimetablesFromToday: timetablesFromToday.length > 0,
          times: rows.map((row) => DateTime.fromISO(row.scheduledAt)),
        };
      },
    };
  });

/** Marks each scheduled time with its live estimate, dropping cancelled and departed buses. */
function withLiveEstimates(times: DateTime[], stop: Stop): TimeEstimate[] {
  const earliest = DateTime.now().minus(DEPARTED_GRACE);
  return times
    .flatMap((scheduledTime) => {
      const live = liveDataManager.departureAt(stop.id, scheduledTime);
      if (live?.isCancelled) return [];

      const estimatedTime = live?.estimatedAt ? DateTime.fromISO(live.estimatedAt) : null;
      if ((estimatedTime ?? scheduledTime) < earliest) return [];
      return [{ scheduledTime, estimatedTime, isRealTime: estimatedTime !== null }];
    })
    .sort((a, b) => +(a.estimatedTime ?? a.scheduledTime) - +(b.estimatedTime ?? b.scheduledTime))
    .slice(0, STOP_ESTIMATE_LIMIT);
}

/** A stop's next departures from its timetable, updated with live estimates once they arrive. */
export function useStopEstimate(params: () => { stop: Stop }) {
  const upcoming = useUpcomingTimes(params);

  return {
    get data(): StopEstimates {
      const { stop } = params();
      const isLive = liveDataManager.isLive;
      if (!upcoming.data) return { source: EstimateSource.LOADING, estimates: [] };

      // The server skips days a stop has no service, so a missing timetable is only
      // trustworthy if some later day was synced or we synced today.
      return resolveStopEstimates({
        hasTimetable: upcoming.data.hasTimetable,
        timetablesCurrent: upcoming.data.hasTimetablesFromToday || syncManager.hasSyncedToday,
        isLive,
        scheduled: withLiveEstimates(upcoming.data.times, stop),
        live: isLive ? liveDataManager.estimatesFor(stop.id) : [],
      });
    },
  };
}

/** A stop's timetable for one day, marked with live estimates and cancellations. */
export function useTimetable(params: () => { stop: Stop | null; date: DateTime }) {
  const times = createDbQuery<DateTime[]>(() => {
    const { stop, date } = params();
    const serviceDate = date.toISODate()!;
    return {
      key: ['timetable', stop?.id, serviceDate],
      enabled: stop !== null,
      queryFn: async () =>
        (await scheduledTimes(stop!, serviceDate)).map((row) => DateTime.fromISO(row.scheduledAt)),
    };
  });

  return {
    get isLoading() {
      return times.isLoading;
    },
    get data(): TimetableDeparture[] | undefined {
      const { stop } = params();
      return times.data?.map((scheduledTime) => {
        const live = liveDataManager.departureAt(stop!.id, scheduledTime);
        return {
          scheduledTime,
          estimatedTime: live?.estimatedAt ? DateTime.fromISO(live.estimatedAt) : null,
          isCancelled: live?.isCancelled ?? false,
        };
      });
    },
  };
}

/** The subscribed route's buses. */
export function useVehicles(params: () => { route: Route | null }) {
  return {
    get data(): Bus[] {
      const { route } = params();
      if (!route) return [];
      return liveDataManager.vehicles.map((vehicle) => ({
        id: vehicle.id,
        name: vehicle.name,
        location: { latitude: vehicle.lat, longitude: vehicle.lon },
        heading: vehicle.heading,
        speed: vehicle.speed,
        amenities: (vehicle.amenities ?? []) as Amenity[],
        capacity:
          vehicle.capacity > 0 ? Math.round((vehicle.passengers / vehicle.capacity) * 100) : 0,
        direction:
          route.directions.find((d) => d.id === vehicle.directionId) ?? route.directions[0],
        route,
      }));
    },
  };
}
