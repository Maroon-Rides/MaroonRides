import type { PlanItem, RoutePlanMarkedPoint, RoutePlanPoint } from '$lib/data/types';
import { findLast, last } from 'lodash-es';

export interface SearchSuggestion {
  title: string;
  subtitle: string;
  lat?: number;
  long?: number;
  stopCode?: string;
  placeId?: string;
  type: 'stop' | 'map' | 'my-location';
}

export const MyLocationSuggestion: SearchSuggestion = {
  title: 'My Location',
  subtitle: '',
  type: 'my-location',
};

export interface RoutePlanMapComponents {
  highlighted: RoutePlanPoint[];
  faded: RoutePlanPoint[][];
  markers: RoutePlanMarkedPoint[];
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
  routePlan: PlanItem | null,
  selectedPart: number,
): RoutePlanMapComponents {
  if (!routePlan) {
    return {
      highlighted: [],
      faded: [],
      markers: [],
    };
  }

  let i = 0;
  const pathPoints = routePlan?.instructions.flatMap((instruction, index) => {
    return (
      instruction.pathPoints?.map((point) => ({
        ...point,
        stepIndex: index,
        pathIndex: i++,
      })) ?? []
    );
  });

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

  // A step with no path of its own, like waiting at a stop, sits where the last step ended.
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

    // A wait step at the start has no earlier point to put a marker on.
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
