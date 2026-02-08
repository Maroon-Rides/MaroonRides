import { queryLogger } from '$lib/utils/logger';
import { createQuery, type CreateQueryResult } from '@tanstack/svelte-query';
import moment from 'moment';

interface Params<T> {
  queryFn: () => Promise<T>;
  queryKey: any[];
  staleTime?: moment.Duration | number;
  refetchInterval?: moment.Duration | number;
  enabled?: boolean;
}

interface DependencyQueryParams<T> extends Params<T> {
  dependents: CreateQueryResult<any>[];
}

function parseTime(time?: moment.Duration | number) {
  if (typeof time === 'number') {
    return time;
  } else if (moment.isDuration(time)) {
    return time.asMilliseconds();
  }
}

export function useDependencyQuery<T>(params: DependencyQueryParams<T>) {
  const label = params.queryKey.join('/');

  const query = createQuery<T>(() => {
    const enabled = params.dependents.every((q) => q.isSuccess);

    return {
      queryKey: [...params.queryKey, ...params.dependents.map((q) => q.data)],
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
      enabled: enabled && (params.enabled ?? true),
      staleTime: parseTime(params.staleTime),
      refetchInterval: parseTime(params.refetchInterval),
    };
  });

  return {
    ...query,
    isError: query.isError || params.dependents.some((q) => q.isError),
    error: (query.error || (params.dependents.find((q) => q.isError)?.error as Error | null))!,
  } as CreateQueryResult<T, Error>;
}

interface LoggingQueryParams extends Params<any> {
  label?: string;
}

export function useLoggingQuery<T>(params: LoggingQueryParams) {
  const label = params.label || params.queryKey.join('/');

  const query = createQuery<T>(() => ({
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

    enabled: params.enabled ?? true,
    staleTime: parseTime(params.staleTime),
    refetchInterval: parseTime(params.refetchInterval),
  }));

  return query;
}

// Enum type shim
type Enum = string | number | symbol;

interface SelectableQueryParams<T, S extends Enum> {
  queryKey: any[];
  staleTime?: moment.Duration | number;
  refetchInterval?: moment.Duration | number;
  enabled?: boolean;
  queries: Partial<Record<S, CreateQueryResult<T>>>;
  unsupportedValue?: T;
  selector?: S;
}

export function useSelectableQuery<T, S extends Enum>(params: SelectableQueryParams<T, S>) {
  const label = params.queryKey.join('/');

  const query = createQuery<T>(() => {
    const selectedQuery: CreateQueryResult<T> | undefined = params.queries[params.selector];

    return {
      queryKey: [...params.queryKey, selectedQuery?.data],
      queryFn: async () => {
        try {
          const start = moment.now();
          const data = selectedQuery?.data ?? params.unsupportedValue!;

          queryLogger.d(`Query ${label} succeeded in ${moment.now() - start} ms`);
          return data;
        } catch (e) {
          queryLogger.e(`Query ${label} failed: ${e}`);
          throw e;
        }
      },
      enabled: (params.enabled ?? true) && (selectedQuery?.isSuccess ?? false),
      staleTime: parseTime(params.staleTime),
      refetchInterval: parseTime(params.refetchInterval),
    };
  });

  const selectedQuery: CreateQueryResult<T> | undefined = params.queries[params.selector];

  return {
    ...query,
    isError: query.isError || (selectedQuery?.isError ?? false),
    error: (query.error || (selectedQuery?.error as Error | null))!,
  } as unknown as CreateQueryResult<T, Error>;
}
