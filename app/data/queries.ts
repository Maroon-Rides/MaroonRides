import { getColorScheme } from 'app/utils';
import { usePatternPaths, useBaseData } from './api_query';
import { Direction, Location, PathLocation, Route, Stop } from './datatypes';
import { lightMode, darkMode } from 'app/theme';
import { useQuery } from '@tanstack/react-query';

export enum QueryKey {
  ROUTE_LIST = 'MRRouteList',
}

export const useRouteList = () => {
  const asBaseQuery = useBaseData();
  const asPatternPathsQuery = usePatternPaths();

  const query = useQuery<Route[]>({
    queryKey: [QueryKey.ROUTE_LIST],
    queryFn: async () => {
      try {
        console.log("GETTING RUN!")

        let ASBaseData = asBaseQuery.data!;
        let ASPatternPathData = asPatternPathsQuery.data!;

  
        const colorTheme =
          (await getColorScheme()) === 'dark' ? darkMode : lightMode;
  
        let routes: Route[] = ASBaseData.routes.map((baseRoute) => {
          // Find matching pattern paths for this route
          const matchingPatternPaths = ASPatternPathData.find(
            (path) => path.routeKey === baseRoute.key
          )!;
  
          const tintColor = colorTheme.busTints[baseRoute.shortName] ?? baseRoute.directionList[0].lineColor;
  
          // process directions
          const directions: Direction[] = baseRoute.directionList.map((dir) => {
            const patternPathForDirection = matchingPatternPaths?.patternPaths.find(
              (pp) => pp.directionKey === dir.direction.key
            )!;
  
            const points: PathLocation[] = patternPathForDirection.patternPoints.map((pt) => ({
              latitude: pt.latitude,
              longitude: pt.longitude,
              isStop: !!pt.stop,
            })) || [];
  
            const stops: Stop[] = patternPathForDirection.patternPoints.filter((pt) => !!pt.stop).map((pt) => ({
              name: pt.stop!.name || '',
              id: pt.stop!.stopCode || '',
              location: { latitude: pt.latitude, longitude: pt.longitude } as Location,
            }))
  
            return {
              name: dir.direction.name,
              id: dir.direction.key,
              pathPoints: points,
              stops: stops,
              isOnlyDirection: baseRoute.directionList.length === 1,
            }
          });
  
          return {
            name: baseRoute.name,
            id: baseRoute.key,
            routeCode: baseRoute.shortName,
            tintColor: tintColor,
            directions: directions,
          }
        });
        return routes;
      } catch (e) {
        console.error('Error processing route list:', e);
        throw e;
      }

    },
    staleTime: Infinity,
    refetchInterval: 2 * 3600 * 1000,
    enabled: asBaseQuery.isSuccess && asPatternPathsQuery.isSuccess,
  });

  return query;
};
