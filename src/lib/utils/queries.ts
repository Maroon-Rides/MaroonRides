import { describeError, queryLogger } from '$lib/utils/logger';
import { createQuery, QueryClient, type NetworkMode } from '@tanstack/svelte-query';
import { Duration } from 'luxon';

interface LoggingQueryParams<T> {
  queryFn: () => Promise<T>;
  queryKey: unknown[];
  label?: string;
  staleTime?: Duration | number;
  refetchInterval?: Duration | number;
  enabled?: boolean;
  networkMode?: NetworkMode;
}

function parseTime(time?: Duration | number) {
  return Duration.isDuration(time) ? time.toMillis() : time;
}

export function createLoggingQuery<T>(params: () => LoggingQueryParams<T>) {
  return createQuery<T>(() => {
    const p = params();
    const label = p.label || p.queryKey.join('/');

    return {
      queryKey: p.queryKey,
      queryFn: async () => {
        try {
          const start = Date.now();
          const data = await p.queryFn();

          queryLogger.d(`Query ${label} succeeded in ${Date.now() - start} ms`);
          return data;
        } catch (e) {
          queryLogger.e(`Query ${label} failed: ${describeError(e)}`);
          throw e;
        }
      },
      enabled: p.enabled ?? true,
      staleTime: parseTime(p.staleTime),
      refetchInterval: parseTime(p.refetchInterval),
      networkMode: p.networkMode,
    };
  });
}

const DB_QUERY_KEY = 'db';

export const queryClient = new QueryClient();

interface DbQueryParams<T> {
  key: unknown[];
  queryFn: () => Promise<T>;
  enabled?: boolean;
  refetchInterval?: Duration | number;
}

/** A query on the local database. It re-runs when the sync manager changes the data. */
export function createDbQuery<T>(params: () => DbQueryParams<T>) {
  return createLoggingQuery<T>(() => {
    const p = params();
    return {
      label: String(p.key[0]),
      queryKey: [DB_QUERY_KEY, ...p.key],
      queryFn: p.queryFn,
      enabled: p.enabled,
      staleTime: Infinity,
      refetchInterval: p.refetchInterval,
      // TanStack pauses queries while the device is offline, but these read local SQLite.
      networkMode: 'always',
    };
  });
}

export function refreshDbQueries() {
  return queryClient.invalidateQueries({ queryKey: [DB_QUERY_KEY] });
}
