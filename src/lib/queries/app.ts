import { queryLogger } from '@lib/utils/logger';
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
} from '../types';
import {
  useASAlerts,
  useASRoutes,
  useASStopAmenities,
  useASStopEstimate,
  useASStopSchedule,
  useASTimetableEstimate,
  useASVehicles,
} from './structure/aggie_spirit';
import { useDependencyQuery, useSelectableQuery } from './utils';

export enum QueryKey {
  ROUTE_LIST = 'MRRouteList',
  VEHICLES = 'MRVehicles',
  STOP_ESTIMATE = 'MRStopEstimate',
  TIMETABLE_ESTIMATE = 'MRTimetableEstimate',
  STOP_AMENITIES = 'MRStopAmenities',
  STOP_SCHEDULE = 'MRStopSchedule',
  ALERTS = 'MRAlerts',
}

// prevents having to reprocess data every time theme or favorites change
export const useRoutes = () => {
  const asRouteList = useASRoutes();

  const query = useDependencyQuery<Route[]>({
    queryKey: [QueryKey.ROUTE_LIST],
    queryFn: async () => {
      queryLogger.i(
        `Loaded ${asRouteList.data?.length} routes from Aggie Spirit`,
      );
      return asRouteList.data!;
    },
    dependents: [asRouteList],
  });

  return query;
};

export const useVehicles = (route: Route | null) => {
  const asVehiclesQuery = useASVehicles(route);

  const query = useSelectableQuery<Bus[], DataSource>({
    queryKey: [QueryKey.VEHICLES, route?.id],
    selector: route?.dataSource,
    queries: {
      [DataSource.AGGIE_SPIRIT]: asVehiclesQuery,
    },
    unsupportedValue: [],
    enabled: route !== null,
  });

  return query;
};

export const useStopEstimate = (
  route: Route,
  direction: Direction,
  stop: Stop,
) => {
  const asEstimateQuery = useASStopEstimate(route, direction, stop);

  const query = useSelectableQuery<TimeEstimate[], DataSource>({
    queryKey: [QueryKey.STOP_ESTIMATE, route.id, direction.id, stop.id],
    selector: route?.dataSource,
    queries: {
      [DataSource.AGGIE_SPIRIT]: asEstimateQuery,
    },
    unsupportedValue: [],
    enabled: route !== null,
  });

  return query;
};

export const useTimetableEstimate = (
  stop: Stop | null,
  date: moment.Moment,
) => {
  const asTimetableEstimateQuery = useASTimetableEstimate(stop, date);

  const query = useSelectableQuery<StopSchedule[], DataSource>({
    queryKey: [
      QueryKey.TIMETABLE_ESTIMATE,
      stop?.id,
      date.format('YYYY-MM-DD'),
    ],
    selector: stop?.dataSource,
    queries: {
      [DataSource.AGGIE_SPIRIT]: asTimetableEstimateQuery,
    },
    unsupportedValue: [],
    enabled: stop !== null,
  });

  return query;
};

export const useStopAmenities = (
  route: Route,
  direction: Direction,
  stop: Stop,
) => {
  const asStopAmenities = useASStopAmenities(route, direction, stop);

  const query = useSelectableQuery<Amenity[], DataSource>({
    queryKey: [QueryKey.STOP_AMENITIES, route.id, direction.id, stop.id],
    selector: stop?.dataSource,
    queries: {
      [DataSource.AGGIE_SPIRIT]: asStopAmenities,
    },
    unsupportedValue: [],
    enabled: stop !== null,
  });

  return query;
};

export const useStopSchedule = (stop: Stop | null, date: moment.Moment) => {
  const asStopScheduleQuery = useASStopSchedule(stop, date);

  const query = useSelectableQuery<StopSchedule[], DataSource>({
    queryKey: [QueryKey.STOP_SCHEDULE, stop?.id, date.format('YYYY-MM-DD')],
    selector: stop?.dataSource,
    queries: {
      [DataSource.AGGIE_SPIRIT]: asStopScheduleQuery,
    },
    unsupportedValue: [],
    enabled: stop !== null,
  });

  return query;
};

export const useAlerts = (route: Route | null) => {
  const asAlertQuery = useASAlerts(route);

  const query = useSelectableQuery<Alert[], DataSource>({
    queryKey: [QueryKey.ALERTS, route?.id],
    selector: route?.dataSource,
    queries: {
      [DataSource.AGGIE_SPIRIT]: asAlertQuery,
    },
    unsupportedValue: [],
    enabled: route !== null,
  });

  return query;
};
