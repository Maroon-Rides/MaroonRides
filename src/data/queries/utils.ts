import { queryLogger } from '@data/utils/logger';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import moment from 'moment';

interface Params<T> {
  queryFn: () => Promise<T>;
  queryKey: any[];
  staleTime?: moment.Duration | number;
  refetchInterval?: moment.Duration | number;
  enabled?: boolean;
}

interface DependencyQueryParams<T> extends Params<T> {
  dependents: UseQueryResult<any>[];
}

function parseTime(time?: moment.Duration | number) {
  if (typeof time === 'number') {
    return time;
  } else if (moment.isDuration(time)) {
    return time.asMilliseconds();
  }
}

export function useDependencyQuery<T>(params: DependencyQueryParams<T>) {
  const enabled = params.dependents.every((q) => q.isSuccess);

  const query = useLoggingQuery<T>({
    label: params.queryKey.join('/'),
    queryKey: [...params.queryKey, ...params.dependents.map((q) => q.data)],
    queryFn: params.queryFn,
    enabled: enabled && params.enabled,
    staleTime: parseTime(params.staleTime),
    refetchInterval: parseTime(params.refetchInterval),
  });

  return {
    ...query,
    isError: query.isError || params.dependents.some((q) => q.isError),
    error: (query.error ||
      (params.dependents.find((q) => q.isError)?.error as Error | null))!,
  } as UseQueryResult<T, Error>;
}

interface LoggingQueryParams extends Params<any> {
  label?: string;
}

export function useLoggingQuery<T>(params: LoggingQueryParams) {
  const label = params.label || params.queryKey.join('/');

  const query = useQuery<T>({
    queryKey: params.queryKey,
    queryFn: async () => {
      try {
        const start = moment.now();
        const data = await params.queryFn();

        queryLogger.d(`Query ${label} succeeded in ${moment.now() - start} ms`);
        return data;
      } catch (e) {
        queryLogger.e(`Query ${label} failed: ${e}`);
        throw e;
      }
    },

    enabled: params.enabled,
    staleTime: parseTime(params.staleTime),
    refetchInterval: parseTime(params.refetchInterval),
  });

  return query;
}
