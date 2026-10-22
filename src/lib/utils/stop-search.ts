import { PlaceType, type PlaceSuggestion } from '$lib/data/types';
import { groupBy, sortBy, uniq } from 'lodash-es';

const STOP_SEARCH_LIMIT = 20;

export type StopMatch = { id: string; name: string; lat: number; lon: number; routeCode: string };

// A stop is stored once per direction it serves, so matches with the same name collapse into one place.
export function toStopSuggestions(matches: StopMatch[], query: string): PlaceSuggestion[] {
  const needle = query.trim().toLowerCase();
  const places = Object.values(groupBy(matches, (m) => m.name)).map(
    (group): PlaceSuggestion => ({
      id: group[0]!.id,
      name: group[0]!.name,
      description: `Routes ${uniq(group.map((m) => m.routeCode))
        .sort()
        .join(', ')}`,
      location: { latitude: group[0]!.lat, longitude: group[0]!.lon },
      type: PlaceType.STOP,
    }),
  );
  return sortBy(places, [(p) => !p.name.toLowerCase().startsWith(needle), (p) => p.name]).slice(
    0,
    STOP_SEARCH_LIMIT,
  );
}
