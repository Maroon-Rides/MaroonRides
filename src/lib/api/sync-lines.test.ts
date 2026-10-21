import { describe, expect, it } from 'vitest';
import { syncStreamLineSchema } from './sync-lines';

const timetableLine = {
  type: 'TimetableV1',
  ack: 'TimetablesV1|1',
  data: { id: 't', stopId: 's', serviceDate: '2026-10-10', departures: null },
};

describe('syncStreamLineSchema', () => {
  it('accepts a line the server sends', () => {
    expect(syncStreamLineSchema.parse(timetableLine)).toEqual(timetableLine);
  });

  it('rejects a line missing a column', () => {
    const { stopId: _, ...data } = timetableLine.data;
    expect(syncStreamLineSchema.safeParse({ ...timetableLine, data }).success).toBe(false);
  });
});
