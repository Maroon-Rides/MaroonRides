import type { Route } from '$lib/data/types';
import { ConnectionStatus } from '$lib/data/types';
import * as Cache from '$lib/utils/cache';
import type { Query, QueryClient } from '@tanstack/svelte-query';
type UnknownQuery = Query<unknown, unknown, unknown, readonly unknown[]>;

// TODO inline if this doesnt expand to anything else
const CACHE_ROUTES = 'routes.json';
const CACHE_EXPIRY = 7 * (24 * 60 * 60) * 1e3;

const BACKOFF_MIN = 5e3;
const BACKOFF_MAX = 300e3;

class ConnectivityManager {
  // for debug
  debugOptions = $state(false);

  private client = $state<QueryClient | undefined>(undefined);

  private retryAfter = BACKOFF_MIN;
  private mayRetryAt = $state<number>(0);
  private isRetrying = $state<boolean>(false);

  cachedRoutes = $state<Route[]>([]);
  cacheWasStale = $state<boolean | undefined>(undefined); //flicks true when ids change, requires connection obviously
  cacheIsSynced = $state<boolean>(false);

  apiError = $state<boolean | undefined>(undefined); // tamu error
  authError = $state<boolean | undefined>(undefined); // auth.maroonrides.app
  isError = $derived(this.apiError || this.authError);

  //whether or not to pick CONNECTING/RECONNECTING
  private hasFullyConnectedBefore = $state<boolean>(false);
  private isFullyConnected = $derived<boolean>(this.apiError === false && this.authError === false);

  constructor() {
    this.tryUncache();
  }

  //arrow function so svelte can use reactively
  getConnectionStatus = () => {
    if (this.isError && this.isRetrying) {
      return this.hasFullyConnectedBefore
        ? ConnectionStatus.RECONNECTING
        : ConnectionStatus.CONNECTING;
    }
    // only give connecting message when cache is loaded
    if (this.authError === undefined) return ConnectionStatus.CONNECTING;
    if (this.authError === true) return ConnectionStatus.OFFLINE;

    if (this.apiError === undefined) return ConnectionStatus.CONNECTING;
    if (this.apiError === true) return ConnectionStatus.OFFLINE;
    return ConnectionStatus.ONLINE;
  };

  // only true when cache is synced and route id exists
  validateRoute(route: Route): boolean {
    return this.cacheIsSynced && this.cachedRoutes.some((r) => r.id === route.id);
  }

  shareQueryClient(q: QueryClient) {
    this.client = q;
  }
  reportQueryError(error: Error, query: UnknownQuery) {
    const tags = query.meta;
    if (this.isRetrying || !(tags && tags.network)) return; //filter tagged reqs
    //
    if (tags.auth) this.authError = true;
    else this.apiError = true;
    //
    this.tryEnqueueReconnect(Date.now());
  }
  reportQuerySuccess(data: unknown, query: UnknownQuery) {
    const tags = query.meta;
    if (!tags) return;
    if (tags.isRoutes) this.tryCache(data as Route[]); // detach write here to not block other state mods
    if (!tags.network) return; //filter tagged reqs
    //
    if (tags.auth) this.authError = false;
    else this.apiError = false;
    //
    if (!this.isFullyConnected) return;
    this.resetBackoff();
    this.hasFullyConnectedBefore = true;
  }

  private backoff() {
    this.retryAfter = Math.min(BACKOFF_MAX, this.retryAfter * 2);
  }
  private resetBackoff() {
    this.retryAfter = BACKOFF_MIN;
  }

  // if you ever use parallel js (hahaha) use CAS
  private tryEnqueueReconnect(failureTime: number) {
    if (!this.client || failureTime <= this.mayRetryAt) return;
    if (this.isRetrying) return; //arbitrary time for refetch to finish
    //
    const delay = this.retryAfter;
    this.mayRetryAt = failureTime + delay;
    this.backoff();
    //
    setTimeout(async () => {
      if (!this.client) return;
      this.isRetrying = true;
      try {
        await this.client.refetchQueries({
          predicate: (q) => q.state.status === 'error' && !!q.meta?.network,
        });
      } finally {
        this.isRetrying = false;
        if (this.isError) this.tryEnqueueReconnect(Date.now());
      }
    }, delay);
  }

  private checkForUUIDDesync(cache: Route[], cmp: Route[]): boolean {
    if (cache.length !== cmp.length) return true;

    const ids = new Map(cache.map((r) => [r.routeCode, r.id]));
    return cmp.some((r) => ids.has(r.routeCode) && ids.get(r.routeCode) !== r.id);
  }

  private async tryCache(
    data: Route[],
    noUpdateMemory: boolean = false,
  ): Promise<Cache.CacheWriteResult | null> {
    if (this.cachedRoutes === data) return null;

    if (!noUpdateMemory) {
      this.cacheWasStale = this.checkForUUIDDesync(this.cachedRoutes, data);
      this.cacheIsSynced = true;
      this.cachedRoutes = data;
    }

    const result = await Cache.tryCache(CACHE_ROUTES, data, {
      expiryMillis: CACHE_EXPIRY,
      isOffset: true,
      overwrite: true,
      recursive: true,
    });
    return result;
  }

  private async tryUncache(): Promise<Cache.CacheReadResult> {
    const result = await Cache.tryUncache(CACHE_ROUTES);
    if (result.data) this.cachedRoutes = result.data;
    return result;
  }

  // for testing dont expose to user durrr
  async scrambleCacheUUIDS(replace?: Route[]): Promise<{ status: boolean; message: string }> {
    if (!this.debugOptions) return { message: 'Dev mode is not enabled.', status: false };

    let mod: Route[];
    //replace data
    if (replace !== undefined) {
      mod = replace;
    } else {
      if (!this.cachedRoutes.length)
        return { message: 'There is no cached copy to modify yet.', status: false };
      mod = this.cachedRoutes.map((r) => {
        return {
          ...r,
          id: crypto.randomUUID(),
        };
      });
    }
    // normal scramble
    const result = await this.tryCache(mod, true);
    if (result === null) return { message: 'Failed Route[] comparison', status: false };
    if (result.failedRewrappedData)
      return { message: 'Failed: bad (rewrapped) cache data', status: false };
    if (result.failedWriteError)
      return {
        message: `Failed write: ${result.writeError?.toString() ?? 'unknown reason'}`,
        status: false,
      };

    return {
      message:
        (replace === undefined
          ? `Regenerated ${mod.length} cached UUIDS.`
          : `Replaced the cache to ${mod.length} routes.`) + ' The app will now exit.',
      status: true,
    };
  }
}

// Persist connectivityManager across Svelte HMRs
let connectivityManager: ConnectivityManager;

if (import.meta.hot && import.meta.hot.data) {
  if (!import.meta.hot.data.connectivityManager) {
    import.meta.hot.data.connectivityManager = new ConnectivityManager();
  }
  connectivityManager = import.meta.hot.data.connectivityManager;
} else {
  connectivityManager = new ConnectivityManager();
}

export { connectivityManager };
