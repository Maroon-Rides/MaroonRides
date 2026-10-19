import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
    tracker.connecting();

    vi.advanceTimersByTime(FIRST_CONNECT_GRACE_MS - 1);
    expect(tracker.isOffline).toBe(false);
    vi.advanceTimersByTime(1);
    expect(tracker.isOffline).toBe(true);
  });

  it('waits longer before going offline after a dropped connection', () => {
    const tracker = new OfflineTracker();
    tracker.connecting();
    tracker.connected();
    tracker.connecting();

    vi.advanceTimersByTime(RECONNECT_GRACE_MS - 1);
    expect(tracker.isOffline).toBe(false);
    vi.advanceTimersByTime(1);
    expect(tracker.isOffline).toBe(true);
  });

  it('keeps counting from the first attempt across retries', () => {
    const tracker = new OfflineTracker();
    tracker.connecting();
    vi.advanceTimersByTime(FIRST_CONNECT_GRACE_MS - 1);
    tracker.connecting();

    vi.advanceTimersByTime(1);
    expect(tracker.isOffline).toBe(true);
  });

  it('comes back online when the socket connects', () => {
    const tracker = new OfflineTracker();
    tracker.connecting();
    vi.advanceTimersByTime(FIRST_CONNECT_GRACE_MS);
    tracker.connected();

    expect(tracker.isOffline).toBe(false);
  });

  it('does not go offline while paused', () => {
    const tracker = new OfflineTracker();
    tracker.connecting();
    tracker.paused();

    vi.advanceTimersByTime(RECONNECT_GRACE_MS);
    expect(tracker.isOffline).toBe(false);
  });
});
