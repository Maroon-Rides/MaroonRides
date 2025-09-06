import { useQuery, UseQueryResult } from '@tanstack/react-query';

interface Params<T> {
  queryFn: () => Promise<T>;
  queryKey: any[];
  dependents: UseQueryResult<any>[];
  staleTime?: moment.Duration | number;
  refetchInterval?: moment.Duration | number;
  enabled?: boolean;
}

export function useDependencyQuery<T>(params: Params<T>) {
  const { queryFn, queryKey, dependents } = params;

  const enabled = dependents.every((q) => q.isSuccess);

  const query = useQuery<T>({
    queryKey: [...queryKey, ...dependents.map((q) => q.data)],
    queryFn: queryFn,
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
    isError: query.isError || dependents.some((q) => q.isError),
    error: (query.error ||
      (dependents.find((q) => q.isError)?.error as Error | null))!,
  } as UseQueryResult<T, Error>;
}
