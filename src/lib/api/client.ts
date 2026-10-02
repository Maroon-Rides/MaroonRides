import createClient from 'openapi-fetch';
import type { components, paths } from './openapi';

const PRODUCTION_API_URL = 'https://api.maroonrides.app';
const DEV_SERVER_API_URL = 'http://100.89.139.58:3000';
const LINE_SEPARATOR = '\n';

export const API_URL: string =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? PRODUCTION_API_URL : PRODUCTION_API_URL);
export const WEBSOCKET_URL = `${API_URL.replace(/^http/, 'ws')}/api/ws`;

type Schemas = components['schemas'];
export type SyncRequest = Schemas['SyncRequest'];
export type SyncRequestType = Schemas['SyncRequestType'];
export type SyncEntityType = Schemas['SyncEntityType'];
export type SyncStreamLine = Schemas['SyncStreamLine'];

const client = createClient<paths>({ baseUrl: API_URL });

export async function getSupportedVersion(): Promise<string> {
  const { data, error } = await client.GET('/api/version/supported');
  if (error) throw new Error(`version check failed: ${error.detail}`);
  return data.version;
}

export async function syncStream(body: SyncRequest): Promise<SyncStreamLine[]> {
  const { data, error } = await client.POST('/api/sync/stream', { body, parseAs: 'text' });
  if (error) throw new Error(`sync stream failed: ${error.detail}`);

  return data
    .split(LINE_SEPARATOR)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as SyncStreamLine);
}
