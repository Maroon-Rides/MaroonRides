import { getSupportedVersion, syncStream } from '$lib/api/client';
import { db } from '$lib/db/database';
import { syncAck, timetable } from '$lib/db/schema';
import { TODAY_SQL } from '$lib/db/sql';
import { SyncApplyError } from '$lib/sync/sync-errors';
import { SyncFailureReporter } from '$lib/sync/sync-reporter';
import {
  isResetStream,
  planFullSync,
  planSync,
  SYNC_PROTOCOL_V1,
  SYNC_REQUEST_TYPES,
  type Statement,
} from '$lib/sync/sync-stream';
import { isAppVersionSupported } from '$lib/utils/app-version';
import { appLogger, describeError } from '$lib/utils/logger';
import { refreshDbQueries } from '$lib/utils/queries';
import { RetryScheduler } from '$lib/utils/retry-scheduler';
import { lt } from 'drizzle-orm';
import { DateTime } from 'luxon';

const INITIAL_RETRY_DELAY_MS = 5_000;
const MAX_RETRY_DELAY_MS = 5 * 60_000;

export enum VersionStatus {
  UNKNOWN = 'unknown',
  SUPPORTED = 'supported',
  UNSUPPORTED = 'unsupported',
}

async function applyAll(statements: Statement[]) {
  try {
    await db.transaction(async () => {
      for (const statement of statements) await statement;
    });
  } catch (cause) {
    throw new SyncApplyError(`sync apply failed: ${describeError(cause)}`, { cause });
  }
}

function fetchLines(acks: string[]) {
  return syncStream({ protocol: SYNC_PROTOCOL_V1, types: SYNC_REQUEST_TYPES, acks });
}

/** Owns every write to the local database, which is the sync stream and its cleanup. */
class SyncManager {
  #versionStatus = $state(VersionStatus.UNKNOWN);
  #isSyncing = $state(false);
  #lastSyncedAt = $state<DateTime | null>(null);

  #startup: Promise<void> | null = null;
  #pendingSync: Promise<void> | null = null;
  readonly #retry = new RetryScheduler(() => this.sync(), {
    initialDelayMs: INITIAL_RETRY_DELAY_MS,
    maxDelayMs: MAX_RETRY_DELAY_MS,
  });
  readonly #reporter = new SyncFailureReporter();
  // Writes run one at a time, since web SQLite has no locking of its own.
  #queue: Promise<void> = Promise.resolve();

  get versionStatus() {
    return this.#versionStatus;
  }

  get isSyncing() {
    return this.#isSyncing;
  }

  get hasSyncedToday(): boolean {
    return this.#lastSyncedAt?.hasSame(DateTime.now(), 'day') ?? false;
  }

  /** Clears past timetables and checks whether the server still supports this app version. */
  start(): Promise<void> {
    this.#startup ??= this.#startUp();
    return this.#startup;
  }

  /** Runs a sync after any already in progress. Calls made while one is waiting share it. */
  sync(): Promise<void> {
    this.#pendingSync ??= this.#enqueue(async () => {
      this.#pendingSync = null;
      this.#isSyncing = true;
      try {
        if (await this.#checkVersion()) {
          await this.#runSync();
          this.#lastSyncedAt = DateTime.now();
        }
        this.#retry.reset();
      } catch (error) {
        const delay = this.#retry.schedule();
        appLogger.w(`Sync failed, retrying in ${Math.round(delay)} ms: ${describeError(error)}`);
      } finally {
        this.#isSyncing = false;
      }
    });
    return this.#pendingSync;
  }

  async #startUp() {
    this.#enqueue(() => db.delete(timetable).where(lt(timetable.serviceDate, TODAY_SQL)));
    await this.#checkVersion().catch((error) =>
      appLogger.w(`Version check failed: ${describeError(error)}`),
    );
  }

  #enqueue(task: () => PromiseLike<unknown>): Promise<void> {
    this.#queue = this.#queue
      .then(task)
      .then(refreshDbQueries)
      .catch((error) => appLogger.e(`Database task failed: ${describeError(error)}`));
    return this.#queue;
  }

  async #checkVersion(): Promise<boolean> {
    if (this.#versionStatus === VersionStatus.UNKNOWN) {
      const minimumVersion = await getSupportedVersion();
      this.#versionStatus = isAppVersionSupported(minimumVersion)
        ? VersionStatus.SUPPORTED
        : VersionStatus.UNSUPPORTED;
    }
    return this.#versionStatus === VersionStatus.SUPPORTED;
  }

  async #runSync() {
    const acks = (await db.select({ ack: syncAck.ack }).from(syncAck)).map(({ ack }) => ack);
    const lines = await this.#reporter.watch(acks, fetchLines(acks));
    if (isResetStream(lines)) return this.#fullSync();

    try {
      await this.#reporter.watch(acks, applyAll(planSync(lines)));
      appLogger.i(`Applied ${lines.length} sync lines`);
    } catch (error) {
      appLogger.w(`Incremental sync failed, running a full sync: ${describeError(error)}`);
      await this.#fullSync();
    }
  }

  async #fullSync() {
    const lines = await this.#reporter.watch([], fetchLines([]));
    await this.#reporter.watch([], applyAll(planFullSync(lines)));
    appLogger.i(`Replaced local data with ${lines.length} sync lines`);
  }
}

// Persist syncManager across Svelte HMRs
let syncManager: SyncManager;

if (import.meta.hot && import.meta.hot.data) {
  if (!import.meta.hot.data.syncManager) {
    import.meta.hot.data.syncManager = new SyncManager();
  }
  syncManager = import.meta.hot.data.syncManager;
} else {
  syncManager = new SyncManager();
}

export { syncManager };
