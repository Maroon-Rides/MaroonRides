import { Bus, DataSource, Direction, Route, Stop } from '@data/types';
import { decodePolyline, findBoundingBox } from '@data/utils/geo';
import {
  useMapVehiclesAPI,
  useRoutesAPI,
  useVehicleCapacitiesAPI,
} from '../api/brazos_transit';
import { useDependencyQuery } from '../utils';

enum BTQueryKey {
  ROUTES = 'BTRoutes',
  MAP_VEHICLES = 'BTMapVehicles',
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

export const useBTMapVehicles = (route: Route | null) => {
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
              apiVehicleCapacitiesQuery.data?.[
                apiVehicleCapacitiesQuery.data!.findIndex(
                  (capacity) => capacity.VehicleID === vehicle.VehicleID,
                )
              ] ?? 0,
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
