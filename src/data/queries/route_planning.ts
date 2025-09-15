import { DataSource, PlaceSuggestion, PlanItem } from '@data/types';
import {
  useASSearchSuggestions,
  useASTripPlan,
} from './structure/route_planning';
import { useSelectableQuery } from './utils';

export enum QueryKey {
  SEARCH_SUGGESTIONS = 'MRSearchSuggestions',
  TRIP_PLAN = 'MRTripPlan',
}

export const useSearchSuggestions = (query: string) => {
  const asSearchSuggestions = useASSearchSuggestions(query);
  return useSelectableQuery<PlaceSuggestion[], DataSource>({
    queryKey: [QueryKey.SEARCH_SUGGESTIONS, query],
    selector: DataSource.AGGIE_SPIRIT,
    queries: {
      [DataSource.AGGIE_SPIRIT]: asSearchSuggestions,
    },
    unsupportedValue: [],
    enabled: query.length > 0,
  });
};

export const useTripPlan = (
  origin: PlaceSuggestion | null,
  destination: PlaceSuggestion | null,
  date: Date,
  deadline: 'leave' | 'arrive',
) => {
  const asTripPlan = useASTripPlan(origin, destination, date, deadline);
  return useSelectableQuery<PlanItem[], DataSource>({
    queryKey: [
      QueryKey.TRIP_PLAN,
      origin?.id,
      destination?.id,
      date.toISOString(),
      deadline,
    ],
    selector: DataSource.AGGIE_SPIRIT,
    queries: {
      [DataSource.AGGIE_SPIRIT]: asTripPlan,
    },
    unsupportedValue: [],
    enabled: !!origin && !!destination,
  });
};
