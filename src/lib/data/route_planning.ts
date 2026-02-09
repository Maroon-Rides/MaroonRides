import { DataSource, type PlaceSuggestion, type PlanItem } from '$lib/data/types';
import { createSelectableQuery } from '../utils/queries';
import { useASSearchSuggestions, useASTripPlan } from './structure/route_planning';

export enum QueryKey {
  SEARCH_SUGGESTIONS = 'MRSearchSuggestions',
  TRIP_PLAN = 'MRTripPlan',
}

export const useSearchSuggestions = (query: string) => {
  const asSearchSuggestions = useASSearchSuggestions(query);
  return createSelectableQuery<PlaceSuggestion[], DataSource>(() => ({
    queryKey: [QueryKey.SEARCH_SUGGESTIONS, query],
    selector: DataSource.AGGIE_SPIRIT,
    queries: {
      [DataSource.AGGIE_SPIRIT]: asSearchSuggestions,
    },
    unsupportedValue: [],
    enabled: query.length > 0,
  }));
};

export const useTripPlan = (
  origin: PlaceSuggestion | null,
  destination: PlaceSuggestion | null,
  date: Date,
  deadline: 'leave' | 'arrive',
) => {
  const asTripPlan = useASTripPlan(origin, destination, date, deadline);
  return createSelectableQuery<PlanItem[], DataSource>(() => ({
    queryKey: [QueryKey.TRIP_PLAN, origin?.id, destination?.id, date.toISOString(), deadline],
    selector: DataSource.AGGIE_SPIRIT,
    queries: {
      [DataSource.AGGIE_SPIRIT]: asTripPlan,
    },
    unsupportedValue: [],
    enabled: !!origin && !!destination,
  }));
};
