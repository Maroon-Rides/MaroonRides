import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectionState, LiveSocket } from './live-socket';

class FakeWebSocket {
  static readonly OPEN = 1;
  static opened: FakeWebSocket[] = [];

  readyState = 0;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;

  constructor() {
    FakeWebSocket.opened.push(this);
  }

  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  send() {}

  close() {
    queueMicrotask(() => this.onclose?.());
  }
}

function createSocket() {
  const states: ConnectionState[] = [];
  const socket = new LiveSocket('ws://test', {
    onStateChange: (state) => states.push(state),
    onMessage: () => {},
  });
  return { socket, states };
}

const latest = () => FakeWebSocket.opened.at(-1)!;
const PONG_WAIT_MS = 5_000;

beforeEach(() => {
  FakeWebSocket.opened = [];
  vi.useFakeTimers();
  vi.stubGlobal('WebSocket', FakeWebSocket);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('LiveSocket', () => {
  it('stays connecting across failed first attempts', async () => {
    const { socket, states } = createSocket();
    socket.connect();
    latest().close();
    await vi.runAllTimersAsync();

    expect(states).toEqual([ConnectionState.CONNECTING]);
    expect(FakeWebSocket.opened.length).toBeGreaterThan(1);
  });

  it('reconnects after a dropped connection', async () => {
    const { socket, states } = createSocket();
    socket.connect();
    latest().open();
    latest().close();
    await vi.advanceTimersToNextTimerAsync();
    latest().open();

    expect(states).toEqual([
      ConnectionState.CONNECTING,
      ConnectionState.CONNECTED,
      ConnectionState.RECONNECTING,
      ConnectionState.CONNECTED,
    ]);
  });

  it('opens a new socket right away when resumed before the old one finishes closing', () => {
    const { socket, states } = createSocket();
    socket.connect();
    latest().open();
    socket.disconnect();
    socket.connect();

    expect(FakeWebSocket.opened).toHaveLength(2);
    expect(states.at(-1)).toBe(ConnectionState.RECONNECTING);
  });

  it('ignores a second connect while already connecting', () => {
    const { socket } = createSocket();
    socket.connect();
    socket.connect();

    expect(FakeWebSocket.opened).toHaveLength(1);
  });
});

describe('LiveSocket heartbeat', () => {
  it('treats a socket that stops answering pings as lost', async () => {
    const { socket, states } = createSocket();
    socket.connect();
    latest().open();
    socket.ping();
    await vi.advanceTimersByTimeAsync(PONG_WAIT_MS);

    expect(states.at(-1)).toBe(ConnectionState.RECONNECTING);
  });

  it('stays connected while the gateway answers', async () => {
    const { socket, states } = createSocket();
    socket.connect();
    latest().open();
    socket.ping();
    latest().onmessage?.({ data: JSON.stringify({ type: 'pong' }) });
    await vi.advanceTimersByTimeAsync(PONG_WAIT_MS);

    expect(states.at(-1)).toBe(ConnectionState.CONNECTED);
  });
});
