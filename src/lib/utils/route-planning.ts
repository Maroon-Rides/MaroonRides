import type { TripItinerary, TripLeg } from '$lib/api/client';
import {
  PlaceType,
  type PlaceSuggestion,
  type RoutePlanMarkedPoint,
  type RoutePlanPoint,
} from '$lib/data/types';
import { decode } from '@googlemaps/polyline-codec';
import { findLast, groupBy, last, sortBy, uniq } from 'lodash-es';
import { DateTime } from 'luxon';

export interface RoutePlanMapComponents {
  highlighted: RoutePlanPoint[];
  faded: RoutePlanPoint[][];
  markers: RoutePlanMarkedPoint[];
}

export function formatClock(iso: string): string {
  return DateTime.fromISO(iso).toLocaleString(DateTime.TIME_SIMPLE);
}

export function describeLeg(leg: TripLeg): string {
  switch (leg.type) {
    case 'walk':
      return `Walk to ${leg.to.name}`;
    case 'wait':
      return `Wait at ${leg.to.name}`;
    case 'ride': {
      const ride = leg.ride!;
      const stops = `${ride.stopCount} ${ride.stopCount === 1 ? 'stop' : 'stops'}`;
      return `Board ${ride.routeShortName} ${ride.headsign}, get off at ${leg.to.name} (${stops})`;
    }
  }
}

function createMarkers(
  start: RoutePlanPoint,
  end: RoutePlanPoint,
  startIsOrigin = false,
): RoutePlanMarkedPoint[] {
  return [
    {
      ...start,
      icon: 'point',
      isOrigin: startIsOrigin,
    },
    {
      ...end,
      icon: 'point',
      isOrigin: false,
    },
  ];
}

export function processRoutePlanMapComponents(
  routePlan: TripItinerary | null,
  selectedPart: number,
): RoutePlanMapComponents {
  if (!routePlan) {
    return {
      highlighted: [],
      faded: [],
      markers: [],
    };
  }

  const pathPoints = (routePlan.legs ?? [])
    .flatMap((leg, stepIndex) =>
      (leg.path ? decode(leg.path) : []).map(([latitude, longitude]) => ({
        latitude,
        longitude,
        stepIndex,
      })),
    )
    .map((point, pathIndex) => ({ ...point, pathIndex }));

  if (selectedPart === -1) {
    return {
      highlighted: pathPoints,
      faded: [],
      markers:
        pathPoints.length === 0 ? [] : createMarkers(pathPoints[0]!, last(pathPoints)!, true),
    };
  }

  const highlighted = pathPoints.filter((point) => point.stepIndex === selectedPart);

  let faded: RoutePlanPoint[][] = [[], []];
  pathPoints.forEach((point) => {
    if (point.stepIndex < selectedPart) {
      faded[0]!.push(point);
    } else if (point.stepIndex > selectedPart) {
      faded[1]!.push(point);
    }
  });

  // A step with no path of its own, like the arrival, sits where the last step ended.
  if (highlighted.length === 0) {
    const lastPoint = findLast(pathPoints, (point) => point.stepIndex === selectedPart - 1);

    if (lastPoint) {
      if (lastPoint.pathIndex === pathPoints.length - 1) {
        return {
          highlighted: [],
          faded: faded,
          markers: [
            {
              latitude: lastPoint.latitude,
              longitude: lastPoint.longitude,
              icon: 'point',
              isOrigin: false,
            },
          ],
        };
      }

      return {
        highlighted: [],
        faded: faded,
        markers: [
          {
            latitude: lastPoint.latitude,
            longitude: lastPoint.longitude,
            icon: 'wait',
            isOrigin: false,
          },
        ],
      };
    }

    // A step at the start has no earlier point to put a marker on.
    return {
      highlighted: [],
      faded: faded,
      markers: [],
    };
  }

  return {
    highlighted: highlighted,
    faded: faded,
    markers: createMarkers(highlighted[0]!, last(highlighted)!, true),
  };
}

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
