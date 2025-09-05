import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import getTheme from 'src/app/theme';
import {
  Amenity,
  Bus,
  DataSource,
  Direction,
  Location,
  PathLocation,
  Route,
  Stop,
  TimeEstimate,
} from 'src/data/datatypes';
import {
  useBaseDataAPI,
  usePatternPathsAPI,
  useStopEstimateAPI,
  useVehiclesAPI,
} from '../api/aggie_spirit';

export enum ASQueryKey {
  ROUTE_LIST = 'ASRouteList',
  VEHICLES = 'ASVehicles',
  STOP_ESTIMATE = 'ASStopEstimate',
  STOP_AMENITIES = 'ASStopAmenities',
}

export const useASRouteList = () => {
  const apiBaseDataQuery = useBaseDataAPI();
  const apiPatternPathsQuery = usePatternPathsAPI();

  const query = useQuery<Route[]>({
    queryKey: [
      ASQueryKey.ROUTE_LIST,
      apiBaseDataQuery.data,
      apiPatternPathsQuery.data,
    ],
    queryFn: async () => {
      console.log('Fetching route list with theme');
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

          const stops: Stop[] = patternPathForDirection.patternPoints
            .filter((pt) => !!pt.stop)
            .map((pt) => {
              // Build Stop
              return {
                dataSource: DataSource.AGGIE_SPIRIT,
                name: pt.stop!.name || '',
                id: pt.stop!.stopCode || '',
                location: {
                  latitude: pt.latitude,
                  longitude: pt.longitude,
                } as Location,
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

        return {
          dataSource: DataSource.AGGIE_SPIRIT,
          name: baseRoute.name,
          id: baseRoute.key,
          routeCode: baseRoute.shortName,
          tintColor: tintColor,
          directions: directions,
        };
      });
    },
    enabled: apiBaseDataQuery.isSuccess && apiPatternPathsQuery.isSuccess,
  });

  return query;
};

export const useASVehicles = (route: Route | null) => {
  const apiBusesQuery = useVehiclesAPI(route?.id ?? '');

  const query = useQuery<Bus[]>({
    queryKey: [ASQueryKey.VEHICLES, apiBusesQuery.data],
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
    enabled: apiBusesQuery.isSuccess,
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

  const query = useQuery<TimeEstimate[]>({
    queryKey: [ASQueryKey.STOP_ESTIMATE, route.id, direction.id, stop.id],
    queryFn: async () => {
      const stopEstimates = apiStopEstimateQuery.data!;

      return stopEstimates.routeDirectionTimes[0].nextDeparts.map(
        (e): TimeEstimate => {
          return {
            dataSource: DataSource.AGGIE_SPIRIT,
            estimatedTime: e.estimatedDepartTimeUtc
              ? moment.utc(e.estimatedDepartTimeUtc)
              : null,
            scheduledTime: moment.utc(e.scheduledDepartTimeUtc),
            isRealTime: e.estimatedDepartTimeUtc == null,
          };
        },
      );
    },
    enabled: apiStopEstimateQuery.isSuccess,
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

  const query = useQuery<Amenity[]>({
    queryKey: [ASQueryKey.STOP_AMENITIES, route.id, direction.id, stop.id],
    queryFn: async () => {
      const stopEstimates = apiStopEstimateQuery.data!;
      return Amenity.fromAPI(stopEstimates.amenities);
    },
    enabled: apiStopEstimateQuery.isSuccess,
  });

  return query;
};
