import {
  IAnnouncement,
  IRoute,
  IRouteStop,
  IVehicle,
} from '@data/typecheck/brazos_transit';
import {
  getAnnouncements,
  getAuthentication,
  getBaseData,
  getNextStopTimes,
  getVehicleLocations,
} from 'brazos-transit-api';
import { useDependencyQuery, useLoggingQuery } from '../utils';

enum BTAPIQueryKey {
  AUTH_TOKEN = 'BTAPIAuthToken',
  BASE_DATA = 'BTAPIBaseData',
  VEHICLE_LOCATIONS = 'BTAPIVehicleLocations',
  NEXT_STOP_TIMES = 'BTAPINextStopTimes',
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

export const useBaseDataAPI = () => {
  const authTokenQuery = useAuthTokenAPI();

  const query = useDependencyQuery<IRoute[]>({
    queryKey: [BTAPIQueryKey.BASE_DATA],
    queryFn: async () => {
      const baseData = await getBaseData(authTokenQuery.data!);
      return baseData;
    },
    enabled: authTokenQuery.isSuccess,
    staleTime: Infinity,
    dependents: [authTokenQuery],
  });

  return query;
};

export const useVehicleLocationsAPI = () => {
  const authTokenQuery = useAuthTokenAPI();

  const query = useDependencyQuery<IVehicle[]>({
    queryKey: [BTAPIQueryKey.VEHICLE_LOCATIONS],
    queryFn: async () => {
      const vehicleLocations = await getVehicleLocations(authTokenQuery.data!);
      return vehicleLocations;
    },
    enabled: authTokenQuery.isSuccess,
    staleTime: Infinity,
    dependents: [authTokenQuery],
  });

  return query;
};

export const useNextStopTimesAPI = (routes: string[]) => {
  const authTokenQuery = useAuthTokenAPI();

  const query = useDependencyQuery<IRouteStop[]>({
    queryKey: [BTAPIQueryKey.NEXT_STOP_TIMES, ...routes],
    queryFn: async () => {
      const nextStopTimes = await getNextStopTimes(
        routes,
        authTokenQuery.data!,
      );
      return nextStopTimes;
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
