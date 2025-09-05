import { useQuery } from '@tanstack/react-query';
import { findBusStops, getTripPlan } from 'aggie-spirit-api';
import {
  GetTripPlanResponseSchema,
  IFoundStop,
  ITripPlanResponse,
  SearchSuggestion,
} from 'utils/interfaces';
import { Stop } from '../../datatypes';
import { useASRouteList } from '../structure/aggie_spirit';
import { useAuthCodeAPI, useAuthTokenAPI } from './aggie_spirit';

export const useRoutePlanAuthTokenAPI = (queryString: string) => {
  const authCodeQuery = useAuthCodeAPI();

  const query = useQuery<{ [key: string]: string }>({
    queryKey: ['routePlanAuthToken'],
    queryFn: async () => {
      let qsAdded = authCodeQuery.data!.replace(
        'ROUTE_PLAN_QUERY_STRING',
        queryString,
      );
      qsAdded += '\ngetRoutePlanAuthentication()';

      const headers = await eval(qsAdded);
      return headers;
    },
    refetchInterval: 2 * 3600 * 1000,
    enabled: authCodeQuery.isSuccess && queryString !== '',
  });

  return query;
};

export const useSearchSuggestionAPI = (query: string) => {
  const authTokenQuery = useAuthTokenAPI();
  const routesQuery = useASRouteList();

  return useQuery<any, Error, SearchSuggestion[]>({
    queryKey: ['searchSuggestion', query],
    queryFn: async () => {
      // we need data from pattern paths to get the stop GPS locations
      // This is limitation of the API where we can't get the GPS location of a stop directly
      // we can just ignore the bus stops if we don't have the pattern paths
      // since Google already has most buildings in their search
      let queryData = authTokenQuery.data!;
      queryData = {
        Cookie: queryData['Cookie']!,
        'X-Requested-With': queryData['X-Requested-With']!,
      };

      const stops = await findBusStops(query, queryData);

      // handle bus stops
      let busStops: SearchSuggestion[] = [];

      busStops = stops.map((stop: IFoundStop) => {
        // find the stop location (lat/long) in baseData patternPaths
        // TODO: convert this processing to be on the BaseData loading
        let foundLocation: Stop | undefined = undefined;
        for (let route of routesQuery.data!) {
          for (let path of route.directions) {
            const stops = path.stops;
            for (let point of stops) {
              if (point.id === stop.stopCode) {
                foundLocation = point;
                break;
              }
            }
            if (foundLocation) break;
          }

          if (foundLocation) break;
        }

        return {
          type: 'stop',
          title: foundLocation?.name ?? '',
          subtitle: 'ID: ' + foundLocation?.id,
          stopCode: foundLocation?.id,
          lat: foundLocation?.location.latitude,
          long: foundLocation?.location.longitude,
        };
      });

      return busStops;
    },
    enabled: authTokenQuery.isSuccess && query !== '',
    throwOnError: true,
    staleTime: Infinity,
  });
};

export const useTripPlanAPI = (
  origin: SearchSuggestion | null,
  destination: SearchSuggestion | null,
  date: Date,
  deadline: 'leave' | 'arrive',
) => {
  // build the query string
  // ?o1=Commons&osc=0100&d1=HEEP&dsc=0108&dt=1736392200&ro=0
  let queryString = '';
  if (origin && destination) {
    if (origin.title === 'My Location') {
      queryString = `Results?o1=${origin.title}&ola=${origin.lat}&olo=${origin.long}&og=1&d1=${destination.title}&dsc=${destination.stopCode}&dt=${(date.getTime() / 1000).toFixed(0)}&ro=0`;
    } else if (destination.title === 'My Location') {
      queryString = `Results?o1=${origin.title}&osc=${origin.stopCode}&d1=${destination.title}&dla=${origin.lat}&dlo=${origin.long}&dg=true&dt=${(date.getTime() / 1000).toFixed(0)}&ro=0`;
    } else {
      queryString = `Results?o1=${origin.title}&osc=${origin.stopCode}&d1=${destination.title}&dsc=${destination.stopCode}&dt=${(date.getTime() / 1000).toFixed(0)}&ro=0`;
    }
  }

  const routePlanAuthToken = useRoutePlanAuthTokenAPI(queryString);

  return useQuery<ITripPlanResponse>({
    queryKey: ['tripPlan', origin, destination, date, deadline],
    queryFn: async () => {
      let response = await getTripPlan(
        routePlanAuthToken.data!,
        origin!,
        destination!,
        0,
        deadline === 'arrive' ? date : undefined,
        deadline === 'leave' ? date : undefined,
      );

      GetTripPlanResponseSchema.parse(response);

      // @ts-expect-error: Types are wrong in lib
      return response as ITripPlanResponse;
    },
    enabled:
      routePlanAuthToken.isSuccess &&
      origin !== null &&
      destination !== null &&
      date !== null &&
      deadline !== null,
    staleTime: 60000, // 2 minutes
    throwOnError: true,
  });
};

export default useRoutePlanAuthTokenAPI;
