import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RetryScheduler } from './retry-scheduler';

const INITIAL_DELAY_MS = 1_000;
const MAX_DELAY_MS = 4_000;

function scheduler() {
  const task = vi.fn();
  const retry = new RetryScheduler(task, {
    initialDelayMs: INITIAL_DELAY_MS,
    maxDelayMs: MAX_DELAY_MS,
  });
  return { task, retry };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(1);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('RetryScheduler', () => {
  it('doubles the wait after each failure up to the cap', () => {
    const { retry } = scheduler();

    expect([retry.schedule(), retry.schedule(), retry.schedule(), retry.schedule()]).toEqual([
      1_000, 2_000, 4_000, 4_000,
    ]);
  });

  it('runs the task once the wait is over', () => {
    const { task, retry } = scheduler();
    retry.schedule();

    vi.advanceTimersByTime(INITIAL_DELAY_MS - 1);
    expect(task).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(task).toHaveBeenCalledOnce();
  });

  it('replaces a pending attempt when scheduled again', () => {
    const { task, retry } = scheduler();
    retry.schedule();
    retry.schedule();

    vi.advanceTimersByTime(MAX_DELAY_MS);
    expect(task).toHaveBeenCalledOnce();
  });

  it('keeps the current wait when cancelled', () => {
    const { task, retry } = scheduler();
    retry.schedule();
    retry.cancel();

    vi.advanceTimersByTime(MAX_DELAY_MS);
    expect(task).not.toHaveBeenCalled();
    expect(retry.schedule()).toBe(2_000);
  });

  it('cancels the pending attempt and starts over on reset', () => {
    const { task, retry } = scheduler();
    retry.schedule();
    retry.schedule();
    retry.reset();

    vi.advanceTimersByTime(MAX_DELAY_MS);
    expect(task).not.toHaveBeenCalled();
    expect(retry.schedule()).toBe(INITIAL_DELAY_MS);
  });

  it('waits at least half the delay', () => {
    vi.mocked(Math.random).mockReturnValue(0);
    const { retry } = scheduler();

    expect(retry.schedule()).toBe(INITIAL_DELAY_MS / 2);
  });
});
