import { WEBSOCKET_URL } from '$lib/api/client';
import {
  WebsocketMessageType,
  type WebsocketDeparture,
  type WebsocketServerMessage,
  type WebsocketVehicle,
} from '$lib/api/websocket';
import { toTimeEstimate, upcomingEstimates } from '$lib/data/stop_estimates';
import type { TimeEstimate } from '$lib/data/types';
import { ConnectionState, LiveSocket } from '$lib/sync/live-socket';
import { OfflineTracker } from '$lib/sync/offline-tracker.svelte';
import { appLogger } from '$lib/utils/logger';
import { App } from '@capacitor/app';
import { DateTime } from 'luxon';

function slotKey(stopId: string, scheduledAt: DateTime) {
  return `${stopId}|${scheduledAt.toMillis()}`;
}

/** Holds the subscribed route's vehicles and departures, straight from the websocket. */
class LiveDataManager {
  vehicles = $state.raw<WebsocketVehicle[]>([]);

  #connection = ConnectionState.IDLE;
  #departures = $state.raw<WebsocketDeparture[] | null>(null);

  /** Whether the subscribed route's departures have arrived over a connected socket. */
  readonly isLive = $derived(this.#departures !== null);

  readonly #departuresBySlot = $derived(
    new Map(
      (this.#departures ?? []).map((d) => [slotKey(d.stopId, DateTime.fromISO(d.scheduledAt)), d]),
    ),
  );

  #routeId: string | null = null;
  #onReconnected = () => {};

  readonly #offline = new OfflineTracker();

  readonly #socket = new LiveSocket(WEBSOCKET_URL, {
    onStateChange: (state) => this.#onConnectionChange(state),
    onMessage: (message) => this.#onMessage(message),
  });

  /** Whether the live socket has been unreachable for long enough to tell the rider. */
  get isOffline() {
    return this.#offline.isOffline;
  }

  /** Opens the socket and keeps it open while the app is in the foreground. */
  connect(onReconnected: () => void) {
    if (this.#connection !== ConnectionState.IDLE) return;
    this.#onReconnected = onReconnected;
    App.addListener('pause', () => this.#socket.disconnect());
    App.addListener('resume', () => this.#socket.connect());
    this.#socket.connect();
  }

  subscribe(routeId: string | null) {
    if (routeId === this.#routeId) return;
    this.#routeId = routeId;
    this.#clear();
    this.#socket.subscribe(routeId);
  }

  /** Upcoming departures at a stop, soonest first. */
  estimatesFor(stopId: string): TimeEstimate[] {
    return upcomingEstimates(
      (this.#departures ?? [])
        .filter((d) => d.stopId === stopId && !d.isCancelled)
        .map((d) => toTimeEstimate(DateTime.fromISO(d.scheduledAt), d.estimatedAt)),
    );
  }

  /** The live departure for one scheduled time at a stop, if the server sent one. */
  departureAt(stopId: string, scheduledAt: DateTime) {
    return this.#departuresBySlot.get(slotKey(stopId, scheduledAt));
  }

  #onConnectionChange(state: ConnectionState) {
    const wasReconnecting = this.#connection === ConnectionState.RECONNECTING;
    this.#connection = state;
    this.#offline.update(state);

    if (state !== ConnectionState.CONNECTED) this.#clear();
    else if (wasReconnecting) this.#onReconnected();
  }

  #clear() {
    this.vehicles = [];
    this.#departures = null;
  }

  #onMessage(message: WebsocketServerMessage) {
    switch (message.type) {
      case WebsocketMessageType.VEHICLES:
        if (message.routeId === this.#routeId) this.vehicles = message.vehicles ?? [];
        break;
      case WebsocketMessageType.DEPARTURES:
        if (message.routeId === this.#routeId) this.#departures = message.departures ?? [];
        break;
      case WebsocketMessageType.ERROR:
        appLogger.e(`Live socket error: ${message.message}`);
        break;
    }
  }
}

// Persist liveDataManager across Svelte HMRs
let liveDataManager: LiveDataManager;

if (import.meta.hot && import.meta.hot.data) {
  if (!import.meta.hot.data.liveDataManager) {
    import.meta.hot.data.liveDataManager = new LiveDataManager();
  }
  liveDataManager = import.meta.hot.data.liveDataManager;
} else {
  liveDataManager = new LiveDataManager();
}

export { liveDataManager };
