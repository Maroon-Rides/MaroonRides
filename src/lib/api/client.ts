import createClient from 'openapi-fetch';
import type { components, paths } from './openapi';
import { SyncLineError, SyncStatusError } from '$lib/sync/sync-errors';
import { syncStreamLineSchema } from './sync-lines';

const PRODUCTION_API_URL = 'https://api.maroonrides.app';
const LINE_SEPARATOR = '\n';

export const API_URL: string = import.meta.env.VITE_API_URL ?? PRODUCTION_API_URL;
export const WEBSOCKET_URL = `${API_URL.replace(/^http/, 'ws')}/api/ws`;

type Schemas = components['schemas'];
export type SyncRequest = Schemas['SyncRequest'];
export type SyncRequestType = Schemas['SyncRequestType'];
export type SyncEntityType = Schemas['SyncEntityType'];
export type SyncStreamLine = Schemas['SyncStreamLine'];
export type ReportEvent = Schemas['ReportEvent'];
export type TripPlanRequest = Schemas['TripPlanRequest'];
export type TripItinerary = Schemas['TripItinerary'];
export type TripLeg = Schemas['TripLeg'];
export type TripWalkStep = Schemas['TripWalkStep'];
export type TripLegType = Schemas['TripLegType'];
export type TripTimeKind = Schemas['TripTimeKind'];

const client = createClient<paths>({ baseUrl: API_URL });

export async function getSupportedVersion(): Promise<string> {
  const { data, error } = await client.GET('/api/version/supported');
  if (error) throw new Error(`version check failed: ${error.detail}`);
  return data.version;
}

export async function syncStream(body: SyncRequest): Promise<SyncStreamLine[]> {
  const { data, error, response } = await client.POST('/api/sync/stream', {
    body,
    parseAs: 'text',
  });
  if (error) throw new SyncStatusError(response.status, error.detail);

  try {
    return data
      .split(LINE_SEPARATOR)
      .filter(Boolean)
      .map((line) => syncStreamLineSchema.parse(JSON.parse(line)) satisfies SyncStreamLine);
  } catch (cause) {
    throw new SyncLineError(`unreadable sync line: ${cause}`, { cause });
  }
}

export async function report(events: ReportEvent[]): Promise<void> {
  const { error, response } = await client.POST('/api/reports', { body: { events } });
  if (error) throw new Error(`report failed with ${response.status}: ${error.detail}`);
}

export async function planTrip(body: TripPlanRequest): Promise<TripItinerary[]> {
  const { data, error } = await client.POST('/api/trip-plan', { body });
  if (error) throw new Error(`trip plan failed: ${error.detail}`);
  return data.itineraries ?? [];
}
