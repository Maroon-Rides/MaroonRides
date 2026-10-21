import type { TripItinerary, TripLeg, TripWalkStep } from '$lib/api/client';
import { PlanOption, type RoutePlanMarkedPoint, type RoutePlanPoint } from '$lib/data/types';
import { formatClock } from '$lib/utils/time';
import { decode } from '@googlemaps/polyline-codec';
import { findLast, last } from 'lodash-es';
import { DateTime, Duration } from 'luxon';

export interface RoutePlanMapComponents {
  highlighted: RoutePlanPoint[];
  faded: RoutePlanPoint[][];
  markers: RoutePlanMarkedPoint[];
}

export interface TimelineStep {
  icon: PlanOption;
  time: string;
  content: string;
  instructions: TripWalkStep[];
}

export function hasBusLeg(plan: TripItinerary): boolean {
  return (plan.legs ?? []).some((leg) => PlanOption.fromLegType(leg.type) === PlanOption.BUS);
}

export function describeLeg(leg: TripLeg): string {
  switch (leg.type) {
    case 'walk':
      return `Walk to ${leg.to.name}`;
    case 'wait':
      return `Wait at ${leg.to.name}`;
    case 'ride': {
      const { ride } = leg;
      if (!ride) return `Ride to ${leg.to.name}`;
      const stops = `${ride.stopCount} ${ride.stopCount === 1 ? 'stop' : 'stops'}`;
      return `Board ${ride.routeShortName} ${ride.headsign}, get off at ${leg.to.name} (${stops})`;
    }
  }
}

export function formatTripDuration(plan: TripItinerary): string {
  const { hours, minutes } = DateTime.fromISO(plan.arriveAt)
    .diff(DateTime.fromISO(plan.departAt), ['hours', 'minutes'])
    .toObject();
  return Duration.fromObject({
    ...(hours && { hours }),
    minutes: Math.floor(minutes ?? 0),
  }).toHuman();
}

export function arrivalLabel(plan: TripItinerary): string {
  return `Arrive at ${formatClock(plan.arriveAt)}`;
}

export function toTimelineSteps(plan: TripItinerary): TimelineStep[] {
  const legs = plan.legs ?? [];
  return [
    ...legs.map((leg) => ({
      icon: PlanOption.fromLegType(leg.type),
      time: formatClock(leg.startAt),
      content: describeLeg(leg),
      instructions: leg.walk?.steps ?? [],
    })),
    {
      icon: PlanOption.END,
      time: formatClock(plan.arriveAt),
      content: `Arrive at ${legs.at(-1)?.to.name ?? ''}`,
      instructions: [],
    },
  ];
}

function createMarkers(start: RoutePlanPoint, end: RoutePlanPoint): RoutePlanMarkedPoint[] {
  return [
    { ...start, icon: 'point', isOrigin: true },
    { ...end, icon: 'point', isOrigin: false },
  ];
}

export function processRoutePlanMapComponents(
  routePlan: TripItinerary | null,
  selectedStep: number | null,
): RoutePlanMapComponents {
  if (!routePlan) return { highlighted: [], faded: [], markers: [] };

  const pathPoints = (routePlan.legs ?? [])
    .flatMap((leg, stepIndex) =>
      (leg.path ? decode(leg.path) : []).map(([latitude, longitude]) => ({
        latitude,
        longitude,
        stepIndex,
      })),
    )
    .map((point, pathIndex) => ({ ...point, pathIndex }));

  if (selectedStep === null) {
    return {
      highlighted: pathPoints,
      faded: [],
      markers: pathPoints.length === 0 ? [] : createMarkers(pathPoints[0]!, last(pathPoints)!),
    };
  }

  const highlighted = pathPoints.filter((point) => point.stepIndex === selectedStep);
  const faded = [
    pathPoints.filter((point) => point.stepIndex < selectedStep),
    pathPoints.filter((point) => point.stepIndex > selectedStep),
  ];

  if (highlighted.length > 0) {
    return { highlighted, faded, markers: createMarkers(highlighted[0]!, last(highlighted)!) };
  }

  // A step with no path of its own, like the arrival, sits where the last step ended.
  const lastPoint = findLast(pathPoints, (point) => point.stepIndex === selectedStep - 1);
  if (!lastPoint) return { highlighted: [], faded, markers: [] };

  return {
    highlighted: [],
    faded,
    markers: [
      {
        latitude: lastPoint.latitude,
        longitude: lastPoint.longitude,
        icon: lastPoint.pathIndex === pathPoints.length - 1 ? 'point' : 'wait',
        isOrigin: false,
      },
    ],
  };
}
