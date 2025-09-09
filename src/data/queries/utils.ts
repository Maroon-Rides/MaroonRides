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

type Enum = string | number | symbol;

interface SelectableQueryParams<T, S extends Enum> {
  queryKey: any[];
  staleTime?: moment.Duration | number;
  refetchInterval?: moment.Duration | number;
  enabled?: boolean;
  queries: Partial<Record<S, UseQueryResult<T>>>;
  unsupportedValue?: T;
  selector?: S;
}

export function useSelectableQuery<T, S extends Enum>(
  params: SelectableQueryParams<T, S>,
) {
  const selectedQuery: UseQueryResult<T> | undefined =
    params.queries[params.selector];

  const query = useLoggingQuery<T>({
    label: params.queryKey.join('/'),
    queryKey: [...params.queryKey, selectedQuery?.data],
    queryFn: async () => {
      if (!selectedQuery) {
        return params.unsupportedValue;
      }

      return selectedQuery.data!;
    },
    enabled: params.enabled && selectedQuery?.isSuccess,
    staleTime: parseTime(params.staleTime),
    refetchInterval: parseTime(params.refetchInterval),
  });

  return {
    ...query,
    isError: query.isError || selectedQuery?.isError,
    error: (query.error || (selectedQuery?.error as Error | null))!,
  } as UseQueryResult<T, Error>;
}

