import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import {
  Alert,
  Amenity,
  Bus,
  DataSource,
  Direction,
  Route,
  Stop,
  StopSchedule,
  TimeEstimate,
} from '../datatypes';
import {
  useASAlerts,
  useASRoutes,
  useASStopAmenities,
  useASStopEstimate,
  useASStopSchedule,
  useASVehicles,
} from './structure/aggie_spirit';

enum QueryKey {
  ROUTE_LIST = 'MRRouteList',
  VEHICLES = 'MRVehicles',
  STOP_ESTIMATE = 'MRStopEstimate',
  STOP_AMENITIES = 'MRStopAmenities',
  STOP_SCHEDULE = 'MRStopSchedule',
  ALERTS = 'MRAlerts',
}

export const useRoutes = () => {
  const asRouteList = useASRoutes();

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

export const useStopSchedule = (stop: Stop | null, date: Date) => {
  const apiStopScheduleQuery = useASStopSchedule(stop, date);
  const query = useQuery<StopSchedule[]>({
    queryKey: [
      QueryKey.STOP_SCHEDULE,
      stop?.id,
      moment(date).format('YYYY-MM-DD'),
    ],
    queryFn: async () => {
      switch (stop?.dataSource) {
        case DataSource.AGGIE_SPIRIT:
          return apiStopScheduleQuery.data!;
        default:
          return [];
      }
    },
    enabled: apiStopScheduleQuery?.isSuccess,
  });

  return query;
};

export const useAlerts = (route: Route | null) => {
  const apiAlertQuery = useASAlerts(route);

  const query = useQuery<Alert[]>({
    queryKey: [
      QueryKey.STOP_SCHEDULE,
      apiAlertQuery.data,
      route,
    ],
    queryFn: async () => {
      switch (route?.dataSource) {
        case DataSource.AGGIE_SPIRIT:
          return apiAlertQuery.data!;
        default:
          return [];
      }
    },
    enabled: apiAlertQuery?.isSuccess,
  });

  return query;
}