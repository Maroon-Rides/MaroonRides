import {
  type Alert,
  Amenity,
  type Bus,
  DataSource,
  type Direction,
  type Route,
  type Stop,
  type StopSchedule,
  type TimeEstimate,
} from '$lib/data/types';
import { queryLogger } from '$lib/utils/logger';
import moment from 'moment';
import { createDependencyQuery, createSelectableQuery } from '../utils/queries';
import {
  useASAlerts,
  useASRoutes,
  useASStopAmenities,
  useASStopEstimate,
  useASStopSchedule,
  useASTimetableEstimate,
  useASVehicles,
} from './structure/aggie_spirit';

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

  const query = createDependencyQuery<Route[]>(() => ({
    queryKey: [QueryKey.ROUTE_LIST],
    queryFn: async () => {
      queryLogger.i(`Loaded ${asRouteList.data?.length} routes from Aggie Spirit`);
      return asRouteList.data!;
    },
    dependents: [asRouteList],
  }));

  return query;
};

export const useVehicles = (params: () => { route: Route | null }) => {
  const asVehiclesQuery = useASVehicles(params);

  const query = createSelectableQuery<Bus[], DataSource>(() => ({
    queryKey: [QueryKey.VEHICLES, params().route?.id],
    selector: params().route?.dataSource,
    queries: {
      [DataSource.AGGIE_SPIRIT]: asVehiclesQuery,
    },
    unsupportedValue: [],
    enabled: params().route !== null,
  }));

  return query;
};

export const useStopEstimate = (
  params: () => { route: Route; direction: Direction; stop: Stop },
) => {
  const asEstimateQuery = useASStopEstimate(params);

  const query = createSelectableQuery<TimeEstimate[], DataSource>(() => ({
    queryKey: [QueryKey.STOP_ESTIMATE, params().route.id, params().direction.id, params().stop.id],
    selector: params().route?.dataSource,
    queries: {
      [DataSource.AGGIE_SPIRIT]: asEstimateQuery,
    },
    unsupportedValue: [],
    enabled: params().route !== null,
  }));

  return query;
};

export const useTimetableEstimate = (params: () => { stop: Stop | null; date: moment.Moment }) => {
  const asTimetableEstimateQuery = useASTimetableEstimate(params);

  const query = createSelectableQuery<StopSchedule[], DataSource>(() => ({
    queryKey: [QueryKey.TIMETABLE_ESTIMATE, params().stop?.id, params().date.format('YYYY-MM-DD')],
    selector: params().stop?.dataSource,
    queries: {
      [DataSource.AGGIE_SPIRIT]: asTimetableEstimateQuery,
    },
    unsupportedValue: [],
    enabled: params().stop !== null,
  }));

  return query;
};

export const useStopAmenities = (
  params: () => { route: Route; direction: Direction; stop: Stop },
) => {
  const asStopAmenities = useASStopAmenities(params);

  const query = createSelectableQuery<Amenity[], DataSource>(() => ({
    queryKey: [QueryKey.STOP_AMENITIES, params().route.id, params().direction.id, params().stop.id],
    selector: params().stop?.dataSource,
    queries: {
      [DataSource.AGGIE_SPIRIT]: asStopAmenities,
    },
    unsupportedValue: [],
    enabled: params().stop !== null,
  }));

  return query;
};

export const useStopSchedule = (params: () => { stop: Stop | null; date: moment.Moment }) => {
  const asStopScheduleQuery = useASStopSchedule(params);

  const query = createSelectableQuery<StopSchedule[], DataSource>(() => ({
    queryKey: [QueryKey.STOP_SCHEDULE, params().stop?.id, params().date.format('YYYY-MM-DD')],
    selector: params().stop?.dataSource,
    queries: {
      [DataSource.AGGIE_SPIRIT]: asStopScheduleQuery,
    },
    unsupportedValue: [],
    enabled: params().stop !== null,
  }));

  return query;
};

export const useAlerts = (params: () => { route: Route | null }) => {
  const asAlertQuery = useASAlerts(params);

  const query = createSelectableQuery<Alert[], DataSource>(() => ({
    queryKey: [QueryKey.ALERTS, params().route?.id],
    selector: params().route?.dataSource,
    queries: {
      [DataSource.AGGIE_SPIRIT]: asAlertQuery,
    },
    unsupportedValue: [],
    enabled: params().route !== null,
  }));

  return query;
};
