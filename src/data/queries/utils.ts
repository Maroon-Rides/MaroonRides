import { useQuery, UseQueryResult } from '@tanstack/react-query';

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

export function useDependencyQuery<T, E = Error, S = T>(
  params: DependencyQueryParams<T>,
) {
  const enabled = params.dependents.every((q) => q.isSuccess);

  const query = useLoggingQuery<T, E, S>({
    label: `DependencyQuery: ${params.queryKey.join('/')}`,
    queryKey: [
      ...params.queryKey,
      ...params.dependents.map((q) => q.data),
    ],
    queryFn: params.queryFn,
    enabled: enabled && params.enabled,
    staleTime:
      typeof params.staleTime === 'number'
        ? params.staleTime
        : params.staleTime?.asMilliseconds(),
    refetchInterval:
      typeof params.refetchInterval === 'number'
        ? params.refetchInterval
        : params.refetchInterval?.asMilliseconds(),
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

export function useLoggingQuery<T, E = Error, S = T>(
  params: LoggingQueryParams,
) {
  const label = params.label || params.queryKey.join('/');

  const query = useQuery<T, E, S>({
    queryKey: params.queryKey,
    queryFn: async () => {
      try {
        console.log('Running query function for', label);
        const data = await params.queryFn();
        console.log(
          'Query function for',
          params.label,
          'completed successfully',
        );
        return data;
      } catch (e) {
        console.error(`Error in query function for ${label}:`, e);
        throw e;
      }
    },

    enabled: params.enabled,
    staleTime:
      typeof params.staleTime === 'number'
        ? params.staleTime
        : params.staleTime?.asMilliseconds(),
    refetchInterval:
      typeof params.refetchInterval === 'number'
        ? params.refetchInterval
        : params.refetchInterval?.asMilliseconds(),
  });

  return query;
}
