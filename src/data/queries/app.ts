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
import { useDependencyQuery } from './utils';

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

  const query = useDependencyQuery<Route[]>({
    queryKey: [QueryKey.ROUTE_LIST],
    queryFn: async () => {
      return asRouteList.data!;
    },
    dependents: [asRouteList],
  });

  return query;
};

export const useVehicles = (route: Route | null) => {
  const asVehiclesQuery = useASVehicles(route);

  const query = useDependencyQuery<Bus[]>({
    queryKey: [QueryKey.VEHICLES, route?.id],
    queryFn: async () => {
      switch (route?.dataSource) {
        case DataSource.AGGIE_SPIRIT:
          return asVehiclesQuery!.data!;
        default:
          return [];
      }
    },
    dependents: asVehiclesQuery ? [asVehiclesQuery] : [],
  });

  return query;
};

export const useStopEstimate = (
  route: Route,
  direction: Direction,
  stop: Stop,
) => {
  const asEstimateQuery = useASStopEstimate(route, direction, stop);

  const query = useDependencyQuery<TimeEstimate[]>({
    queryKey: [QueryKey.STOP_ESTIMATE, route.id, direction.id, stop.id],
    queryFn: async () => {
      switch (route?.dataSource) {
        case DataSource.AGGIE_SPIRIT:
          return asEstimateQuery.data!;
        default:
          return [];
      }
    },
    dependents: [asEstimateQuery],
  });

  return query;
};

export const useStopAmenities = (
  route: Route,
  direction: Direction,
  stop: Stop,
) => {
  const asStopAmenities = useASStopAmenities(route, direction, stop);

  const query = useDependencyQuery<Amenity[]>({
    queryKey: [QueryKey.STOP_AMENITIES, route.id, direction.id, stop.id],
    queryFn: async () => {
      switch (route.dataSource) {
        case DataSource.AGGIE_SPIRIT:
          return asStopAmenities.data!;
        case DataSource.BRAZOS_TRANSIT:
          return [];
      }
    },
    dependents: [asStopAmenities],
  });

  return query;
};

export const useStopSchedule = (stop: Stop | null, date: moment.Moment) => {
  const apiStopScheduleQuery = useASStopSchedule(stop, date);
  const query = useDependencyQuery<StopSchedule[]>({
    queryKey: [QueryKey.STOP_SCHEDULE, stop?.id, date.format('YYYY-MM-DD')],
    queryFn: async () => {
      switch (stop?.dataSource) {
        case DataSource.AGGIE_SPIRIT:
          return apiStopScheduleQuery.data!;
        default:
          return [];
      }
    },
    dependents: [apiStopScheduleQuery],
  });

  return query;
};

export const useAlerts = (route: Route | null) => {
  const apiAlertQuery = useASAlerts(route);

  const query = useDependencyQuery<Alert[]>({
    queryKey: [QueryKey.ALERTS, route],
    queryFn: async () => {
      switch (route?.dataSource) {
        case DataSource.AGGIE_SPIRIT:
          return apiAlertQuery.data!;
        default:
          return [];
      }
    },
    dependents: [apiAlertQuery],
  });

  return query;
};
