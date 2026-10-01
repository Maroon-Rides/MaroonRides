import {
  GetBaseDataResponseSchema,
  GetPatternPathsResponseSchema,
  GetTripPlanResponseSchema,
  type IFoundStop,
  type IPatternPoint,
  type ITripPlanResponse,
} from '$lib/data/typecheck/aggie_spirit';
import { type SearchSuggestion } from '$lib/utils/route-planning';
import { findBusStops, getBaseData, getPatternPaths, getTripPlan } from 'aggie-spirit-api';
import { keyBy } from 'lodash-es';
import moment from 'moment';

// Only route planning still talks to Aggie Spirit, since the Maroon Rides API has no trip planner.

export type Headers = { [key: string]: string };

const AUTH_URL = 'https://auth.maroonrides.app';
const AGGIE_SPIRIT_URL = 'https://aggiespirit.ts.tamu.edu';
const AUTH_TOKEN_TTL = moment.duration(15, 'minutes');
const STOP_LOCATIONS_TTL = moment.duration(30, 'minutes');
const AUTH_CODE_TTL = moment.duration(1, 'day');

/** Reuses one in-flight or recent result, and drops it on failure so the next call retries. */
function cached<T>(ttl: moment.Duration, load: () => Promise<T>): () => Promise<T> {
  let value: Promise<T> | null = null;
  let loadedAt = 0;

  return () => {
    if (!value || moment.now() - loadedAt > ttl.asMilliseconds()) {
      loadedAt = moment.now();
      value = load().catch((error) => {
        value = null;
        throw error;
      });
    }
    return value;
  };
}

function extractRequestVerificationToken(html: string): string {
  const matches = html.match(/"[a-zA-Z0-9]{288}MQ=="/g);
  if (matches === null) {
    throw new Error('Could not find verification token');
  }

  return atob(matches[0].slice(1, -1));
}

const ensureAuthCode = cached(AUTH_CODE_TTL, () => fetch(AUTH_URL));

async function fetchVerificationHeaders(path: string): Promise<Headers> {
  await ensureAuthCode();
  const res = await fetch(`${AGGIE_SPIRIT_URL}/${path}`, { credentials: 'omit' });

  return {
    Requestverificationtoken: extractRequestVerificationToken(await res.text()),
    'X-Requested-With': 'XMLHttpRequest',
  };
}

const getAuthHeaders = cached(AUTH_TOKEN_TTL, () => fetchVerificationHeaders(''));

const getStopLocations = cached(STOP_LOCATIONS_TTL, async () => {
  const headers = await getAuthHeaders();
  const baseData = GetBaseDataResponseSchema.parse(await getBaseData(headers));
  const patternPaths = GetPatternPathsResponseSchema.parse(
    await getPatternPaths(
      baseData.routes.map((route) => route.key),
      headers,
    ),
  );

  const stopPoints = patternPaths
    .flatMap((route) => route.patternPaths)
    .flatMap((path) => path.patternPoints)
    .filter((point): point is IPatternPoint & { stop: NonNullable<IPatternPoint['stop']> } =>
      Boolean(point.stop),
    );

  return keyBy(stopPoints, (point) => point.stop.stopCode);
});

export async function searchBusStops(query: string): Promise<SearchSuggestion[]> {
  const headers = await getAuthHeaders();
  const [stops, stopLocations] = await Promise.all([
    findBusStops(query, {
      Cookie: headers['Cookie']!,
      'X-Requested-With': headers['X-Requested-With']!,
    }),
    getStopLocations(),
  ]);

  return stops.map((stop: IFoundStop) => {
    const point = stopLocations[stop.stopCode];
    return {
      type: 'stop',
      title: point?.stop.name ?? '',
      subtitle: 'ID: ' + point?.stop.stopCode,
      stopCode: point?.stop.stopCode,
      lat: point?.latitude,
      long: point?.longitude,
    };
  });
}

function tripPlannerPath(origin: SearchSuggestion, destination: SearchSuggestion, date: Date) {
  const time = (date.getTime() / 1000).toFixed(0);

  if (origin.title === 'My Location') {
    return `TripPlanner/Results?o1=${origin.title}&ola=${origin.lat}&olo=${origin.long}&og=1&d1=${destination.title}&dsc=${destination.stopCode}&dt=${time}&ro=0`;
  }
  if (destination.title === 'My Location') {
    return `TripPlanner/Results?o1=${origin.title}&osc=${origin.stopCode}&d1=${destination.title}&dla=${origin.lat}&dlo=${origin.long}&dg=true&dt=${time}&ro=0`;
  }
  return `TripPlanner/Results?o1=${origin.title}&osc=${origin.stopCode}&d1=${destination.title}&dsc=${destination.stopCode}&dt=${time}&ro=0`;
}

export async function planTrip(
  origin: SearchSuggestion,
  destination: SearchSuggestion,
  date: Date,
  deadline: 'leave' | 'arrive',
): Promise<ITripPlanResponse> {
  const headers = await fetchVerificationHeaders(tripPlannerPath(origin, destination, date));
  const response = await getTripPlan(
    headers,
    origin,
    destination,
    0,
    deadline === 'arrive' ? date : undefined,
    deadline === 'leave' ? date : undefined,
  );

  GetTripPlanResponseSchema.parse(response);

  // @ts-expect-error: Types are wrong in lib
  return response as ITripPlanResponse;
}
