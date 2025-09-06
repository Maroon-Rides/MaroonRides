import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import {
  Amenity,
  Bus,
  DataSource,
  Direction,
  Route,
  Stop,
  TimeEstimate,
  Timetable,
} from '../datatypes';
import {
  useASRouteList,
  useASStopAmenities,
  useASStopEstimate,
  useASTimetable,
  useASVehicles,
} from './structure/aggie_spirit';

export enum QueryKey {
  ROUTE_LIST = 'MRRouteList',
  VEHICLES = 'MRVehicles',
  STOP_ESTIMATE = 'MRStopEstimate',
  STOP_AMENITIES = 'MRStopAmenities',
  TIMETABLE = 'MRTimetable',
}

export const useRouteList = () => {
  const asRouteList = useASRouteList();

  const query = useQuery<Route[]>({
    queryKey: [QueryKey.ROUTE_LIST],
    queryFn: async () => {
      return asRouteList.data!;
    },
    enabled: asRouteList.isSuccess,
  });

  return query;
};

export const useVehicles = (route: Route | null) => {
  const asVehiclesQuery = useASVehicles(route);

  const query = useQuery<Bus[]>({
    queryKey: [QueryKey.VEHICLES, route?.id],
    queryFn: async () => {
      switch (route?.dataSource) {
        case DataSource.AGGIE_SPIRIT:
          return asVehiclesQuery!.data!;
        default:
          return [];
      }
    },
    enabled: asVehiclesQuery?.isSuccess && !!route,
  });

  return query;
};

export const useStopEstimate = (
  route: Route,
  direction: Direction,
  stop: Stop,
) => {
  const asEstimateQuery = useASStopEstimate(route, direction, stop);

  const query = useQuery<TimeEstimate[]>({
    queryKey: [QueryKey.STOP_ESTIMATE, route.id, direction.id, stop.id],
    queryFn: async () => {
      switch (route?.dataSource) {
        case DataSource.AGGIE_SPIRIT:
          return asEstimateQuery.data!;
        default:
          return [];
      }
    },
    enabled: asEstimateQuery?.isSuccess,
  });

  return query;
};

export const useStopAmenities = (
  route: Route,
  direction: Direction,
  stop: Stop,
) => {
  const asStopAmenities = useASStopAmenities(route, direction, stop);

  const query = useQuery<Amenity[]>({
    queryKey: [QueryKey.STOP_AMENITIES, route.id, direction.id, stop.id],
    queryFn: async () => {
      switch (route.dataSource) {
        case DataSource.AGGIE_SPIRIT:
          return asStopAmenities.data!;
        case DataSource.BRAZOS_TRANSIT:
          return [];
      }
    },
    enabled: asStopAmenities?.isSuccess,
  });

  return query;
};

export const useTimetable = (stop: Stop, date: Date) => {
  const apiTimetableQuery = useASTimetable(stop, date);
  const query = useQuery<Timetable>({
    queryKey: [QueryKey.TIMETABLE, stop.id, moment(date).format('YYYY-MM-DD')],
    queryFn: async () => {
      switch (stop.dataSource) {
        case DataSource.AGGIE_SPIRIT:
          return apiTimetableQuery.data!;
        default:
          return new Map<string, TimeEstimate[]>();
      }
    },
    enabled: apiTimetableQuery?.isSuccess,
  });

  return query;
};
