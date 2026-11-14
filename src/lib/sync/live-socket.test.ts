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
  const onRecovered = vi.fn();
  const socket = new LiveSocket('ws://test', {
    onStateChange: (state) => states.push(state),
    onMessage: () => {},
    onRecovered,
  });
  return { socket, states, onRecovered };
}

const latest = () => FakeWebSocket.opened.at(-1)!;

async function dropAndRecover() {
  latest().close();
  await vi.advanceTimersToNextTimerAsync();
  latest().open();
}
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

  it('reports recovery once a dropped connection comes back', async () => {
    const { socket, onRecovered } = createSocket();
    socket.connect();
    latest().open();
    latest().close();
    await vi.advanceTimersToNextTimerAsync();
    latest().open();

    expect(onRecovered).toHaveBeenCalledOnce();
  });

  it('reports recovery after several failed reconnect attempts', async () => {
    const { socket, onRecovered } = createSocket();
    socket.connect();
    latest().open();
    latest().close();
    await vi.advanceTimersToNextTimerAsync();
    latest().close();
    await vi.advanceTimersToNextTimerAsync();
    latest().open();

    expect(onRecovered).toHaveBeenCalledOnce();
  });

  it('reports recovery once per drop', async () => {
    const { socket, onRecovered } = createSocket();
    socket.connect();
    latest().open();
    await dropAndRecover();
    await dropAndRecover();

    expect(onRecovered).toHaveBeenCalledTimes(2);
  });

  it('does not report recovery when resumed from a pause', async () => {
    const { socket, states, onRecovered } = createSocket();
    socket.connect();
    latest().open();
    socket.disconnect();
    socket.connect();
    await Promise.resolve();
    latest().open();

    expect(onRecovered).not.toHaveBeenCalled();
    expect(states.at(-1)).toBe(ConnectionState.CONNECTED);
  });

  it('does not report recovery when paused while reconnecting', async () => {
    const { socket, onRecovered } = createSocket();
    socket.connect();
    latest().open();
    latest().close();
    await Promise.resolve();
    socket.disconnect();
    socket.connect();
    latest().open();

    expect(onRecovered).not.toHaveBeenCalled();
  });

  it('does not report recovery on the first connection', () => {
    const { socket, onRecovered } = createSocket();
    socket.connect();
    latest().open();

    expect(onRecovered).not.toHaveBeenCalled();
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

  it('reports recovery once a socket lost to a missed pong comes back', async () => {
    const { socket, onRecovered } = createSocket();
    socket.connect();
    latest().open();
    socket.ping();
    await vi.advanceTimersByTimeAsync(PONG_WAIT_MS);
    await vi.advanceTimersToNextTimerAsync();
    latest().open();

    expect(onRecovered).toHaveBeenCalledOnce();
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
