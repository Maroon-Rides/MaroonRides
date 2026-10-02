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
import { LiveDataStatus, liveDataManager } from '$lib/managers/live-data.manager.svelte';
import { findBoundingBox } from '$lib/utils/geo';
import { createDbQuery } from '$lib/utils/queries';
import { decode } from '@googlemaps/polyline-codec';
import { and, asc, eq, gte, isNull, or, sql, type SQL } from 'drizzle-orm';
import moment from 'moment';

// Upcoming times are relative to "now", so they refresh even when nothing is synced.
const SCHEDULE_REFRESH_INTERVAL = moment.duration(30, 'seconds');
const STOP_ESTIMATE_LIMIT = 3;
// A late bus is still coming after its scheduled time, so recent times stay in play for live estimates.
const LATE_DEPARTURE_WINDOW = '-30 minutes';
const UPCOMING_TIME_LIMIT = 10;
// A bus that left a minute ago is often still at the stop.
const DEPARTED_GRACE = moment.duration(1, 'minute');

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
  times: moment.Moment[];
}

/** Today's scheduled times at a stop that may still be coming, including late ones. */
const useUpcomingTimes = (params: () => { stop: Stop }) =>
  createDbQuery<UpcomingTimes>(() => {
    const { stop } = params();
    const today = sql`date('now', 'localtime')`;
    return {
      key: ['upcomingTimes', stop.id],
      refetchInterval: SCHEDULE_REFRESH_INTERVAL,
      queryFn: async () => {
        const [rows, timetables] = await Promise.all([
          scheduledTimes(
            stop,
            today,
            gte(sql`unixepoch(${slotTime})`, sql`unixepoch('now', ${LATE_DEPARTURE_WINDOW})`),
          ).limit(UPCOMING_TIME_LIMIT),
          db
            .select({ id: timetable.id })
            .from(timetable)
            .where(and(eq(timetable.stopId, stop.id), eq(timetable.serviceDate, today)))
            .limit(1),
        ]);

        return {
          hasTimetable: timetables.length > 0,
          times: rows.map((row) => moment(row.scheduledAt)),
        };
      },
    };
  });

/** Marks each scheduled time with its live estimate, dropping cancelled and departed buses. */
function withLiveEstimates(times: moment.Moment[], stop: Stop): TimeEstimate[] {
  const earliest = moment().subtract(DEPARTED_GRACE);
  return times
    .flatMap((scheduledTime) => {
      const live = liveDataManager.departureAt(stop.id, scheduledTime);
      if (live?.isCancelled) return [];

      const estimatedTime = live?.estimatedAt ? moment(live.estimatedAt) : null;
      if ((estimatedTime ?? scheduledTime).isBefore(earliest)) return [];
      return [{ scheduledTime, estimatedTime, isRealTime: estimatedTime !== null }];
    })
    .sort((a, b) => (a.estimatedTime ?? a.scheduledTime).diff(b.estimatedTime ?? b.scheduledTime))
    .slice(0, STOP_ESTIMATE_LIMIT);
}

/** A stop's next departures from its timetable, updated with live estimates once they arrive. */
export function useStopEstimate(params: () => { stop: Stop }) {
  const upcoming = useUpcomingTimes(params);

  return {
    get data(): StopEstimates {
      const { stop } = params();
      const isLive = liveDataManager.status === LiveDataStatus.LIVE;
      if (!upcoming.data) return { source: EstimateSource.LOADING, estimates: [] };

      if (!upcoming.data.hasTimetable) {
        const live = isLive ? liveDataManager.estimatesFor(stop.id) : [];
        return live.length > 0
          ? { source: EstimateSource.LIVE, estimates: live }
          : { source: EstimateSource.UNAVAILABLE, estimates: [] };
      }

      return {
        source: isLive ? EstimateSource.LIVE : EstimateSource.SCHEDULE,
        estimates: withLiveEstimates(upcoming.data.times, stop),
      };
    },
  };
}

/** A stop's timetable for one day, marked with live estimates and cancellations. */
export function useTimetable(params: () => { stop: Stop | null; date: moment.Moment }) {
  const times = createDbQuery<moment.Moment[]>(() => {
    const { stop, date } = params();
    const serviceDate = date.format('YYYY-MM-DD');
    return {
      key: ['timetable', stop?.id, serviceDate],
      enabled: stop !== null,
      queryFn: async () =>
        (await scheduledTimes(stop!, serviceDate)).map((row) => moment(row.scheduledAt)),
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
          estimatedTime: live?.estimatedAt ? moment(live.estimatedAt) : null,
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
