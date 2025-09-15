import { useTheme } from '@data/state/utils';
import {
  Alert,
  Amenity,
  Bus,
  DataSource,
  Direction,
  Location,
  PathLocation,
  Route,
  Stop,
  StopSchedule,
  TimeEstimate,
} from '@data/types';
import { findBoundingBox } from '@data/utils/geo';
import moment from 'moment';
import getTheme from 'src/app/theme';
import {
  useBaseDataAPI,
  usePatternPathsAPI,
  useServiceInterruptionsAPI,
  useStopEstimateAPI,
  useStopScheduleAPI,
  useTimetableEstimateAPI,
  useVehiclesAPI,
} from '../api/aggie_spirit';
import { useDependencyQuery } from '../utils';

export enum ASQueryKey {
  ROUTE_LIST = 'ASRouteList',
  VEHICLES = 'ASVehicles',
  STOP_ESTIMATE = 'ASStopEstimate',
  TIMETABLE_ESTIMATE = 'ASTimetableEstimate',
  STOP_AMENITIES = 'ASStopAmenities',
  STOP_SCHEDULE = 'ASStopSchedule',
  ALERTS = 'ASAlerts',
}

export const useASRoutes = () => {
  const apiBaseDataQuery = useBaseDataAPI();
  const apiPatternPathsQuery = usePatternPathsAPI();

  const theme = useTheme();

  const query = useDependencyQuery<Route[]>({
    queryKey: [ASQueryKey.ROUTE_LIST, theme.mode],
    queryFn: async () => {
      let apiBaseData = apiBaseDataQuery.data!;
      let apiPatternPathData = apiPatternPathsQuery.data!;

      const theme = await getTheme();

      return apiBaseData.routes.map((baseRoute): Route => {
        // Find matching pattern paths for this route
        const matchingPatternPaths = apiPatternPathData.find(
          (path) => path.routeKey === baseRoute.key,
        )!;

        // process directions
        const directions: Direction[] = baseRoute.directionList.map((dir) => {
          const patternPathForDirection =
            matchingPatternPaths?.patternPaths.find(
              (pp) => pp.directionKey === dir.direction.key,
            )!;

          const points: PathLocation[] =
            patternPathForDirection.patternPoints.map((pt) => ({
              latitude: pt.latitude,
              longitude: pt.longitude,
              isStop: !!pt.stop,
            })) || [];

          const filteredPoints = patternPathForDirection.patternPoints.filter(
            (pt) => !!pt.stop,
          );

          const stops: Stop[] = filteredPoints.map((pt, i) => {
            // Build Stop
            return {
              dataSource: DataSource.AGGIE_SPIRIT,
              name: pt.stop!.name || '',
              id: pt.stop!.stopCode || '',
              location: {
                latitude: pt.latitude,
                longitude: pt.longitude,
              } as Location,
              isLastOnDirection: i === filteredPoints.length - 1,
            };
          });

          return {
            dataSource: DataSource.AGGIE_SPIRIT,
            name: dir.direction.name.replace('to', '').trim(),
            id: dir.direction.key,
            pathPoints: points,
            stops: stops,
            isOnlyDirection: baseRoute.directionList.length === 1,
          };
        });

        const tintColor =
          theme.busTints[baseRoute.shortName] ??
          baseRoute.directionList[0].lineColor;

        const directionBounds: Location[] = directions.flatMap((direction) =>
          findBoundingBox(direction.pathPoints),
        );
        const bounds: Location[] = findBoundingBox(directionBounds);

        return {
          dataSource: DataSource.AGGIE_SPIRIT,
          name: baseRoute.name,
          id: baseRoute.key,
          routeCode: baseRoute.shortName,
          tintColor: tintColor,
          directions: directions,
          bounds: bounds,
        };
      });
    },
    dependents: [apiBaseDataQuery, apiPatternPathsQuery],
  });

  return query;
};

export const useASVehicles = (route: Route | null) => {
  const apiBusesQuery = useVehiclesAPI(route?.id ?? '');

  const query = useDependencyQuery<Bus[]>({
    queryKey: [ASQueryKey.VEHICLES],
    queryFn: async () => {
      let apiBuses = apiBusesQuery.data!;

      if (!apiBuses.vehiclesByDirections) return [];

      return apiBuses.vehiclesByDirections.flatMap(
        (vehicleDirection): Bus[] => {
          const direction = route?.directions.find(
            (dir) => dir.id === vehicleDirection.directionKey,
          )!;

          const directionBuses: Bus[] = vehicleDirection.vehicles.map(
            (vehicle) => {
              return {
                dataSource: DataSource.AGGIE_SPIRIT,
                location: {
                  latitude: vehicle.location.latitude,
                  longitude: vehicle.location.longitude,
                },
                heading: vehicle.location.heading,
                amenities: Amenity.fromAPI(vehicle.amenities),
                capacity: Math.round(
                  (vehicle.passengersOnboard / vehicle.passengerCapacity) * 100,
                ),
                speed: vehicle.location.speed,
                id: vehicle.key,
                direction: direction,
                name: vehicle.name,
              };
            },
          );

          return directionBuses;
        },
      );
    },
    dependents: [apiBusesQuery],
  });

  return query;
};

export const useASStopEstimate = (
  route: Route,
  direction: Direction,
  stop: Stop,
) => {
  const apiStopEstimateQuery = useStopEstimateAPI(
    route.id,
    direction.id,
    stop.id,
  );

  const query = useDependencyQuery<TimeEstimate[]>({
    queryKey: [ASQueryKey.STOP_ESTIMATE],
    queryFn: async () => {
      const stopEstimates = apiStopEstimateQuery.data!;

      return stopEstimates.routeDirectionTimes[0].nextDeparts.map((e) => {
        return {
          dataSource: DataSource.AGGIE_SPIRIT,
          estimatedTime: e.estimatedDepartTimeUtc
            ? moment.utc(e.estimatedDepartTimeUtc).local()
            : null,
          scheduledTime: moment.utc(e.scheduledDepartTimeUtc).local(),
          isRealTime: e.estimatedDepartTimeUtc != null,
        } as TimeEstimate;
      });
    },
    dependents: [apiStopEstimateQuery],
  });

  return query;
};

export const useASTimetableEstimate = (
  stop: Stop | null,
  date: moment.Moment,
) => {
  const apiTimetableEstimateQuery = useTimetableEstimateAPI(
    stop?.id ?? '',
    date.toDate(),
  );

  const apiRoutes = useASRoutes();

  const query = useDependencyQuery<StopSchedule[]>({
    queryKey: [ASQueryKey.TIMETABLE_ESTIMATE],
    queryFn: async () => {
      const timetableEstimateData = apiTimetableEstimateQuery.data!;

      return timetableEstimateData.routeStopSchedules.map((routeStop) => {
        const timeEstimates = routeStop.stopTimes.map(
          (stopTime) =>
            ({
              dataSource: DataSource.AGGIE_SPIRIT,
              estimatedTime: stopTime.estimatedDepartTimeUtc
                ? moment.utc(stopTime.estimatedDepartTimeUtc).local()
                : null,
              scheduledTime: moment
                .utc(stopTime.scheduledDepartTimeUtc)
                .local(),
              tripPointId: stopTime.tripPointId,
              isRealTime: stopTime.estimatedDepartTimeUtc != null,
              isCancelled: stopTime.isCancelled,
            }) as TimeEstimate,
        );

        const route = apiRoutes.data?.find(
          (r) => r.routeCode === routeStop.routeNumber,
        )!;

        const direction =
          route?.directions.length === 1
            ? route.directions[0]
            : route?.directions.find((d) => {
                return d.name === routeStop.directionName;
              });

        return {
          dataSource: DataSource.AGGIE_SPIRIT,
          route: route,
          direction: direction,
          stop: stop!,
          timetable: timeEstimates,
        } as StopSchedule;
      });
    },
    dependents: [apiTimetableEstimateQuery, apiRoutes],
  });

  return query;
};

export const useASStopAmenities = (
  route: Route,
  direction: Direction,
  stop: Stop,
) => {
  const apiStopEstimateQuery = useStopEstimateAPI(
    route.id,
    direction.id,
    stop.id,
  );

  const query = useDependencyQuery<Amenity[]>({
    queryKey: [ASQueryKey.STOP_AMENITIES],
    queryFn: async () => {
      const stopEstimates = apiStopEstimateQuery.data!;
      return Amenity.fromAPI(stopEstimates.amenities);
    },
    dependents: [apiStopEstimateQuery],
  });

  return query;
};

export const useASStopSchedule = (stop: Stop | null, date: moment.Moment) => {
  const apiStopScheduleQuery = useStopScheduleAPI(
    stop?.id ?? '',
    date.toDate(),
  );

  const apiRoutes = useASRoutes();

  const query = useDependencyQuery<StopSchedule[]>({
    queryKey: [ASQueryKey.STOP_SCHEDULE],
    queryFn: async () => {
      const stopScheduleData = apiStopScheduleQuery.data!;

      return stopScheduleData.routeStopSchedules.map((routeStop) => {
        const timeEstimates = routeStop.stopTimes.map(
          (stopTime) =>
            ({
              dataSource: DataSource.AGGIE_SPIRIT,
              estimatedTime: stopTime.estimatedDepartTimeUtc
                ? moment.utc(stopTime.estimatedDepartTimeUtc).local()
                : null,
              scheduledTime: moment
                .utc(stopTime.scheduledDepartTimeUtc)
                .local(),
              tripPointId: stopTime.tripPointId,
              isRealTime: stopTime.estimatedDepartTimeUtc != null,
              isCancelled: stopTime.isCancelled,
            }) as TimeEstimate,
        );

        const route = apiRoutes.data?.find(
          (r) => r.routeCode === routeStop.routeNumber,
        );

        const direction =
          route?.directions.length === 1
            ? route.directions[0]
            : route?.directions.find((d) => {
                return d.name === routeStop.directionName;
              });

        return {
          dataSource: DataSource.AGGIE_SPIRIT,
          route: route,
          direction: direction,
          stop: stop!,
          timetable: timeEstimates,
          isEndOfRoute: routeStop.isEndOfRoute,
        } as StopSchedule;
      });
    },
    dependents: [apiStopScheduleQuery, apiRoutes],
  });

  return query;
};

export const useASAlerts = (route: Route | null) => {
  const apiServiceInterruptionsQuery = useServiceInterruptionsAPI();
  const apiBaseDataQuery = useBaseDataAPI();
  const routesQuery = useASRoutes();

  // Aggie Spirit does not have alerts
  const query = useDependencyQuery<Alert[]>({
    queryKey: [ASQueryKey.ALERTS, route?.id],
    queryFn: async () => {
      if (!route) return [];

      const alerts = apiServiceInterruptionsQuery.data!;
      const baseData = apiBaseDataQuery.data!;
      const routes = routesQuery.data!;

      const selectedAPIRoute = baseData.routes.find((r) => r.key === route.id);
      if (!selectedAPIRoute) return [];

      // Find any service interruptions that apply to this route
      const routeAlertKeys = selectedAPIRoute.directionList
        .flatMap((d) => d.serviceInterruptionKeys)
        .map((s) => s.toString());

      const routeAlerts = alerts.filter((si) =>
        routeAlertKeys.includes(si.key),
      );

      return routeAlerts.map((alert): Alert => {
        // Find all routes affected by this alert
        // used for showing all routes affected on map when tapped
        const affectedAPIRoutes = baseData.routes
          .filter((r) =>
            r.directionList.some((d) =>
              d.serviceInterruptionKeys
                .map((s) => s.toString())
                .includes(alert.key),
            ),
          )
          .map((r) => routes.find((route) => route.id === r.key))
          .filter((r): r is Route => r !== undefined);

        return {
          dataSource: DataSource.AGGIE_SPIRIT,
          id: alert.key,
          title: alert.name,
          description: alert.description ?? '',
          affectedRoutes: affectedAPIRoutes,
          originalRoute: route,
        };
      });
    },
    enabled: route !== null,
    dependents: [apiServiceInterruptionsQuery, apiBaseDataQuery, routesQuery],
  });

  return query;
};
