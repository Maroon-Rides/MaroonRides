import type { Route } from '$lib/data/types';
import { Directory, Encoding, Filesystem, type WriteFileResult } from '@capacitor/filesystem';
import type { Query, QueryClient } from '@tanstack/svelte-query';

type UnknownQuery = Query<unknown, unknown, unknown, readonly unknown[]>;

// TODO inline if this doesnt expand to anything else
const CACHE_ROUTES = 'cache/routes.json';
const CACHE_EXPIRY = 7 * (24 * 60 * 60) * 1e3;

const RETRY_MIN = 5e3;
const RETRY_MAX = 300e3;

export enum ConnectionStatus {
  OFFLINE,
  CONNECTING,
  RECONNECTING,
  ONLINE,
}
export namespace ConnectionStatus {
  export function asMessage(s: ConnectionStatus): string {
    switch (s) {
      case ConnectionStatus.OFFLINE:
        return 'Offline';
      case ConnectionStatus.CONNECTING:
        return 'Connecting...';
      case ConnectionStatus.RECONNECTING:
        return 'Reconnecting...';
      case ConnectionStatus.ONLINE:
        return 'Online';
      default:
        return '';
    }
  }
}

type CacheContent = {
  expiresAtUTC: number;
  content: any;
};
class ConnectivityManager {
  // for debug
  isDevMode = $state(false);

  private client = $state<QueryClient | undefined>(undefined);

  private retryAfter = RETRY_MIN;
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

  // for testing dont expose to user durrr
  async scrambleCacheUUIDS(): Promise<{ status: boolean; message: string }> {
    if (!this.isDevMode) return { message: 'Dev mode is not enabled.', status: false };
    const numRoutes = this.cachedRoutes.length;
    if (!numRoutes) return { message: 'There is no cached copy to modify yet.', status: false };
    const mod = this.cachedRoutes.map((r) => {
      return {
        ...r,
        id: crypto.randomUUID(),
      };
    });
    const result = await this.tryCache(mod, true);
    if (!result) return { message: 'Failed Route[] comparison', status: false };
    return {
      message: `Regenerated ${numRoutes} cached UUIDS. The app will now exit.`,
      status: true,
    };
  }
  shareClient(q: QueryClient) {
    this.client = q;
  }
  private backoff() {
    this.retryAfter = Math.min(RETRY_MAX, this.retryAfter * 2);
  }
  private resetBackoff() {
    this.retryAfter = RETRY_MIN;
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
  reportError(error: Error, query: UnknownQuery) {
    const tags = query.meta;
    if (this.isRetrying || !(tags && tags.network)) return; //filter tagged reqs
    //
    if (tags.auth) this.authError = true;
    else this.apiError = true;
    //
    this.tryEnqueueReconnect(Date.now());
  }
  reportSuccess(data: unknown, query: UnknownQuery) {
    const tags = query.meta;
    if (!tags) return;
    if (tags.isRoutes) this.tryCache(data as Route[]);
    if (!tags.network) return; //filter tagged reqs
    //
    if (tags.auth) this.authError = false;
    else this.apiError = false;
    //
    if (!this.isFullyConnected) return;
    this.resetBackoff();
    this.hasFullyConnectedBefore = true;
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
  validate(route: Route): boolean {
    return this.cacheIsSynced && this.cachedRoutes.some((r) => r.id === route.id);
  }

  private checkForUUIDDesync(cache: Route[], cmp: Route[]): boolean {
    if (cache.length !== cmp.length) return true;

    const ids = new Map(cache.map((r) => [r.routeCode, r.id]));
    return cmp.some((r) => ids.has(r.routeCode) && ids.get(r.routeCode) !== r.id);
  }

  private newCacheExpiry(data: any): CacheContent {
    return { expiresAtUTC: Date.now() + CACHE_EXPIRY, content: data };
  }

  private checkCacheExpiry(data: any): data is CacheContent {
    try {
      return Date.now() < data.expiresAtUTC;
    } catch {}
    return false;
  }
  private tryCache(
    data: Route[],
    noUpdateMemory: boolean = false,
  ): Promise<WriteFileResult> | null {
    if (this.cachedRoutes === data) return null;
    if (!noUpdateMemory) {
      const wasStale = this.checkForUUIDDesync(this.cachedRoutes, data);
      this.cachedRoutes = data;
      this.cacheWasStale = wasStale;
      this.cacheIsSynced = true;
    }
    return Filesystem.writeFile({
      directory: Directory.Data,
      path: CACHE_ROUTES,
      data: JSON.stringify(this.newCacheExpiry(data)),
      encoding: Encoding.UTF8,
      recursive: true, // make parents
    });
  }
  private async tryUncache() {
    try {
      const { data: raw } = await Filesystem.readFile({
        directory: Directory.Data,
        path: CACHE_ROUTES,
        encoding: Encoding.UTF8,
      });
      // no validation bc the cache will just overwrite
      // 5 seconds after the app starts if the user messes
      // w their own data
      const data = JSON.parse(raw as string);
      if (!this.checkCacheExpiry(data)) return;

      this.cachedRoutes = data.content as Route[];
    } catch {}
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
