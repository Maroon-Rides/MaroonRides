export const FIRST_CONNECT_GRACE_MS = 5_000;
export const RECONNECT_GRACE_MS = 15_000;

/** Flags the app offline once the live socket has gone too long without connecting. */
export class OfflineTracker {
  isOffline = $state(false);

  #hasConnected = false;
  #timer: ReturnType<typeof setTimeout> | undefined;

  /** Called on every connect attempt. Retries keep the countdown already running. */
  connecting() {
    if (this.#timer !== undefined) return;
    const grace = this.#hasConnected ? RECONNECT_GRACE_MS : FIRST_CONNECT_GRACE_MS;
    this.#timer = setTimeout(() => (this.isOffline = true), grace);
  }

  connected() {
    this.#hasConnected = true;
    this.isOffline = false;
    this.#stop();
  }

  /** The socket closes on purpose in the background, so that does not count. */
  paused() {
    this.#stop();
  }

  #stop() {
    clearTimeout(this.#timer);
    this.#timer = undefined;
  }
}
