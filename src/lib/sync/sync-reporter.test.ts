import type { ReportEvent } from '$lib/api/client';
import { describe, expect, it, vi } from 'vitest';
import { SyncApplyError, SyncLineError, SyncStatusError } from './sync-errors';
import { SyncFailureReporter, syncFailureEvent } from './sync-reporter';

vi.mock('$lib/db/database', () => ({ db: {} }));

const ACKS = ['SyncCompleteV1|01990000-0000-7000-8000-0000000000aa'];

function reporter() {
  const send = vi.fn<(events: ReportEvent[]) => Promise<void>>().mockResolvedValue();
  return { send, reporter: new SyncFailureReporter(send) };
}

describe('syncFailureEvent', () => {
  it('reports a client error status with the acks the sync started from', () => {
    expect(syncFailureEvent(new SyncStatusError(400, 'unknown type'), ACKS)).toMatchObject({
      type: 'SyncFailedHTTPStatusV1',
      payload: { protocol: 1, acks: ACKS, status: 400 },
    });
  });

  it.each([
    ['a server error', new SyncStatusError(503, undefined)],
    ['being offline', new TypeError('Failed to fetch')],
  ])('leaves out %s', (_, error) => {
    expect(syncFailureEvent(error, ACKS)).toBeNull();
  });

  it.each([
    ['SyncFailedInvalidLineV1', new SyncLineError('unreadable sync line')],
    ['SyncFailedApplyV1', new SyncApplyError('sync apply failed')],
  ])('reports %s', (type, error) => {
    expect(syncFailureEvent(error, [])?.type).toBe(type);
  });

  it('reports the SQLite error instead of the query that hit it', () => {
    const sqliteError = new Error('rc: 14 message: unable to open database file');
    const query = `Failed query: delete from "timetable"\nparams: ${'id,'.repeat(100)}`;
    const queryError = new Error(query, { cause: sqliteError });
    const error = new SyncApplyError('sync apply failed', { cause: queryError });

    expect(syncFailureEvent(error, ACKS)?.payload.message).toBe(`${sqliteError}`);
  });
});

describe('SyncApplyError', () => {
  it.each([
    [
      'iOS',
      'Run: Failed in runSQL :  Error: prepareSQL finalize failed rc: 14 message: unable to open database file',
      true,
    ],
    ['Android', 'unable to open database file (code 14 SQLITE_CANTOPEN)', true],
    ['a constraint', 'UNIQUE constraint failed: route.id', false],
  ])('knows when the database was unavailable on %s', (_, message, unavailable) => {
    const error = new SyncApplyError('sync apply failed', { cause: new Error(message) });

    expect(error.isDatabaseUnavailable).toBe(unavailable);
  });
});

describe('SyncFailureReporter', () => {
  it('rethrows the failure after reporting it', async () => {
    const { send, reporter: r } = reporter();
    const error = new SyncApplyError('sync apply failed');

    await expect(r.watch(ACKS, Promise.reject(error))).rejects.toBe(error);
    expect(send).toHaveBeenCalledOnce();
  });

  it('reports a failure once per launch, but apart for an empty database', async () => {
    const { send, reporter: r } = reporter();
    const fail = () => Promise.reject(new SyncApplyError('sync apply failed'));

    await r.watch(ACKS, fail()).catch(() => {});
    await r.watch(ACKS, fail()).catch(() => {});
    await r.watch([], fail()).catch(() => {});

    expect(send.mock.calls.map(([[event]]) => event.payload.acks)).toEqual([ACKS, []]);
  });

  it('keeps the sync failure when the report itself fails', async () => {
    const { send, reporter: r } = reporter();
    send.mockRejectedValue(new Error('offline'));
    const error = new SyncLineError('unreadable sync line');

    await expect(r.watch(ACKS, Promise.reject(error))).rejects.toBe(error);
  });
});
