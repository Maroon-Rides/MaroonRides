const BACKOFF_FACTOR = 2;

interface RetrySchedulerOptions {
  initialDelayMs: number;
  maxDelayMs: number;
}

export class RetryScheduler {
  readonly #task: () => void;
  readonly #initialDelayMs: number;
  readonly #maxDelayMs: number;

  #delayMs: number;
  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor(task: () => void, { initialDelayMs, maxDelayMs }: RetrySchedulerOptions) {
    this.#task = task;
    this.#initialDelayMs = initialDelayMs;
    this.#maxDelayMs = maxDelayMs;
    this.#delayMs = initialDelayMs;
  }

  /** Schedules the next attempt, replacing any pending one, and returns how long it waits. */
  schedule(): number {
    clearTimeout(this.#timer);
    // Jitter keeps every phone from retrying at once after a server outage.
    const delay = this.#delayMs / 2 + Math.random() * (this.#delayMs / 2);
    this.#delayMs = Math.min(this.#delayMs * BACKOFF_FACTOR, this.#maxDelayMs);
    this.#timer = setTimeout(this.#task, delay);
    return delay;
  }

  /** Drops the pending attempt but keeps the current wait for the next failure. */
  cancel() {
    clearTimeout(this.#timer);
  }

  reset() {
    this.cancel();
    this.#delayMs = this.#initialDelayMs;
  }
}
