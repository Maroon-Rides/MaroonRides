import '@bacons/text-decoder/install';
import {
  GetBaseDataResponseSchema,
  GetNextDepartTimesResponseSchema,
  GetPatternPathsResponseSchema,
  GetStopEstimatesResponseSchema,
  GetStopSchedulesResponseSchema,
  GetVehiclesResponseSchema,
  IGetBaseDataResponse,
  IGetNextDepartTimesResponse,
  IGetPatternPathsResponse,
  IGetStopEstimatesResponse,
  IGetVehiclesResponse,
  IMapServiceInterruption,
} from '@data/typecheck/aggie_spirit';
import { appLogger } from '@data/utils/logger';
import {
  getBaseData,
  getNextDepartureTimes,
  getPatternPaths,
  getStopEstimates,
  getStopSchedules,
  getVehicles,
} from 'aggie-spirit-api';
import moment from 'moment';
import { useDependencyQuery, useLoggingQuery } from '../utils';

export type Headers = { [key: string]: string };

enum ASAPIQueryKey {
  AUTH_CODE = 'ASAPIAuthCode',
  AUTH_TOKEN = 'ASAPIAuthToken',
  ROUTE_PLAN_AUTH_TOKEN = 'ASAPIRoutePlanAuthToken',
  BASE_DATA = 'ASAPIBaseData',
  PATTERN_PATHS = 'ASAPIPatternPaths',
  SERVICE_INTERRUPTIONS = 'ASAPIServiceInterruptions',
  STOP_ESTIMATE = 'ASAPIStopEstimate',
  TIMETABLE_ESTIMATE = 'ASAPITimetableEstimate',
  STOP_AMENITIES = 'ASAPIStopAmenities',
  STOP_SCHEDULE = 'ASAPIStopSchedule',
  VEHICLES = 'ASAPIVehicles',
}

export const useAuthCodeAPI = () => {
  const query = useLoggingQuery<string>({
    label: ASAPIQueryKey.AUTH_CODE,
    queryKey: [ASAPIQueryKey.AUTH_CODE],
    queryFn: async () => {
      const authCodeB64 = await (
        await fetch('https://auth.maroonrides.app')
      ).text();
      return atob(authCodeB64);
    },
    staleTime: Infinity,
  });

  return query;
};

export const useAuthTokenAPI = () => {
  const authCodeQuery = useAuthCodeAPI();

  const query = useDependencyQuery<Headers>({
    queryKey: [ASAPIQueryKey.AUTH_TOKEN],
    queryFn: async () => {
      let data = authCodeQuery.data!;
      data += '\ngetAuthentication()';
      const headers = await eval(data);
      return headers;
    },
    staleTime: moment.duration(15, 'minutes'),
    refetchInterval: moment.duration(15, 'minutes'),
    dependents: [authCodeQuery],
  });

  return query;
};

export const useRoutePlanAuthTokenAPI = (queryString: string) => {
  const authCodeQuery = useAuthCodeAPI();

  const query = useDependencyQuery<Headers>({
    queryKey: [ASAPIQueryKey.ROUTE_PLAN_AUTH_TOKEN],
    queryFn: async () => {
      let qsAdded = authCodeQuery.data!.replace(
        'ROUTE_PLAN_QUERY_STRING',
        queryString,
      );
      qsAdded += '\ngetRoutePlanAuthentication()';

      const headers = await eval(qsAdded);
      return headers;
    },
    staleTime: moment.duration(15, 'minutes'),
    refetchInterval: moment.duration(15, 'minutes'),
    enabled: queryString !== '',
    dependents: [authCodeQuery],
  });

  return query;
};

export const useBaseDataAPI = () => {
  const authTokenQuery = useAuthTokenAPI();

  const query = useDependencyQuery<IGetBaseDataResponse>({
    queryKey: [ASAPIQueryKey.BASE_DATA],
    queryFn: async () => {
      const baseData = await getBaseData(authTokenQuery.data!);
      GetBaseDataResponseSchema.parse(baseData);

      return baseData;
    },
    staleTime: Infinity,
    dependents: [authTokenQuery],
  });

  return query;
};

export const usePatternPathsAPI = () => {
  const authTokenQuery = useAuthTokenAPI();
  const baseDataQuery = useBaseDataAPI();

  const query = useDependencyQuery<IGetPatternPathsResponse>({
    queryKey: [ASAPIQueryKey.PATTERN_PATHS],
    queryFn: async () => {
      const baseData = baseDataQuery.data as IGetBaseDataResponse;

      const patternPaths = await getPatternPaths(
        baseData.routes.map((route) => route.key),
        authTokenQuery.data!,
      );
      GetPatternPathsResponseSchema.parse(patternPaths);

      return patternPaths;
    },
    dependents: [authTokenQuery, baseDataQuery],
    staleTime: moment.duration(30, 'minutes'),
    refetchInterval: moment.duration(30, 'minutes'),
  });

  return query;
};

export const useServiceInterruptionsAPI = () => {
  const baseDataQuery = useBaseDataAPI();

  return useDependencyQuery<IMapServiceInterruption[]>({
    queryKey: [ASAPIQueryKey.SERVICE_INTERRUPTIONS],
    queryFn: async () => {
      const baseData = baseDataQuery.data as IGetBaseDataResponse;
      return baseData.serviceInterruptions;
    },
    enabled: baseDataQuery.isSuccess,
    staleTime: moment.duration(30, 'minutes'),
    refetchInterval: moment.duration(30, 'minutes'),
    dependents: [baseDataQuery],
  });
};

export const useStopEstimateAPI = (
  routeKey: string,
  directionKey: string,
  stopCode: string,
) => {
  const authTokenQuery = useAuthTokenAPI();

  return useDependencyQuery<IGetNextDepartTimesResponse>({
    queryKey: [ASAPIQueryKey.STOP_ESTIMATE, routeKey, directionKey, stopCode],
    queryFn: async () => {
      const response = await getNextDepartureTimes(
        routeKey,
        [directionKey],
        stopCode,
        authTokenQuery.data!,
      );
      GetNextDepartTimesResponseSchema.parse(response);

      return response as IGetNextDepartTimesResponse;
    },
    enabled: routeKey !== '' && directionKey !== '' && stopCode !== '',
    dependents: [authTokenQuery],
    staleTime: moment.duration(30, 'seconds'),
    refetchInterval: moment.duration(30, 'seconds'),
  });
};

export const useTimetableEstimateAPI = (stopCode: string, date: Date) => {
  const authTokenQuery = useAuthTokenAPI();

  return useDependencyQuery<IGetStopEstimatesResponse>({
    queryKey: [
      ASAPIQueryKey.TIMETABLE_ESTIMATE,
      stopCode,
      moment(date).format('YYYY-MM-DD'),
    ],
    queryFn: async () => {
      const response = await getStopEstimates(
        stopCode,
        date,
        authTokenQuery.data!,
      );
      GetStopEstimatesResponseSchema.parse(response);

      return response;
    },
    enabled: authTokenQuery.isSuccess && stopCode !== '' && date !== null,
    staleTime: 30000,
    refetchInterval: 30000,
    dependents: [authTokenQuery],
  });
};

export const useStopScheduleAPI = (stopCode: string, date: Date) => {
  const authTokenQuery = useAuthTokenAPI();

  return useDependencyQuery<IGetStopEstimatesResponse>({
    queryKey: [
      ASAPIQueryKey.STOP_SCHEDULE,
      stopCode,
      moment(date).format('YYYY-MM-DD'),
    ],
    queryFn: async () => {
      const response = await getStopSchedules(
        stopCode,
        date,
        authTokenQuery.data!,
      );
      GetStopSchedulesResponseSchema.parse(response);

      return response;
    },
    enabled: stopCode !== '' && date !== null,
    dependents: [authTokenQuery],
    staleTime: moment.duration(30, 'seconds'),
    refetchInterval: moment.duration(30, 'seconds'),
  });
};

export const useVehiclesAPI = (routeKey: string) => {
  const authTokenQuery = useAuthTokenAPI();

  return useDependencyQuery<IGetVehiclesResponse[0]>({
    queryKey: [ASAPIQueryKey.VEHICLES, routeKey],
    queryFn: async () => {
      let busesResponse = (await getVehicles(
        [routeKey],
        authTokenQuery.data!,
      )) as IGetVehiclesResponse;

      GetVehiclesResponseSchema.parse(busesResponse);

      if (busesResponse.length === 0) {
        appLogger.w(`No vehicles data returned for route: ${routeKey}`);
        return null;
      }

      return busesResponse[0];
    },
    enabled: routeKey !== '',
    dependents: [authTokenQuery],
    staleTime: moment.duration(10, 'seconds'),
    refetchInterval: moment.duration(10, 'seconds'),
  });
};
