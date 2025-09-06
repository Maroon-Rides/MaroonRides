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
  IGetStopSchedulesResponse,
  IGetVehiclesResponse,
  IMapServiceInterruption,
} from '@data/utils/interfaces';
import { useQuery } from '@tanstack/react-query';
import {
  getBaseData,
  getNextDepartureTimes,
  getPatternPaths,
  getStopEstimates,
  getStopSchedules,
  getVehicles,
} from 'aggie-spirit-api';
import moment from 'moment';

export type Headers = { [key: string]: string };

export const useAuthCodeAPI = () => {
  const query = useQuery<string>({
    queryKey: ['authCode'],
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

  const query = useQuery<Headers>({
    queryKey: ['authToken'],
    queryFn: async () => {
      let data = authCodeQuery.data!;
      data += '\ngetAuthentication()';
      const headers = await eval(data);
      return headers;
    },
    staleTime: moment.duration(15, 'minutes').asMilliseconds(),
    refetchInterval: moment.duration(15, 'minutes').asMilliseconds(),
    enabled: authCodeQuery.isSuccess,
  });

  return query;
};

export const useRoutePlanAuthTokenAPI = (queryString: string) => {
  const authCodeQuery = useAuthCodeAPI();

  const query = useQuery<Headers>({
    queryKey: ['routePlanAuthToken'],
    queryFn: async () => {
      let qsAdded = authCodeQuery.data!.replace(
        'ROUTE_PLAN_QUERY_STRING',
        queryString,
      );
      qsAdded += '\ngetRoutePlanAuthentication()';

      const headers = await eval(qsAdded);
      return headers;
    },
    staleTime: moment.duration(15, 'minutes').asMilliseconds(),
    refetchInterval: moment.duration(15, 'minutes').asMilliseconds(),
    enabled: authCodeQuery.isSuccess && queryString !== '',
  });

  return query;
};

export const useBaseDataAPI = () => {
  const authTokenQuery = useAuthTokenAPI();

  const query = useQuery<IGetBaseDataResponse>({
    queryKey: ['baseData'],
    queryFn: async () => {
      const baseData = await getBaseData(authTokenQuery.data!);
      GetBaseDataResponseSchema.parse(baseData);

      return baseData;
    },
    enabled: authTokenQuery.isSuccess,
    staleTime: Infinity,
  });

  return query;
};

export const usePatternPathsAPI = () => {
  const authTokenQuery = useAuthTokenAPI();
  const baseDataQuery = useBaseDataAPI();

  const query = useQuery<IGetPatternPathsResponse>({
    queryKey: ['patternPaths', baseDataQuery.data],
    queryFn: async () => {
      const baseData = baseDataQuery.data as IGetBaseDataResponse;

      const patternPaths = await getPatternPaths(
        baseData.routes.map((route) => route.key),
        authTokenQuery.data!,
      );
      GetPatternPathsResponseSchema.parse(patternPaths);

      return patternPaths;
    },
    enabled: baseDataQuery.isSuccess,
    staleTime: moment.duration(30, 'minutes').asMilliseconds(),
    refetchInterval: moment.duration(30, 'minutes').asMilliseconds(),
  });

  return query;
};

export const useServiceInterruptionsAPI = () => {
  const baseDataQuery = useBaseDataAPI();

  return useQuery<IMapServiceInterruption[]>({
    queryKey: ['serviceInterruptions'],
    queryFn: async () => {
      const baseData = baseDataQuery.data as IGetBaseDataResponse;
      return baseData.serviceInterruptions;
    },
    enabled: baseDataQuery.isSuccess,
    staleTime: moment.duration(30, 'minutes').asMilliseconds(),
    refetchInterval: moment.duration(30, 'minutes').asMilliseconds(),
  });
};

export const useStopEstimateAPI = (
  routeKey: string,
  directionKey: string,
  stopCode: string,
) => {
  const authTokenQuery = useAuthTokenAPI();

  return useQuery<IGetNextDepartTimesResponse>({
    queryKey: ['stopEstimate', routeKey, directionKey, stopCode],
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
    enabled:
      authTokenQuery.isSuccess &&
      routeKey !== '' &&
      directionKey !== '' &&
      stopCode !== '',
    staleTime: moment.duration(30, 'seconds').asMilliseconds(),
    refetchInterval: moment.duration(30, 'seconds').asMilliseconds(),
  });
};

export const useTimetableEstimateAPI = (stopCode: string, date: Date) => {
  const authTokenQuery = useAuthTokenAPI();

  return useQuery<IGetStopEstimatesResponse>({
    queryKey: [
      'timetableEstimate',
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
    staleTime: moment.duration(30, 'seconds').asMilliseconds(),
    refetchInterval: moment.duration(30, 'seconds').asMilliseconds(),
  });
};

export const useScheduleAPI = (stopCode: string, date: Date) => {
  const authTokenQuery = useAuthTokenAPI();

  return useQuery<IGetStopSchedulesResponse>({
    queryKey: ['schedule', stopCode, date],
    queryFn: async () => {
      const stopSchedulesResponse = await getStopSchedules(
        stopCode,
        date,
        authTokenQuery.data!,
      );
      GetStopSchedulesResponseSchema.parse(stopSchedulesResponse);

      return stopSchedulesResponse;
    },
    enabled: authTokenQuery.isSuccess && stopCode !== '' && date !== null,
    staleTime: Infinity,
  });
};

export const useVehiclesAPI = (routeKey: string) => {
  const authTokenQuery = useAuthTokenAPI();

  return useQuery<IGetVehiclesResponse[0]>({
    queryKey: ['vehicles', routeKey],
    queryFn: async () => {
      let busesResponse = (await getVehicles(
        [routeKey],
        authTokenQuery.data!,
      )) as IGetVehiclesResponse;

      GetVehiclesResponseSchema.parse(busesResponse);

      // TODO: make this a logger
      if (busesResponse.length === 0) throw Error('No buses returned');

      return busesResponse[0];
    },
    enabled: authTokenQuery.isSuccess && routeKey !== '',
    staleTime: moment.duration(10, 'seconds').asMilliseconds(),
    refetchInterval: moment.duration(10, 'seconds').asMilliseconds(),
  });
};
