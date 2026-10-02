import { WEBSOCKET_URL } from '$lib/api/client';
import {
  WebsocketMessageType,
  type WebsocketDeparture,
  type WebsocketServerMessage,
  type WebsocketVehicle,
} from '$lib/api/websocket';
import type { TimeEstimate } from '$lib/data/types';
import { LiveSocket } from '$lib/sync/live-socket';
import { appLogger } from '$lib/utils/logger';
import { App } from '@capacitor/app';
import moment from 'moment';

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
const DEPARTED_GRACE = moment.duration(1, 'minute');

function departsAt(departure: WebsocketDeparture) {
  return moment(departure.estimatedAt ?? departure.scheduledAt);
}

function slotKey(stopId: string, scheduledAt: moment.MomentInput) {
  return `${stopId}|${moment(scheduledAt).valueOf()}`;
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
    new Map(this.departures.map((d) => [slotKey(d.stopId, d.scheduledAt), d])),
  );

  #routeId: string | null = null;
  #hasOpened = false;
  #onReconnected = () => {};

  readonly #socket = new LiveSocket(WEBSOCKET_URL, {
    onOpen: () => {
      this.#socketState = SocketState.CONNECTED;
      if (this.#hasOpened) this.#onReconnected();
      this.#hasOpened = true;
    },
    onClose: () => {
      this.#socketState = SocketState.DISCONNECTED;
      this.#clear();
    },
    onMessage: (message) => this.#onMessage(message),
  });

  /** Opens the socket and keeps it open while the app is in the foreground. */
  connect(onReconnected: () => void) {
    this.#onReconnected = onReconnected;
    App.addListener('pause', () => this.#socket.disconnect());
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
    const earliest = moment().subtract(DEPARTED_GRACE);
    return this.departures
      .filter((d) => d.stopId === stopId && !d.isCancelled && departsAt(d).isSameOrAfter(earliest))
      .sort((a, b) => departsAt(a).diff(departsAt(b)))
      .map((d) => ({
        scheduledTime: moment(d.scheduledAt),
        estimatedTime: d.estimatedAt ? moment(d.estimatedAt) : null,
        isRealTime: d.estimatedAt !== null,
      }));
  }

  /** The live departure for one scheduled time at a stop, if the server sent one. */
  departureAt(stopId: string, scheduledAt: moment.Moment) {
    return this.#departuresBySlot.get(slotKey(stopId, scheduledAt));
  }

  // Retries after a drop stay disconnected, so the offline fallback does not flicker between attempts.
  #connectSocket() {
    if (this.#socketState !== SocketState.CONNECTED) this.#socketState = SocketState.CONNECTING;
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
