import { ConnectionState } from '$lib/sync/live-socket';

export const FIRST_CONNECT_GRACE_MS = 5_000;
export const RECONNECT_GRACE_MS = 15_000;

const GRACE_MS: Partial<Record<ConnectionState, number>> = {
  [ConnectionState.CONNECTING]: FIRST_CONNECT_GRACE_MS,
  [ConnectionState.RECONNECTING]: RECONNECT_GRACE_MS,
};

export class OfflineTracker {
  isOffline = $state(false);

  #timer: ReturnType<typeof setTimeout> | undefined;

  update(state: ConnectionState) {
    clearTimeout(this.#timer);
    if (state === ConnectionState.CONNECTED) this.isOffline = false;

    const grace = GRACE_MS[state];
    if (grace !== undefined) this.#timer = setTimeout(() => (this.isOffline = true), grace);
  }
}
