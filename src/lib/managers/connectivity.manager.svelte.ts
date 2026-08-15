// failing a request n times
const ERR_THRESHOLD = 1;
class ConnectivityManager {
  apiError = $state<undefined | boolean>(undefined);
  authError = $state<undefined | boolean>(undefined);

  reportError(error: Error) {
    this.apiError = true;
  }
  reportSuccess(data: unknown) {
    this.apiError = false;
  }
  reportAuthError(error: Error) {
    this.authError = true;
  }
  reportAuthSuccess(data: unknown) {
    this.authError = false;
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
