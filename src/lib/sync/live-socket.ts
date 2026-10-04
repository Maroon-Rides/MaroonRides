import {
  WebsocketMessageType,
  type WebsocketClientMessage,
  type WebsocketServerMessage,
} from '$lib/api/websocket';
import { appLogger } from '$lib/utils/logger';

const INITIAL_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 30_000;
const RETRY_BACKOFF_FACTOR = 2;
// The gateway drops a client that sends nothing for 60 seconds.
const PING_INTERVAL_MS = 20_000;

interface LiveSocketHandlers {
  onOpen(): void;
  onClose(): void;
  onMessage(message: WebsocketServerMessage): void;
}

/** One websocket to the gateway that reconnects on its own and keeps the chosen route subscribed. */
export class LiveSocket {
  readonly #url: string;
  readonly #handlers: LiveSocketHandlers;

  #socket: WebSocket | null = null;
  #wanted = false;
  #routeId: string | null = null;
  #retryDelay = INITIAL_RETRY_DELAY_MS;
  #retryTimer: ReturnType<typeof setTimeout> | undefined;
  #pingTimer: ReturnType<typeof setInterval> | undefined;

  constructor(url: string, handlers: LiveSocketHandlers) {
    this.#url = url;
    this.#handlers = handlers;
  }

  connect() {
    this.#wanted = true;
    if (!this.#socket) this.#open();
  }

  disconnect() {
    this.#wanted = false;
    clearTimeout(this.#retryTimer);
    this.#socket?.close();
  }

  subscribe(routeId: string | null) {
    this.#routeId = routeId;
    this.#sendSubscription();
  }

  #open() {
    clearTimeout(this.#retryTimer);
    const socket = new WebSocket(this.#url);
    this.#socket = socket;

    socket.onopen = () => {
      this.#retryDelay = INITIAL_RETRY_DELAY_MS;
      this.#pingTimer = setInterval(
        () => this.#send({ type: WebsocketMessageType.PING }),
        PING_INTERVAL_MS,
      );
      this.#sendSubscription();
      this.#handlers.onOpen();
    };

    socket.onmessage = (event) => {
      this.#handlers.onMessage(JSON.parse(event.data) as WebsocketServerMessage);
    };

    socket.onerror = () => socket.close();

    socket.onclose = () => {
      if (this.#socket !== socket) return;
      clearInterval(this.#pingTimer);
      this.#socket = null;
      this.#handlers.onClose();
      if (this.#wanted) this.#scheduleReconnect();
    };
  }

  #scheduleReconnect() {
    // Jitter keeps every phone from reconnecting at once after a gateway restart.
    const delay = this.#retryDelay / 2 + Math.random() * (this.#retryDelay / 2);
    this.#retryDelay = Math.min(this.#retryDelay * RETRY_BACKOFF_FACTOR, MAX_RETRY_DELAY_MS);

    appLogger.i(`Live socket closed, reconnecting in ${Math.round(delay)} ms`);
    this.#retryTimer = setTimeout(() => this.#open(), delay);
  }

  #sendSubscription() {
    this.#send(
      this.#routeId
        ? { type: WebsocketMessageType.SUBSCRIBE, routeId: this.#routeId }
        : { type: WebsocketMessageType.UNSUBSCRIBE },
    );
  }

  #send(message: WebsocketClientMessage) {
    if (this.#socket?.readyState !== WebSocket.OPEN) return;
    this.#socket.send(JSON.stringify(message));
  }
}
