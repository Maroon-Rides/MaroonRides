import { DataSource, type PlaceSuggestion, type PlanItem } from '$lib/data/types';
import { createSelectableQuery } from '../utils/queries';
import { useASSearchSuggestions, useASTripPlan } from './structure/route_planning';

export enum QueryKey {
  SEARCH_SUGGESTIONS = 'MRSearchSuggestions',
  TRIP_PLAN = 'MRTripPlan',
}

export const useSearchSuggestions = (params: () => { query: string }) => {
  const asSearchSuggestions = useASSearchSuggestions(params);
  return createSelectableQuery<PlaceSuggestion[], DataSource>(() => ({
    queryKey: [QueryKey.SEARCH_SUGGESTIONS, params().query],
    selector: DataSource.AGGIE_SPIRIT,
    queries: {
      [DataSource.AGGIE_SPIRIT]: asSearchSuggestions,
    },
    unsupportedValue: [],
    enabled: params().query.length > 0,
  }));
};

export const useTripPlan = (
  params: () => {
    origin: PlaceSuggestion | null;
    destination: PlaceSuggestion | null;
    date: Date;
    deadline: 'leave' | 'arrive';
  },
) => {
  const asTripPlan = useASTripPlan(params);
  return createSelectableQuery<PlanItem[], DataSource>(() => ({
    queryKey: [
      QueryKey.TRIP_PLAN,
      params().origin?.id,
      params().destination?.id,
      params().date.toISOString(),
      params().deadline,
    ],
    selector: DataSource.AGGIE_SPIRIT,
    queries: {
      [DataSource.AGGIE_SPIRIT]: asTripPlan,
    },
    unsupportedValue: [],
    enabled: !!params().origin && !!params().destination,
  }));
};
