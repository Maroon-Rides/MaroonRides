import moment from 'moment';

export enum Amentity {
  AIR_CONDITIONING = 'Air Conditioning',
  WHEELCHAIR_ACCESSIBLE = 'Wheelchair Accessible',
  WHEELCHAIR_LIFT = 'Wheelchair Lift',
  BICYCLE_RACK = 'Bicycle Rack',
  SHELTER = 'Shelter',
}

export interface Stop {
  name: string;
  id: string;
  location: Location;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface PathLocation extends Location {
  isStop: boolean;
}

export interface Route {
  name: string;
  id: string;
  routeCode: string;
  tintColor: string;
  directions: Direction[];
}

export interface Direction {
  pathPoints: PathLocation[];
  name: string;
  id: string;
  stops: Stop[];
  isOnlyDirection: boolean;
}

export interface Bus {
  location: Location;
  heading: number;
  amenities: Amentity[];
  capacity: number;
  speed: number;
  id: string;
  direction: Direction;
}

export interface TimeEstimate {
  estimatedTime: moment.Moment;
  scheduledTime: moment.Moment;
  isRealTime: boolean;
}

export interface Alert {
  title: string;
  description: string;
  affectedRoutes: Route[];
}

export type Timetable = Map<string, TimeEstimate[]>;
