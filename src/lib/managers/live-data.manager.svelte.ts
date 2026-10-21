import { WEBSOCKET_URL } from '$lib/api/client';
import {
  WebsocketMessageType,
  type WebsocketDeparture,
  type WebsocketServerMessage,
  type WebsocketVehicle,
} from '$lib/api/websocket';
import type { TimeEstimate } from '$lib/data/types';
import { LiveSocket } from '$lib/sync/live-socket';
import { OfflineTracker } from '$lib/sync/offline-tracker.svelte';
import { appLogger } from '$lib/utils/logger';
import { App } from '@capacitor/app';
import { DateTime, Duration } from 'luxon';

export enum LiveDataStatus {
  LOADING = 'loading',
  LIVE = 'live',
  OFFLINE = 'offline',
}

enum SocketState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
}

// A bus that left a minute ago is often still at the stop.
const DEPARTED_GRACE = Duration.fromObject({ minutes: 1 });

function departsAt(departure: WebsocketDeparture) {
  return DateTime.fromISO(departure.estimatedAt ?? departure.scheduledAt);
}

function slotKey(stopId: string, scheduledAt: DateTime) {
  return `${stopId}|${scheduledAt.toMillis()}`;
}

/** Holds the subscribed route's vehicles and departures, straight from the websocket. */
class LiveDataManager {
  vehicles = $state.raw<WebsocketVehicle[]>([]);
  departures = $state.raw<WebsocketDeparture[]>([]);

  #socketState = $state(SocketState.CONNECTING);
  #hasDepartures = $state(false);

  /** Whether the subscribed route's departures are live, still on their way, or unreachable. */
  readonly status = $derived.by(() => {
    if (this.#socketState === SocketState.DISCONNECTED) return LiveDataStatus.OFFLINE;
    return this.#hasDepartures ? LiveDataStatus.LIVE : LiveDataStatus.LOADING;
  });

  readonly #departuresBySlot = $derived(
    new Map(this.departures.map((d) => [slotKey(d.stopId, DateTime.fromISO(d.scheduledAt)), d])),
  );

  #routeId: string | null = null;
  #hasOpened = false;
  #onReconnected = () => {};

  readonly #offline = new OfflineTracker();

  readonly #socket = new LiveSocket(WEBSOCKET_URL, {
    onOpen: () => {
      this.#socketState = SocketState.CONNECTED;
      this.#offline.connected();
      if (this.#hasOpened) this.#onReconnected();
      this.#hasOpened = true;
    },
    onClose: (reconnecting) => {
      this.#socketState = SocketState.DISCONNECTED;
      if (reconnecting) this.#offline.connecting();
      this.#clear();
    },
    onMessage: (message) => this.#onMessage(message),
  });

  /** Whether the live socket has been unreachable for long enough to tell the rider. */
  get isOffline() {
    return this.#offline.isOffline;
  }

  /** Opens the socket and keeps it open while the app is in the foreground. */
  connect(onReconnected: () => void) {
    this.#onReconnected = onReconnected;
    App.addListener('pause', () => {
      this.#offline.paused();
      this.#socket.disconnect();
    });
    App.addListener('resume', () => this.#connectSocket());
    this.#connectSocket();
  }

  subscribe(routeId: string | null) {
    if (routeId === this.#routeId) return;
    this.#routeId = routeId;
    this.#clear();
    this.#socket.subscribe(routeId);
  }

  /** Upcoming departures at a stop, soonest first. */
  estimatesFor(stopId: string): TimeEstimate[] {
    const earliest = DateTime.now().minus(DEPARTED_GRACE);
    return this.departures
      .filter((d) => d.stopId === stopId && !d.isCancelled && departsAt(d) >= earliest)
      .sort((a, b) => departsAt(a).toMillis() - departsAt(b).toMillis())
      .map((d) => ({
        scheduledTime: DateTime.fromISO(d.scheduledAt),
        estimatedTime: d.estimatedAt ? DateTime.fromISO(d.estimatedAt) : null,
        isRealTime: d.estimatedAt !== null,
      }));
  }

  /** The live departure for one scheduled time at a stop, if the server sent one. */
  departureAt(stopId: string, scheduledAt: DateTime) {
    return this.#departuresBySlot.get(slotKey(stopId, scheduledAt));
  }

  // Retries after a drop stay disconnected, so the offline fallback does not flicker between attempts.
  #connectSocket() {
    if (this.#socketState !== SocketState.CONNECTED) {
      this.#socketState = SocketState.CONNECTING;
      this.#offline.connecting();
    }
    this.#socket.connect();
  }

  #clear() {
    this.vehicles = [];
    this.departures = [];
    this.#hasDepartures = false;
  }

  #onMessage(message: WebsocketServerMessage) {
    switch (message.type) {
      case WebsocketMessageType.VEHICLES:
        if (message.routeId === this.#routeId) this.vehicles = message.vehicles ?? [];
        break;
      case WebsocketMessageType.DEPARTURES:
        if (message.routeId !== this.#routeId) return;
        this.departures = message.departures ?? [];
        this.#hasDepartures = true;
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
