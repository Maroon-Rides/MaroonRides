import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectionState } from './live-socket';
import {
  FIRST_CONNECT_GRACE_MS,
  OfflineTracker,
  RECONNECT_GRACE_MS,
} from './offline-tracker.svelte';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('OfflineTracker', () => {
  it('goes offline when the first connection takes too long', () => {
    const tracker = new OfflineTracker();
    tracker.update(ConnectionState.CONNECTING);

    vi.advanceTimersByTime(FIRST_CONNECT_GRACE_MS - 1);
    expect(tracker.isOffline).toBe(false);
    vi.advanceTimersByTime(1);
    expect(tracker.isOffline).toBe(true);
  });

  it('waits longer before going offline after a dropped connection', () => {
    const tracker = new OfflineTracker();
    tracker.update(ConnectionState.RECONNECTING);

    vi.advanceTimersByTime(RECONNECT_GRACE_MS - 1);
    expect(tracker.isOffline).toBe(false);
    vi.advanceTimersByTime(1);
    expect(tracker.isOffline).toBe(true);
  });

  it('comes back online when the socket connects', () => {
    const tracker = new OfflineTracker();
    tracker.update(ConnectionState.CONNECTING);
    vi.advanceTimersByTime(FIRST_CONNECT_GRACE_MS);
    tracker.update(ConnectionState.CONNECTED);

    expect(tracker.isOffline).toBe(false);
  });

  it('does not go offline while paused', () => {
    const tracker = new OfflineTracker();
    tracker.update(ConnectionState.RECONNECTING);
    tracker.update(ConnectionState.PAUSED);

    vi.advanceTimersByTime(RECONNECT_GRACE_MS);
    expect(tracker.isOffline).toBe(false);
  });
});
