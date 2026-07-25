import {
  GetTripPlanResponseSchema,
  type IFoundStop,
  type ITripPlanResponse,
} from '$lib/data/typecheck/aggie_spirit';
import { type SearchSuggestion } from '$lib/utils/route-planning';
import { findBusStops, getTripPlan } from 'aggie-spirit-api';
import { createLoggingQuery } from '../../utils/queries';
import { useASRoutes } from '../structure/aggie_spirit';
import { useAuthTokenAPI, useRoutePlanAuthTokenAPI } from './aggie_spirit';

export enum ASRoutePlanQueryKey {
  SEARCH_SUGGESTION = 'ASAPISearchSuggestion',
  TRIP_PLAN = 'ASAPITripPlan',
}

export { useRoutePlanAuthTokenAPI };

export const useSearchSuggestionAPI = (params: () => { query: string }) => {
  const authTokenQuery = useAuthTokenAPI();
  const routesQuery = useASRoutes();

  return createLoggingQuery<SearchSuggestion[]>(() => {
    const { query } = params();
    return {
      queryKey: [ASRoutePlanQueryKey.SEARCH_SUGGESTION, query],
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
          const foundLocation = routesQuery.data
            ?.flatMap((route) => route.directions)
            .flatMap((path) => path.stops)
            .find((point) => point.id === stop.stopCode);

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
      enabled: authTokenQuery.isSuccess && routesQuery.isSuccess && query !== '',
      staleTime: Infinity,
    };
  });
};

export const useTripPlanAPI = (
  params: () => {
    origin: SearchSuggestion | null;
    destination: SearchSuggestion | null;
    date: Date;
    deadline: 'leave' | 'arrive';
  },
) => {
  const routePlanAuthToken = useRoutePlanAuthTokenAPI(() => {
    const { origin, destination, date } = params();
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
    return { queryString };
  });

  return createLoggingQuery<ITripPlanResponse>(() => {
    const { origin, destination, date, deadline } = params();
    return {
      queryKey: [ASRoutePlanQueryKey.TRIP_PLAN, origin, destination, date, deadline],
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
    };
  });
};
