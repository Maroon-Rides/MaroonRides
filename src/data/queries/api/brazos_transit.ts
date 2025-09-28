import {
  IAnnouncement,
  IRoute,
  IRouteStop,
  IVehicle,
} from '@data/typecheck/brazos_transit';
import {
  getAnnouncements,
  getAuthentication,
  getMapVehicles,
  getRoutes,
  getStopArrivalTimes,
} from 'brazos-transit-api';
import { useDependencyQuery, useLoggingQuery } from '../utils';

enum BTAPIQueryKey {
  AUTH_TOKEN = 'BTAPIAuthToken',
  ROUTES = 'BTAPIRoutes',
  MAP_VEHICLES = 'BTAPIMapVehicles',
  STOP_ARRIVAL_TIMES = 'BTAPIStopArrivalTimes',
  ANNOUNCEMENTS = 'BTAPIAnnouncements',
}

export const useAuthTokenAPI = () => {
  const query = useLoggingQuery<string>({
    label: BTAPIQueryKey.AUTH_TOKEN,
    queryKey: [BTAPIQueryKey.AUTH_TOKEN],
    queryFn: async () => {
      const authToken = await getAuthentication();
      return authToken;
    },
    staleTime: Infinity,
  });

  return query;
};

export const useRoutesAPI = () => {
  const authTokenQuery = useAuthTokenAPI();

  const query = useDependencyQuery<IRoute[]>({
    queryKey: [BTAPIQueryKey.ROUTES],
    queryFn: async () => {
      const routes = await getRoutes(authTokenQuery.data!);
      return routes;
    },
    enabled: authTokenQuery.isSuccess,
    staleTime: Infinity,
    dependents: [authTokenQuery],
  });

  return query;
};

export const useMapVehiclesAPI = () => {
  const authTokenQuery = useAuthTokenAPI();

  const query = useDependencyQuery<IVehicle[]>({
    queryKey: [BTAPIQueryKey.MAP_VEHICLES],
    queryFn: async () => {
      const mapVehicles = await getMapVehicles(authTokenQuery.data!);
      return mapVehicles;
    },
    enabled: authTokenQuery.isSuccess,
    staleTime: Infinity,
    dependents: [authTokenQuery],
  });

  return query;
};

export const useStopArrivalTimesAPI = (routes: string[]) => {
  const authTokenQuery = useAuthTokenAPI();

  const query = useDependencyQuery<IRouteStop[]>({
    queryKey: [BTAPIQueryKey.STOP_ARRIVAL_TIMES, ...routes],
    queryFn: async () => {
      const stopArrivalTimes = await getStopArrivalTimes(
        routes,
        authTokenQuery.data!,
      );
      return stopArrivalTimes;
    },
    enabled: authTokenQuery.isSuccess && routes.length > 0,
    staleTime: Infinity,
    dependents: [authTokenQuery],
  });

  return query;
};

export const useAnnouncementsAPI = () => {
  const authTokenQuery = useAuthTokenAPI();

  const query = useLoggingQuery<IAnnouncement[]>({
    label: BTAPIQueryKey.ANNOUNCEMENTS,
    queryKey: [BTAPIQueryKey.ANNOUNCEMENTS],
    queryFn: async () => {
      const announcements = await getAnnouncements();
      return announcements;
    },
    enabled: authTokenQuery.isSuccess,
    staleTime: Infinity,
  });

  return query;
};
