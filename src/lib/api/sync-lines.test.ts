import { describe, expect, expectTypeOf, it } from 'vitest';
import type { z } from 'zod';
import type { SyncEntityType } from './client';
import { syncStreamLineSchema } from './sync-lines';

const timetableLine = {
  type: 'TimetableV1',
  ack: 'TimetablesV1|1',
  data: { id: 't', stopId: 's', serviceDate: '2026-10-10', departures: null },
};

const routeLine = {
  type: 'RouteV2',
  ack: 'RouteV2|1',
  data: {
    id: 'r',
    shortName: 'AGR',
    longName: 'Gameday Agronomy',
    lightColor: '#f7941d',
    darkColor: '#f7941d',
    active: true,
    isLoop: false,
  },
};

describe('syncStreamLineSchema', () => {
  it('accepts a line the server sends', () => {
    expect(syncStreamLineSchema.parse(timetableLine)).toEqual(timetableLine);
  });

  it('accepts a RoutesV2 line', () => {
    expect(syncStreamLineSchema.parse(routeLine)).toEqual(routeLine);
  });

  it('rejects a line missing a column', () => {
    const { stopId: _, ...data } = timetableLine.data;
    expect(syncStreamLineSchema.safeParse({ ...timetableLine, data }).success).toBe(false);
  });

  it('covers every line type in the api spec', () => {
    expectTypeOf<z.infer<typeof syncStreamLineSchema>['type']>().toEqualTypeOf<SyncEntityType>();
  });
});
