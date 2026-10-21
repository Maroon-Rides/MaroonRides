import {
  AccessibilityIcon,
  AirVentIcon,
  BikeIcon,
  Bus as BusIcon,
  Clock,
  Footprints,
  HouseIcon,
  LocateFixed,
  MapPin,
  OctagonPauseIcon,
} from '@lucide/svelte';
import type { TripLegType } from '$lib/api/client';
import type { DateTime } from 'luxon';

export enum Amenity {
  AIR_CONDITIONING = 'AIR_CONDITIONING',
  WHEELCHAIR_ACCESSIBLE = 'WHEELCHAIR_ACCESSIBLE',
  WHEELCHAIR_LIFT = 'WHEELCHAIR_LIFT',
  BICYCLE_RACK = 'BICYCLE_RACK',
  SHELTER = 'SHELTER',
  TIME_POINT = 'TIME_POINT',
}

export namespace Amenity {
  export function getIcon(amenity: Amenity) {
    switch (amenity) {
      case Amenity.AIR_CONDITIONING:
        return AirVentIcon;
      case Amenity.WHEELCHAIR_ACCESSIBLE:
        return AccessibilityIcon;
      case Amenity.WHEELCHAIR_LIFT:
        return AccessibilityIcon;
      case Amenity.BICYCLE_RACK:
        return BikeIcon;
      case Amenity.SHELTER:
        return HouseIcon;
      case Amenity.TIME_POINT:
        return OctagonPauseIcon;
    }
  }
}

export type Location = {
  latitude: number;
  longitude: number;
};

export interface Stop {
  id: string;
  name: string;
  location: Location;
  amenities: Amenity[];
  isTimepoint: boolean;
  isLastOnDirection: boolean;
}

export interface Route {
  id: string;
  name: string;
  routeCode: string;
  lightColor: string;
  darkColor: string;
  directions: Direction[];
  bounds: Location[];
}

export interface Direction {
  id: string;
  name: string;
  pathPoints: Location[];
  stops: Stop[];
  isOnlyDirection: boolean;
}

export interface Bus {
  id: string;
  name: string;
  location: Location;
  heading: number;
  speed: number;
  amenities: Amenity[];
  capacity: number;
  direction: Direction;
  route: Route;
}

export interface TimeEstimate {
  estimatedTime: DateTime | null;
  scheduledTime: DateTime;
  isRealTime: boolean;
}

export enum EstimateSource {
  LOADING = 'loading',
  LIVE = 'live',
  SCHEDULE = 'schedule',
  UNAVAILABLE = 'unavailable',
}

export interface StopEstimates {
  source: EstimateSource;
  estimates: TimeEstimate[];
}

export interface TimetableDeparture {
  scheduledTime: DateTime;
  estimatedTime: DateTime | null;
  isCancelled: boolean;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
}

// Route Planning
export enum PlaceType {
  STOP = 'stop',
  MY_LOCATION = 'my_location',
}
export enum Deadline {
  LEAVE_BY = 'leave',
  ARRIVE_BY = 'arrive',
}

export const MY_LOCATION_ID = 'my-location';

export enum PlanOption {
  BUS = 'bus',
  WALKING = 'walking',
  END = 'end',
  WAITING = 'waiting',
  MY_LOCATION = MY_LOCATION_ID,
}
export namespace PlanOption {
  export function fromLegType(type: TripLegType): PlanOption {
    switch (type) {
      case 'ride':
        return PlanOption.BUS;
      case 'walk':
        return PlanOption.WALKING;
      case 'wait':
        return PlanOption.WAITING;
    }
  }
  export function getIcon(planOption: PlanOption) {
    switch (planOption) {
      case PlanOption.BUS:
        return BusIcon;
      case PlanOption.WALKING:
        return Footprints;
      case PlanOption.END:
        return MapPin;
      case PlanOption.WAITING:
        return Clock;
      case PlanOption.MY_LOCATION:
        return LocateFixed;
    }
  }
}
export interface PlaceSuggestion {
  id: string;
  name: string;
  description: string;
  location?: Location;
  type: PlaceType;
}

export const MyLocation = {
  id: MY_LOCATION_ID,
  name: 'My Location',
  description: '',
  location: undefined,
  type: PlaceType.MY_LOCATION,
} as PlaceSuggestion;

export interface RoutePlanPoint extends Location {
  stepIndex: number;
  pathIndex: number;
}

export interface RoutePlanMarkedPoint extends Location {
  icon: 'point' | 'wait';
  isOrigin: boolean;
}
