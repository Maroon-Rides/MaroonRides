import type { Route } from '$lib/data/types';
import { Directory, Encoding, Filesystem, type WriteFileResult } from '@capacitor/filesystem';
import type { Query } from '@tanstack/svelte-query';
import type { any, unknown } from 'zod';

type UnknownQuery = Query<unknown, unknown, unknown, readonly unknown[]>;

// TODO inline if this doesnt expand to anything else
const ROUTES_FILE = 'cache/routes.json';

class ConnectivityManager {
  cachedRoutes = $state<Route[]>([]);
  apiError = $state<boolean | undefined>(undefined);
  authError = $state<boolean | undefined>(undefined);

  constructor() {
    this.tryUncache();
  }

  reportError(error: Error, query: UnknownQuery) {
    const tags = query.meta;
    if (!(tags && tags.network)) return; //filter tagged reqs
    //
    if (tags.auth) this.authError = true;
    else this.apiError = true;
  }
  reportSuccess(data: unknown, query: UnknownQuery) {
    const tags = query.meta;
    if (!tags) return;
    if (tags.isRoutes) this.tryCache(data as Route[]);
    if (!tags.network) return; //filter tagged reqs
    //
    if (tags.auth) this.authError = false;
    else this.apiError = false;
  }

  private tryCache(data: Route[]): Promise<WriteFileResult> | null {
    if (this.cachedRoutes === data) return null;
    this.cachedRoutes = data;
    return Filesystem.writeFile({
      directory: Directory.Data,
      path: ROUTES_FILE,
      data: JSON.stringify(data),
      encoding: Encoding.UTF8,
      recursive: true, // make parents
    });
  }
  private async tryUncache() {
    try {
      const { data: raw } = await Filesystem.readFile({
        directory: Directory.Data,
        path: ROUTES_FILE,
        encoding: Encoding.UTF8,
      });
      // no validation bc the cache will just overwrite
      // 5 seconds after the app starts if the user messes
      // w their own data
      this.cachedRoutes = JSON.parse(raw as string) as Route[];
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
