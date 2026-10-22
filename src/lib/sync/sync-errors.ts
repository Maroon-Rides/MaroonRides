export class SyncStatusError extends Error {
  constructor(
    readonly status: number,
    detail: string | undefined,
  ) {
    super(`sync stream failed with ${status}: ${detail}`);
  }
}

export class SyncLineError extends Error {}

export class SyncApplyError extends Error {}
