import { afterEach, describe, expect, it, vi } from 'vitest';
import { WholeFileSource } from './whole-file-source';

const URL = '/map/test.pmtiles';
const FILE = Uint8Array.from({ length: 32 }, (_, i) => i);

function mockFetch(...responses: Response[]) {
  const fetchMock = vi.fn();
  for (const response of responses) fetchMock.mockResolvedValueOnce(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('WholeFileSource', () => {
  it('slices reads out of one download', async () => {
    const fetchMock = mockFetch(new Response(FILE));
    const source = new WholeFileSource(URL);

    const [first, second] = await Promise.all([source.getBytes(0, 4), source.getBytes(10, 3)]);

    expect([...new Uint8Array(first.data)]).toEqual([0, 1, 2, 3]);
    expect([...new Uint8Array(second.data)]).toEqual([10, 11, 12]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('downloads again after a failed download', async () => {
    const fetchMock = mockFetch(new Response(null, { status: 503 }), new Response(FILE));
    const source = new WholeFileSource(URL);

    await expect(source.getBytes(0, 4)).rejects.toThrow('503');
    const retry = await source.getBytes(0, 2);

    expect([...new Uint8Array(retry.data)]).toEqual([0, 1]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('keys the source by its url', () => {
    expect(new WholeFileSource(URL).getKey()).toBe(URL);
  });
});
