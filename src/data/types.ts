import moment from 'moment';
import { LatLng } from 'react-native-maps';
import { IAmenity } from './typecheck/aggie_spirit';

export enum Amenity {
  AIR_CONDITIONING = 'Air Conditioning',
  WHEELCHAIR_ACCESSIBLE = 'Wheelchair Accessible',
  WHEELCHAIR_LIFT = 'Wheelchair Lift',
  BICYCLE_RACK = 'Bicycle Rack',
  SHELTER = 'Shelter',
}

export namespace Amenity {
  export function fromAPI(api: IAmenity[]): Amenity[] {
    return api
      .map((item) => {
        return Object.values(Amenity).find((amenity) => amenity === item.name);
      })
      .filter((amenity): amenity is Amenity => amenity !== undefined);
  }
}

export enum DataSource {
  AGGIE_SPIRIT,
  BRAZOS_TRANSIT,
}

export type Location = LatLng;

export interface FromDataSource {
  dataSource: DataSource;
}

export interface Stop extends FromDataSource {
  name: string;
  id: string;
  location: Location;
  isLastOnDirection: boolean;
}

export interface PathLocation extends Location {
  isStop: boolean;
}

export interface Route extends FromDataSource {
  name: string;
  id: string;
  routeCode: string;
  tintColor: string;
  directions: Direction[];
  bounds: Location[];
}

export interface Direction extends FromDataSource {
  pathPoints: PathLocation[];
  name: string;
  id: string;
  stops: Stop[];
  isOnlyDirection: boolean;
}

export interface Bus extends FromDataSource {
  location: Location;
  heading: number;
  amenities: Amenity[];
  capacity: number;
  speed: number;
  id: string;
  direction: Direction;
  name: string;
}

export interface TimeEstimate extends FromDataSource {
  estimatedTime: moment.Moment | null;
  scheduledTime: moment.Moment;
  tripPointId?: string;
  isRealTime: boolean;
  isCancelled?: boolean;
}

export interface StopSchedule extends FromDataSource {
  route: Route;
  direction: Direction;
  stop: Stop;
  timetable: TimeEstimate[];
  isEndOfRoute: boolean;
}

export interface Alert extends FromDataSource {
  id: string;
  title: string;
  description: string;
  affectedRoutes: Route[];
  originalRoute: Route;
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

export interface PlaceSuggestion extends FromDataSource {
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

export enum MovementType {
  BUS = 'bus',
  WALKING = 'walking',
  END = 'end',
  WAITING = 'waiting',
}

export interface WalkingInstruction {
  stepNumber: number;
  instruction: string;
}

export interface PlanInstruction {
  movementType: MovementType;
  time: string;
  instruction: string;
  detailedWalkingInstructions: WalkingInstruction[];
}

export interface PlanItem extends FromDataSource {
  startTime: number;
  endTime: number;
  endTimeText: string;
  instructions: PlanInstruction[];
}
