import { report, type ReportEvent } from '$lib/api/client';
import { appLogger, describeError } from '$lib/utils/logger';
import { SyncApplyError, SyncLineError, SyncStatusError } from './sync-errors';
import { SYNC_PROTOCOL_V1 } from './sync-stream';

// The gateway already counts the errors it serves, and the client cannot tell them from an outage.
const FIRST_SERVER_ERROR_STATUS = 500;

/** Returns null for failures not worth reporting, like being offline or the gateway being down. */
export function syncFailureEvent(error: unknown, acks: string[]): ReportEvent | null {
  const payload = { protocol: SYNC_PROTOCOL_V1, acks, message: describeError(error) };

  if (error instanceof SyncStatusError && error.status < FIRST_SERVER_ERROR_STATUS) {
    return { type: 'SyncFailedHTTPStatusV1', payload: { ...payload, status: error.status } };
  }
  if (error instanceof SyncLineError) return { type: 'SyncFailedInvalidLineV1', payload };
  if (error instanceof SyncApplyError) return { type: 'SyncFailedApplyV1', payload };
  return null;
}

/** Reports each kind of failure once per launch, so a retry loop does not repeat it. */
export class SyncFailureReporter {
  readonly #reported = new Set<string>();

  constructor(private readonly send: (events: ReportEvent[]) => Promise<void> = report) {}

  /** Reports the task's failure against the acks it synced from, then rethrows it. */
  async watch<T>(acks: string[], task: Promise<T>): Promise<T> {
    try {
      return await task;
    } catch (error) {
      this.#report(syncFailureEvent(error, acks));
      throw error;
    }
  }

  #report(event: ReportEvent | null) {
    if (!event) return;

    const key = `${event.type}|${event.payload.acks?.length === 0}`;
    if (this.#reported.has(key)) return;
    this.#reported.add(key);

    this.send([event]).catch((error) =>
      appLogger.w(`Sync failure report failed: ${describeError(error)}`),
    );
  }
}
