import {
  Bus,
  DataSource,
  Direction,
  Route,
  Stop,
  TimeEstimate,
} from '@data/types';
import { decodePolyline, findBoundingBox } from '@data/utils/geo';
import moment from 'moment';
import {
  useMapVehiclesAPI,
  useRoutesAPI,
  useStopArrivalTimesAPI,
  useVehicleCapacitiesAPI,
} from '../api/brazos_transit';
import { useDependencyQuery } from '../utils';

enum BTQueryKey {
  ROUTES = 'BTRoutes',
  MAP_VEHICLES = 'BTMapVehicles',
  STOP_ARRIVAL_TIMES = 'BTStopArrivalTimes',
}

export const useBTRoutes = () => {
  const apiRoutesQuery = useRoutesAPI();
  const query = useDependencyQuery<Route[]>({
    queryKey: [BTQueryKey.ROUTES],
    queryFn: async () => {
      return apiRoutesQuery.data!.map((route) => {
        const coordinates = decodePolyline(route.EncodedPolyline);
        const bounds = findBoundingBox(coordinates);

        // Create direction object
        const direction: Direction = {
          dataSource: DataSource.BRAZOS_TRANSIT,
          pathPoints: coordinates,
          name: route.Description,
          id: route.RouteID.toString(),
          stops: route.Stops.map(
            (stop) =>
              ({
                name: stop.Line1,
                id: stop.RouteStopID.toString(),
                location: {
                  latitude: stop.Latitude,
                  longitude: stop.Longitude,
                },
              }) as Stop,
          ),
          isOnlyDirection: true,
        };

        return {
          dataSource: DataSource.BRAZOS_TRANSIT,
          name: route.Description,
          id: route.RouteID.toString(),
          routeCode: route.GtfsId,
          tintColor: route.MapLineColor,
          directions: [direction],
          bounds,
        } as Route;
      });
    },
    dependents: [apiRoutesQuery],
  });

  return query;
};

export const useBTVehicles = (route: Route | null) => {
  const apiMapVehiclesQuery = useMapVehiclesAPI();
  const apiVehicleCapacitiesQuery = useVehicleCapacitiesAPI();

  const query = useDependencyQuery<Bus[]>({
    queryKey: [BTQueryKey.MAP_VEHICLES],
    queryFn: async () => {
      return apiMapVehiclesQuery.data!.map(
        (vehicle) =>
          ({
            dataSource: DataSource.BRAZOS_TRANSIT,
            location: {
              latitude: vehicle.Latitude,
              longitude: vehicle.Longitude,
            },
            heading: vehicle.Heading,
            amenities: [],
            capacity:
              apiVehicleCapacitiesQuery.data?.find(
                (capacity) => capacity.VehicleID === vehicle.VehicleID,
              )?.Percentage ?? 0,
            speed: vehicle.GroundSpeed,
            id: vehicle.VehicleID.toString(),
            direction: route?.directions[0],
            name: vehicle.Name,
          }) as Bus,
      );
    },
    dependents: [apiMapVehiclesQuery, apiVehicleCapacitiesQuery],
  });

  return query;
};

export const useBTStopEstimate = (route: Route, stop: Stop) => {
  const apiStopEstimateQuery = useStopArrivalTimesAPI([route.id]);

  const query = useDependencyQuery<TimeEstimate[]>({
    queryKey: [BTQueryKey.STOP_ARRIVAL_TIMES, route.id, stop.id],
    queryFn: async () => {
      const stopTimes = apiStopEstimateQuery.data!.filter(
        (stopTime) => stopTime.RouteStopId.toString() === stop.id,
      )[0].Times;

      return stopTimes.map(
        (stopTime) =>
          ({
            dataSource: DataSource.BRAZOS_TRANSIT,
            estimatedTime: stopTime.EstimateTime
              ? moment(stopTime.EstimateTime)
              : null,
            scheduledTime: moment(stopTime.ScheduledDepartureTime),
            tripPointId: 'N/A',
            isRealTime: stopTime.EstimateTime !== null,
            isCancelled: false,
          }) as TimeEstimate,
      );
    },
    dependents: [apiStopEstimateQuery],
  });

  return query;
};
