// // // Generate the path points for the selected route plan

import { PlanItem, RoutePlanMarkedPoint, RoutePlanPoint } from '@lib/types';

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
    return instruction.pathPoints?.map((point) => ({
      ...point,
      stepIndex: index,
      pathIndex: i++,
    }));
  });

  if (selectedPart === -1) {
    return {
      highlighted: pathPoints,
      faded: [],
      markers:
        pathPoints.length === 0
          ? []
          : createMarkers(
              pathPoints[0]!,
              pathPoints[pathPoints.length - 1]!,
              true,
            ),
    };
  }

  // handle selecting a specific part of the route plan

  const highlighted = pathPoints.filter(
    (point) => point.stepIndex === selectedPart,
  );

  // break the path into two parts, before and after the selected part
  let faded: RoutePlanPoint[][] = [[], []];
  pathPoints.forEach((point) => {
    if (point.stepIndex < selectedPart) {
      faded[0]!.push(point);
    } else if (point.stepIndex > selectedPart) {
      faded[1]!.push(point);
    }
  });

  // handle single point steps
  if (highlighted.length === 0) {
    const lastPoint = [...pathPoints]
      .reverse()
      .find((point) => point.stepIndex === selectedPart - 1);

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
  }

  return {
    highlighted: highlighted,
    faded: faded,
    markers: createMarkers(
      highlighted[0]!,
      highlighted[highlighted.length - 1]!,
      true,
    ),
  };
}
