import { getSupportedVersion, syncStream } from '$lib/api/client';
import { db } from '$lib/db/database';
import { syncAck, timetable } from '$lib/db/schema';
import { liveDataManager } from '$lib/managers/live-data.manager.svelte';
import {
  planSync,
  SYNC_PROTOCOL_V1,
  SYNC_REQUEST_TYPES,
  type Statement,
} from '$lib/sync/sync-stream';
import { isAppVersionSupported } from '$lib/utils/app-version';
import { appLogger, describeError } from '$lib/utils/logger';
import { refreshDbQueries } from '$lib/utils/queries';
import { lt, sql } from 'drizzle-orm';

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

/** Owns every write to the local database, which is the sync stream and its cleanup. */
class SyncManager {
  versionStatus = $state(VersionStatus.UNKNOWN);
  isSyncing = $state(false);

  #started = false;
  #syncQueued = false;
  // Writes run one at a time, since web SQLite has no locking of its own.
  #queue: Promise<void> = Promise.resolve();

  async start() {
    if (this.#started) return;
    this.#started = true;

    this.#enqueue(() =>
      db.delete(timetable).where(lt(timetable.serviceDate, sql`date('now', 'localtime')`)),
    );
    await this.sync();
    if (this.versionStatus !== VersionStatus.UNSUPPORTED) {
      liveDataManager.connect(() => this.sync());
    }
  }

  sync(): Promise<void> {
    if (this.#syncQueued) return this.#queue;
    this.#syncQueued = true;

    return this.#enqueue(async () => {
      this.#syncQueued = false;
      this.isSyncing = true;
      try {
        if (await this.#checkVersion()) await this.#runSync();
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

    const lines = await syncStream({
      protocol: SYNC_PROTOCOL_V1,
      types: SYNC_REQUEST_TYPES,
      acks: acks.map(({ ack }) => ack),
    });

    const plan = planSync(lines);
    await applyAll(plan.statements);
    appLogger.i(`Applied ${lines.length} sync lines`);

    // A reset leaves no acks behind, so the next stream is a full sync.
    if (plan.reset) await this.#runSync();
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
