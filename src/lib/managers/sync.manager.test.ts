import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listeners: new Map<string, () => void>(),
  syncStream: vi.fn(),
  acks: [] as string[],
  planSync: vi.fn(() => []),
  planFullSync: vi.fn(() => []),
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: (event: string, listener: () => void) => mocks.listeners.set(event, listener),
  },
}));
vi.mock('$lib/api/client', () => ({
  getSupportedVersion: () => Promise.resolve('0.0.0'),
  syncStream: mocks.syncStream,
  report: () => Promise.resolve(),
}));
vi.mock('$lib/utils/app-version', () => ({ isAppVersionSupported: () => true }));
vi.mock('$lib/utils/queries', () => ({ refreshDbQueries: () => {} }));
vi.mock('$lib/sync/sync-stream', () => ({
  SYNC_PROTOCOL_V1: 1,
  SYNC_REQUEST_TYPES: [],
  isResetStream: () => false,
  planSync: mocks.planSync,
  planFullSync: mocks.planFullSync,
}));
vi.mock('$lib/db/database', () => {
  const query = {
    where: () => Promise.resolve(),
    from: () => Promise.resolve(mocks.acks.map((ack) => ({ ack }))),
  };
  return {
    db: {
      delete: () => query,
      select: () => query,
      transaction: (run: () => Promise<void>) => run(),
    },
  };
});

const RETRY_DELAY_MS = 5_000;
const MAX_RETRY_DELAY_MS = 5 * 60_000;

async function startedSyncManager() {
  vi.resetModules();
  const { syncManager } = await import('./sync.manager.svelte');
  await syncManager.start();
  return syncManager;
}

function heldRequest() {
  const request: { resolve: (lines: unknown[]) => void; reject: (error: Error) => void } = {
    resolve: () => {},
    reject: () => {},
  };
  mocks.syncStream.mockReturnValueOnce(
    new Promise((resolve, reject) => Object.assign(request, { resolve, reject })),
  );
  return request;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(1);
  mocks.listeners.clear();
  mocks.syncStream.mockReset().mockResolvedValue([]);
  mocks.acks = [];
  mocks.planSync.mockClear();
  mocks.planFullSync.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('SyncManager', () => {
  it('replaces local data when it holds no acks', async () => {
    const syncManager = await startedSyncManager();
    mocks.planFullSync.mockClear();
    await syncManager.sync();

    expect(mocks.syncStream).toHaveBeenLastCalledWith(expect.objectContaining({ acks: [] }));
    expect(mocks.planFullSync).toHaveBeenCalledOnce();
    expect(mocks.planSync).not.toHaveBeenCalled();
  });

  it('applies changes on top of local data when it holds acks', async () => {
    mocks.acks = ['RouteV2|01990000-0000-7000-8000-0000000000aa'];
    const syncManager = await startedSyncManager();
    await syncManager.sync();

    expect(mocks.syncStream).toHaveBeenLastCalledWith(
      expect.objectContaining({ acks: mocks.acks }),
    );
    expect(mocks.planSync).toHaveBeenCalled();
    expect(mocks.planFullSync).not.toHaveBeenCalled();
  });

  it('retries a failed sync in the foreground', async () => {
    const syncManager = await startedSyncManager();
    mocks.syncStream.mockRejectedValueOnce(new Error('offline'));
    await syncManager.sync();
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);

    expect(mocks.syncStream).toHaveBeenCalledTimes(2);
  });

  it('drops a pending retry when another sync starts', async () => {
    const syncManager = await startedSyncManager();
    mocks.syncStream.mockRejectedValueOnce(new Error('offline'));
    await syncManager.sync();

    const request = heldRequest();
    const sync = syncManager.sync();
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);
    request.resolve([]);
    await sync;
    await vi.advanceTimersByTimeAsync(MAX_RETRY_DELAY_MS);

    expect(mocks.syncStream).toHaveBeenCalledTimes(2);
  });

  it('does not retry a sync that fails after the app pauses', async () => {
    const syncManager = await startedSyncManager();
    const request = heldRequest();
    const sync = syncManager.sync();
    await vi.advanceTimersByTimeAsync(0);
    mocks.listeners.get('pause')!();
    request.reject(new Error('unable to open database file'));
    await sync;
    await vi.advanceTimersByTimeAsync(MAX_RETRY_DELAY_MS);

    expect(mocks.syncStream).toHaveBeenCalledOnce();
  });

  it('retries failures again after the app resumes', async () => {
    const syncManager = await startedSyncManager();
    mocks.listeners.get('pause')!();
    mocks.syncStream.mockRejectedValueOnce(new Error('offline'));
    mocks.listeners.get('resume')!();
    await syncManager.sync();
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);

    expect(mocks.syncStream).toHaveBeenCalledTimes(2);
  });
});
