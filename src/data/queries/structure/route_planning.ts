import { SearchSuggestion } from '@data/typecheck/aggie_spirit';
import { DataSource, MY_LOCATION_ID, PlaceSuggestion } from '@data/types';
import { useSearchSuggestionAPI, useTripPlanAPI } from '../api/route_planning';
import { useDependencyQuery } from '../utils';

export enum ASQueryKeyRoutePlanning {
  SEARCH_SUGGESTIONS = 'ASSearchSuggestions',
  TRIP_PLAN = 'ASTripPlan',
}

export const useASSearchSuggestions = (query: string) => {
  const apiSearchSuggestionsQuery = useSearchSuggestionAPI(query);

  const suggestionQuery = useDependencyQuery<PlaceSuggestion[]>({
    queryKey: [ASQueryKeyRoutePlanning.SEARCH_SUGGESTIONS, query],
    queryFn: async () => {
      if (!apiSearchSuggestionsQuery.data) {
        return [];
      }

      const apiSearchSuggestions = apiSearchSuggestionsQuery.data;
      return apiSearchSuggestions.map((suggestion) => ({
        dataSource: DataSource.AGGIE_SPIRIT,
        id: suggestion.stopCode ?? MY_LOCATION_ID, // should just use stop or my location
        name: suggestion.title,
        description: `ID: ${suggestion.subtitle}`,
        location: suggestion.stopCode
          ? {
            latitude: suggestion.lat!,
            longitude: suggestion.long!,
          }
          : null,
        type: suggestion.type,
      })) as PlaceSuggestion[];
    },
    dependents: [apiSearchSuggestionsQuery],
  });
  return suggestionQuery;
};

export const useASTripPlan = (
  origin: PlaceSuggestion | null,
  destination: PlaceSuggestion | null,
  date: Date,
  deadline: 'leave' | 'arrive',
) => {
  // Convert to old data types for api
  const orginSuggestion: SearchSuggestion | null = origin
    ? {
      title: origin.name,
      subtitle: origin.description,
      stopCode: origin.id !== MY_LOCATION_ID ? origin.id : undefined,
      lat: origin.location?.latitude,
      long: origin.location?.longitude,
      type: origin.type as 'stop' | 'my-location' | 'map',
    }
    : null;
  const destinationSuggestion: SearchSuggestion | null = destination
    ? {
      title: destination.name,
      subtitle: destination.description,
      stopCode:
        destination.id !== MY_LOCATION_ID ? destination.id : undefined,
      lat: destination.location?.latitude,
      long: destination.location?.longitude,
      type: destination.type as 'stop' | 'my-location' | 'map',
    }
    : null;

  const apiTripPlanQuery = useTripPlanAPI(
    orginSuggestion,
    destinationSuggestion,
    date,
    deadline,
  );

  const tripPlanQuery = useDependencyQuery({
    queryKey: [
      ASQueryKeyRoutePlanning.TRIP_PLAN,
      origin?.id,
      destination?.id,
      date.toISOString(),
      deadline,
    ],
    queryFn: async () => {
      const apiTripPlan = apiTripPlanQuery.data;
      return apiTripPlan;
    },
    dependents: [apiTripPlanQuery],
  });
  return tripPlanQuery;
};
