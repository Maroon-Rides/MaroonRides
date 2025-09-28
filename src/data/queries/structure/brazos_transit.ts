import { DataSource, Direction, Route, Stop } from '@data/types';
import { decodePolyline, findBoundingBox } from '@data/utils/geo';
import { useRoutesAPI } from '../api/brazos_transit';
import { useDependencyQuery } from '../utils';

enum BTQueryKey {
  ROUTES = 'BTRoutes',
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
    enabled: apiRoutesQuery.isSuccess,
    dependents: [apiRoutesQuery],
  });

  return query;
};
