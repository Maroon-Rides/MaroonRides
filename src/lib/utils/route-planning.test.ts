import type { TripItinerary, TripLeg } from '$lib/api/client';
import { encode } from '@googlemaps/polyline-codec';
import { describe, expect, it } from 'vitest';
import {
  describeLeg,
  formatTripDuration,
  hasBusLeg,
  processRoutePlanMapComponents,
  toTimelineSteps,
} from './route-planning';

const MSC = { name: 'MSC', lat: 30.6123, lon: -96.3415, stopCode: '2700', stopId: null };
const ROSS = {
  name: 'Ross and Bizzell',
  lat: 30.6198,
  lon: -96.3382,
  stopCode: '0014',
  stopId: null,
};
const ORIGIN = { name: 'My Location', lat: 30.61, lon: -96.34, stopCode: null, stopId: null };

function leg(type: TripLeg['type'], from: TripLeg['from'], to: TripLeg['to'], path = ''): TripLeg {
  return { type, from, to, path, startAt: '2026-10-19T15:00:00Z', endAt: '2026-10-19T15:05:00Z' };
}

const ride: TripLeg = {
  ...leg(
    'ride',
    MSC,
    ROSS,
    encode([
      [MSC.lat, MSC.lon],
      [ROSS.lat, ROSS.lon],
    ]),
  ),
  ride: {
    routeShortName: '27',
    headsign: 'Wolf Pen Creek',
    stopCount: 3,
    routeId: null,
    directionId: null,
  },
};

const itinerary: TripItinerary = {
  departAt: '2026-10-19T15:00:00Z',
  arriveAt: '2026-10-19T15:10:00Z',
  walkingSeconds: 300,
  walkingDistanceMeters: 100,
  warnings: [],
  bounds: { swLat: 0, swLon: 0, neLat: 0, neLon: 0 },
  legs: [
    leg(
      'walk',
      ORIGIN,
      MSC,
      encode([
        [ORIGIN.lat, ORIGIN.lon],
        [MSC.lat, MSC.lon],
      ]),
    ),
    ride,
  ],
};

describe('describeLeg', () => {
  it('names where each kind of leg goes', () => {
    expect(describeLeg(leg('walk', ORIGIN, MSC))).toBe('Walk to MSC');
    expect(describeLeg(leg('wait', MSC, MSC))).toBe('Wait at MSC');
    expect(describeLeg(ride)).toBe(
      'Board 27 Wolf Pen Creek, get off at Ross and Bizzell (3 stops)',
    );
  });

  it('counts a single stop in the singular', () => {
    expect(describeLeg({ ...ride, ride: { ...ride.ride!, stopCount: 1 } })).toContain('(1 stop)');
  });
});

describe('processRoutePlanMapComponents', () => {
  it('highlights the whole trip from origin to destination', () => {
    const { highlighted, markers } = processRoutePlanMapComponents(itinerary, null);

    expect(highlighted).toHaveLength(4);
    expect(markers[0]).toMatchObject({ latitude: ORIGIN.lat, isOrigin: true });
    expect(markers[1]).toMatchObject({ latitude: ROSS.lat, isOrigin: false });
  });

  it('highlights one leg and fades the rest', () => {
    const { highlighted, faded } = processRoutePlanMapComponents(itinerary, 1);

    expect(highlighted.map((p) => p.stepIndex)).toEqual([1, 1]);
    expect(faded[0]).toHaveLength(2);
    expect(faded[1]).toHaveLength(0);
  });

  it('pins the arrival at the end of the last leg', () => {
    const { highlighted, markers } = processRoutePlanMapComponents(
      itinerary,
      itinerary.legs!.length,
    );

    expect(highlighted).toHaveLength(0);
    expect(markers).toEqual([
      { latitude: ROSS.lat, longitude: ROSS.lon, icon: 'point', isOrigin: false },
    ]);
  });
});

describe('hasBusLeg', () => {
  it('is true only for a trip that rides a bus', () => {
    expect(hasBusLeg(itinerary)).toBe(true);
    expect(hasBusLeg({ ...itinerary, legs: [itinerary.legs![0]!] })).toBe(false);
  });
});

describe('formatTripDuration', () => {
  it('leaves out hours for a short trip', () => {
    expect(formatTripDuration(itinerary)).toBe('10 minutes');
  });

  it('includes hours for a long trip', () => {
    expect(formatTripDuration({ ...itinerary, arriveAt: '2026-10-19T16:25:30Z' })).toBe(
      '1 hour, 25 minutes',
    );
  });
});

describe('toTimelineSteps', () => {
  it('ends the timeline with the arrival after every leg', () => {
    const steps = toTimelineSteps(itinerary);

    expect(steps).toHaveLength(itinerary.legs!.length + 1);
    expect(steps.at(-1)).toMatchObject({ content: 'Arrive at Ross and Bizzell', instructions: [] });
  });
});
