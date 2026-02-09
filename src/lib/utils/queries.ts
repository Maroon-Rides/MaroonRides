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

export function createDependencyQuery<T>(params: () => DependencyQueryParams<T>) {
  const query = createQuery<T>(() => {
    const p = params();
    const label = p.queryKey.join('/');
    const enabled = p.dependents.every((q) => q.isSuccess);

    return {
      queryKey: [...p.queryKey, ...p.dependents.map((q) => q.data)],
      queryFn: async () => {
        try {
          const start = moment.now();
          const data = await p.queryFn();

          queryLogger.d(`Query ${label} succeeded in ${moment.now() - start} ms`);
          return data;
        } catch (e) {
          queryLogger.e(`Query ${label} failed: ${e}`);
          throw e;
        }
      },
      enabled: enabled && (p.enabled ?? true),
      staleTime: parseTime(p.staleTime),
      refetchInterval: parseTime(p.refetchInterval),
    };
  });

  // Return a getter that accesses params() reactively
  return {
    get data() {
      return query.data;
    },
    get error() {
      const p = params();
      return (query.error || (p.dependents.find((q) => q.isError)?.error as Error | null))!;
    },
    get isError() {
      const p = params();
      return query.isError || p.dependents.some((q) => q.isError);
    },
    get isSuccess() {
      return query.isSuccess;
    },
    get isPending() {
      return query.isPending;
    },
    get isFetching() {
      return query.isFetching;
    },
    get isLoading() {
      return query.isLoading;
    },
    get status() {
      return query.status;
    },
    get fetchStatus() {
      return query.fetchStatus;
    },
    refetch: query.refetch,
  } as CreateQueryResult<T, Error>;
}

interface LoggingQueryParams extends Params<any> {
  label?: string;
}

export function createLoggingQuery<T>(params: () => LoggingQueryParams) {
  const query = createQuery<T>(() => {
    const p = params();
    const label = p.label || p.queryKey.join('/');

    return {
      queryKey: p.queryKey,
      queryFn: async () => {
        try {
          const start = moment.now();
          const data = await p.queryFn();

          queryLogger.d(`Query ${label} succeeded in ${moment.now() - start} ms`);
          return data;
        } catch (e) {
          queryLogger.e(`Query ${label} failed: ${e}`);
          throw e;
        }
      },

      enabled: p.enabled ?? true,
      staleTime: parseTime(p.staleTime),
      refetchInterval: parseTime(p.refetchInterval),
    };
  });

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

export function createSelectableQuery<T, S extends Enum>(
  params: () => SelectableQueryParams<T, S>,
) {
  const query = createQuery<T>(() => {
    const p = params();
    const label = p.queryKey.join('/');
    const selectedQuery: CreateQueryResult<T> | undefined = p.queries[p.selector];

    return {
      queryKey: [...p.queryKey, selectedQuery?.data],
      queryFn: async () => {
        try {
          const start = moment.now();
          const data = selectedQuery?.data ?? p.unsupportedValue!;

          queryLogger.d(`Query ${label} succeeded in ${moment.now() - start} ms`);
          return data;
        } catch (e) {
          queryLogger.e(`Query ${label} failed: ${e}`);
          throw e;
        }
      },
      enabled: (p.enabled ?? true) && (selectedQuery?.isSuccess ?? false),
      staleTime: parseTime(p.staleTime),
      refetchInterval: parseTime(p.refetchInterval),
    };
  });

  const p = params();
  const selectedQuery: CreateQueryResult<T> | undefined = p.queries[p.selector];

  return {
    ...query,
    isError: query.isError || (selectedQuery?.isError ?? false),
    error: (query.error || (selectedQuery?.error as Error | null))!,
  } as unknown as CreateQueryResult<T, Error>;
}
