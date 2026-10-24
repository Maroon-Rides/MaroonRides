import { rootCause } from '$lib/utils/logger';

export class SyncStatusError extends Error {
  constructor(
    readonly status: number,
    detail: string | undefined,
  ) {
    super(`sync stream failed with ${status}: ${detail}`);
  }
}

export class SyncLineError extends Error {}

// SQLite's text for SQLITE_CANTOPEN, which the plugin passes through on every platform.
const CANT_OPEN_MESSAGE = 'unable to open database file';

export class SyncApplyError extends Error {
  /** A full sync writes to the same file, so it would fail the same way. */
  get isDatabaseUnavailable(): boolean {
    return `${rootCause(this)}`.includes(CANT_OPEN_MESSAGE);
  }
}
