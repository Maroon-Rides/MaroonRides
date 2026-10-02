import { planTrip, searchBusStops } from '$lib/data/api/aggie_spirit';
import {
  DataSource,
  MovementType,
  MY_LOCATION_ID,
  type PlaceSuggestion,
  type PlanInstruction,
  type PlanItem,
} from '$lib/data/types';
import { createLoggingQuery } from '$lib/utils/queries';
import { type SearchSuggestion } from '$lib/utils/route-planning';
import { decode } from '@googlemaps/polyline-codec';
import moment from 'moment';

export enum QueryKey {
  SEARCH_SUGGESTIONS = 'MRSearchSuggestions',
  TRIP_PLAN = 'MRTripPlan',
}

const TRIP_PLAN_STALE_TIME = moment.duration(1, 'minute');

function toSearchSuggestion(place: PlaceSuggestion): SearchSuggestion {
  return {
    title: place.name,
    subtitle: place.description,
    stopCode: place.id !== MY_LOCATION_ID ? place.id : undefined,
    lat: place.location?.latitude,
    long: place.location?.longitude,
    type: place.type as 'stop' | 'my-location' | 'map',
  };
}

export const useSearchSuggestions = (params: () => { query: string }) =>
  createLoggingQuery<PlaceSuggestion[]>(() => {
    const { query } = params();
    return {
      queryKey: [QueryKey.SEARCH_SUGGESTIONS, query],
      queryFn: async () =>
        (await searchBusStops(query)).map(
          (suggestion) =>
            ({
              dataSource: DataSource.AGGIE_SPIRIT,
              id: suggestion.stopCode ?? MY_LOCATION_ID,
              name: suggestion.title,
              description: suggestion.subtitle,
              location: suggestion.stopCode
                ? { latitude: suggestion.lat!, longitude: suggestion.long! }
                : null,
              type: suggestion.type,
            }) as PlaceSuggestion,
        ),
      enabled: query.length > 0,
      staleTime: Infinity,
    };
  });

export const useTripPlan = (
  params: () => {
    origin: PlaceSuggestion | null;
    destination: PlaceSuggestion | null;
    date: Date;
    deadline: 'leave' | 'arrive';
  },
) =>
  createLoggingQuery<PlanItem[]>(() => {
    const { origin, destination, date, deadline } = params();
    return {
      queryKey: [QueryKey.TRIP_PLAN, origin?.id, destination?.id, date.toISOString(), deadline],
      queryFn: async () => {
        const plan = await planTrip(
          toSearchSuggestion(origin!),
          toSearchSuggestion(destination!),
          date,
          deadline,
        );

        return plan.options.map(
          (option): PlanItem => ({
            dataSource: DataSource.AGGIE_SPIRIT,
            startTime: option.startTime,
            endTime: option.endTime,
            endTimeText: option.endTimeText,
            instructions: option.instructions.map(
              (instruction): PlanInstruction => ({
                movementType: instruction.className as MovementType,
                time: instruction.startTime,
                instruction: instruction.instruction ?? '',
                pathPoints: (instruction.polyline ? decode(instruction.polyline) : []).map(
                  ([latitude, longitude]) => ({ latitude, longitude }),
                ),
                detailedWalkingInstructions: instruction.walkingInstructions.map((step) => ({
                  stepNumber: step.index,
                  instruction: step.instruction,
                })),
              }),
            ),
          }),
        );
      },
      enabled: origin !== null && destination !== null,
      staleTime: TRIP_PLAN_STALE_TIME,
    };
  });
