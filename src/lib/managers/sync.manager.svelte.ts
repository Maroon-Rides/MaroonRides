import { getSupportedVersion, reportSyncFailure, syncStream, SyncMode } from '$lib/api/client';
import { db } from '$lib/db/database';
import { syncAck, timetable } from '$lib/db/schema';
import {
  isResetStream,
  planFullSync,
  planSync,
  SYNC_PROTOCOL_V1,
  SYNC_REQUEST_TYPES,
  type Statement,
} from '$lib/sync/sync-stream';
import { APP_VERSION, isAppVersionSupported } from '$lib/utils/app-version';
import { appLogger, describeError } from '$lib/utils/logger';
import { refreshDbQueries } from '$lib/utils/queries';
import { RetryScheduler } from '$lib/utils/retry-scheduler';
import { lt, sql } from 'drizzle-orm';
import { DateTime } from 'luxon';

const INITIAL_RETRY_DELAY_MS = 5_000;
const MAX_RETRY_DELAY_MS = 5 * 60_000;

export enum VersionStatus {
  UNKNOWN = 'unknown',
  SUPPORTED = 'supported',
  UNSUPPORTED = 'unsupported',
}

function applyAll(statements: Statement[]) {
  return db.transaction(async () => {
    for (const statement of statements) await statement;
  });
}

function fetchLines(acks: string[]) {
  return syncStream({ protocol: SYNC_PROTOCOL_V1, types: SYNC_REQUEST_TYPES, acks });
}

function reportFailure(mode: SyncMode, error: unknown) {
  return reportSyncFailure({ mode, appVersion: APP_VERSION, error: describeError(error) });
}

/** Owns every write to the local database, which is the sync stream and its cleanup. */
class SyncManager {
  versionStatus = $state(VersionStatus.UNKNOWN);
  isSyncing = $state(false);

  #lastSyncedAt = $state<DateTime | null>(null);
  #started = false;
  #syncQueued = false;
  readonly #retry = new RetryScheduler(() => this.sync(), {
    initialDelayMs: INITIAL_RETRY_DELAY_MS,
    maxDelayMs: MAX_RETRY_DELAY_MS,
  });
  // Writes run one at a time, since web SQLite has no locking of its own.
  #queue: Promise<void> = Promise.resolve();

  get hasSyncedToday(): boolean {
    return this.#lastSyncedAt?.hasSame(DateTime.now(), 'day') ?? false;
  }

  async start() {
    if (this.#started) return;
    this.#started = true;

    this.#enqueue(() =>
      db.delete(timetable).where(lt(timetable.serviceDate, sql`date('now', 'localtime')`)),
    );
    await this.#checkVersion().catch((error) =>
      appLogger.w(`Version check failed: ${describeError(error)}`),
    );
  }

  sync(): Promise<void> {
    if (this.#syncQueued) return this.#queue;
    this.#syncQueued = true;

    return this.#enqueue(async () => {
      this.#syncQueued = false;
      this.isSyncing = true;
      try {
        if (await this.#checkVersion()) {
          await this.#runSync();
          this.#lastSyncedAt = DateTime.now();
        }
        this.#retry.reset();
      } catch (error) {
        const delay = this.#retry.schedule();
        appLogger.w(`Sync failed, retrying in ${Math.round(delay)} ms`);
        throw error;
      } finally {
        this.isSyncing = false;
      }
    });
  }

  // Every task may have changed data on screen, so each one refreshes the database queries.
  #enqueue(task: () => PromiseLike<unknown>): Promise<void> {
    this.#queue = this.#queue
      .then(task)
      .then(refreshDbQueries)
      .catch((error) => appLogger.e(`Database task failed: ${describeError(error)}`));
    return this.#queue;
  }

  async #checkVersion(): Promise<boolean> {
    if (this.versionStatus === VersionStatus.UNKNOWN) {
      const minimumVersion = await getSupportedVersion();
      this.versionStatus = isAppVersionSupported(minimumVersion)
        ? VersionStatus.SUPPORTED
        : VersionStatus.UNSUPPORTED;
    }
    return this.versionStatus === VersionStatus.SUPPORTED;
  }

  async #runSync() {
    const acks = await db.select({ ack: syncAck.ack }).from(syncAck);
    const lines = await fetchLines(acks.map(({ ack }) => ack));
    if (isResetStream(lines)) return this.#fullSync();

    try {
      await applyAll(planSync(lines));
      appLogger.i(`Applied ${lines.length} sync lines`);
    } catch (error) {
      await reportFailure(SyncMode.INCREMENTAL, error);
      await this.#fullSync();
    }
  }

  async #fullSync() {
    const lines = await fetchLines([]);
    try {
      await applyAll(planFullSync(lines));
      appLogger.i(`Replaced local data with ${lines.length} sync lines`);
    } catch (error) {
      await reportFailure(SyncMode.FULL, error);
      throw error;
    }
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
