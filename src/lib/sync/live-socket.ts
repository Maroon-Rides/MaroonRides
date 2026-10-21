import {
  WebsocketMessageType,
  websocketServerMessageSchema,
  type WebsocketClientMessage,
  type WebsocketServerMessage,
} from '$lib/api/websocket';
import { appLogger } from '$lib/utils/logger';
import { RetryScheduler } from '$lib/utils/retry-scheduler';

const INITIAL_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 30_000;
// The gateway drops a client that sends nothing for 60 seconds.
const PING_INTERVAL_MS = 20_000;

export enum ConnectionState {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  PAUSED = 'paused',
}

interface LiveSocketHandlers {
  onStateChange(state: ConnectionState): void;
  onMessage(message: WebsocketServerMessage): void;
}

/** One websocket to the gateway that reconnects on its own and keeps the chosen route subscribed. */
export class LiveSocket {
  readonly #url: string;
  readonly #handlers: LiveSocketHandlers;

  #state = ConnectionState.IDLE;
  #socket: WebSocket | null = null;
  #routeId: string | null = null;
  readonly #retry = new RetryScheduler(() => this.#open(), {
    initialDelayMs: INITIAL_RETRY_DELAY_MS,
    maxDelayMs: MAX_RETRY_DELAY_MS,
  });
  #pingTimer: ReturnType<typeof setInterval> | undefined;

  constructor(url: string, handlers: LiveSocketHandlers) {
    this.#url = url;
    this.#handlers = handlers;
  }

  get #wantsOpen() {
    return this.#state !== ConnectionState.IDLE && this.#state !== ConnectionState.PAUSED;
  }

  connect() {
    if (this.#wantsOpen) return;
    this.#setState(
      this.#state === ConnectionState.IDLE
        ? ConnectionState.CONNECTING
        : ConnectionState.RECONNECTING,
    );
    this.#open();
  }

  disconnect() {
    if (!this.#wantsOpen) return;
    this.#retry.cancel();
    this.#closeSocket();
    this.#setState(ConnectionState.PAUSED);
  }

  subscribe(routeId: string | null) {
    this.#routeId = routeId;
    this.#sendSubscription();
  }

  #setState(state: ConnectionState) {
    if (state === this.#state) return;
    this.#state = state;
    this.#handlers.onStateChange(state);
  }

  #open() {
    this.#retry.cancel();
    const socket = new WebSocket(this.#url);
    this.#socket = socket;

    socket.onopen = () => {
      this.#retry.reset();
      this.#pingTimer = setInterval(
        () => this.#send({ type: WebsocketMessageType.PING }),
        PING_INTERVAL_MS,
      );
      this.#sendSubscription();
      this.#setState(ConnectionState.CONNECTED);
    };

    socket.onmessage = (event) => {
      const message = websocketServerMessageSchema.safeParse(JSON.parse(event.data));
      if (message.success) this.#handlers.onMessage(message.data);
      else appLogger.w(`Ignoring live socket message: ${message.error.message}`);
    };

    socket.onerror = () => socket.close();

    socket.onclose = () => {
      if (this.#socket !== socket) return;
      this.#closeSocket();
      if (this.#state === ConnectionState.CONNECTED) this.#setState(ConnectionState.RECONNECTING);
      const delay = this.#retry.schedule();
      appLogger.i(`Live socket closed, reconnecting in ${Math.round(delay)} ms`);
    };
  }

  #closeSocket() {
    clearInterval(this.#pingTimer);
    const socket = this.#socket;
    this.#socket = null;
    socket?.close();
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
