import { DataSource, PlaceSuggestion } from '@data/types';
import { useASSearchSuggestions } from './structure/route_planning';
import { useSelectableQuery } from './utils';

export enum QueryKey {
  SEARCH_SUGGESTIONS = 'MRSearchSuggestions',
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
