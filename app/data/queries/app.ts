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
} from '../datatypes';
import {
  useASRouteList,
  useASStopAmenities,
  useASStopEstimate,
  useASVehicles,
} from './structure/aggie_spirit';

export enum QueryKey {
  ROUTE_LIST = 'MRRouteList',
  VEHICLES = 'MRVehicles',
  STOP_ESTIMATE = 'MRStopEstimate',
  STOP_AMENITIES = 'MRStopAmenities',
}

export const useRouteList = () => {
  const asRouteList = useASRouteList();

  const query = useQuery<Route[]>({
    queryKey: [QueryKey.ROUTE_LIST],
    queryFn: async () => {
      return asRouteList.data!;
    },
    staleTime: Infinity,
    refetchInterval: moment.duration(10, 'seconds').asMilliseconds(),
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
    staleTime: Infinity,
    refetchInterval: moment.duration(10, 'seconds').asMilliseconds(),
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
    staleTime: Infinity,
    refetchInterval: moment.duration(10, 'seconds').asMilliseconds(),
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
