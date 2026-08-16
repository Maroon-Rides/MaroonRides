import type { Query } from '@tanstack/svelte-query';

type UnknownQuery = Query<unknown, unknown, unknown, readonly unknown[]>;
// failing a request n times
const ERR_THRESHOLD = 1;
class ConnectivityManager {
  apiError = $state<undefined | boolean>(undefined);
  authError = $state<undefined | boolean>(undefined);

  reportError(error: Error, query: UnknownQuery) {
    const tags = query.meta;
    if (!(tags && tags.network)) return; //filter tagged reqs
    //
    if (tags.auth) this.authError = true;
    else this.apiError = true;
  }
  reportSuccess(data: unknown, query: UnknownQuery) {
    const tags = query.meta;
    if (!(tags && tags.network)) return; //filter tagged reqs
    //
    if (tags.auth) this.authError = false;
    else this.apiError = false;
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
