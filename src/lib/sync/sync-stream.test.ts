import type { SyncStreamLine } from '$lib/api/client';
import initSqlJs, { type Database } from 'sql.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { isResetStream, planFullSync, planSync, type Statement } from './sync-stream';

const MIGRATION_BREAKPOINT = '--> statement-breakpoint';
const migrationFiles = import.meta.glob<string>('../db/migrations/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const ROUTE_ID = '01990000-0000-7000-8000-000000000001';
const DIRECTION_ID = '01990000-0000-7000-8000-000000000002';
const STOP_ID = '01990000-0000-7000-8000-000000000003';
const ACK_ID = '01990000-0000-7000-8000-0000000000aa';

let sqlite: Database;

function apply(statements: Statement[]) {
  for (const statement of statements) {
    const { sql, params } = statement.toSQL();
    sqlite.run(sql, params as never);
  }
}

function rows(sql: string) {
  return sqlite.exec(sql)[0]?.values ?? [];
}

const routeLine = (longName: string, ack: string, isLoop = true): SyncStreamLine => ({
  type: 'RouteV2',
  ack: `RouteV2|${ack}`,
  data: {
    id: ROUTE_ID,
    shortName: '01',
    longName,
    lightColor: '#500000',
    darkColor: '#ff5555',
    active: true,
    isLoop,
  },
});

function migrate(files: string[]) {
  for (const file of files) {
    migrationFiles[file].split(MIGRATION_BREAKPOINT).forEach((statement) => sqlite.run(statement));
  }
}

beforeEach(async () => {
  const SQL = await initSqlJs();
  sqlite = new SQL.Database();
});

describe('route loop migration', () => {
  it('keeps stored routes as loops and drops every ack so the next sync replaces them', () => {
    const [initial, routeIsLoop] = Object.keys(migrationFiles).sort();
    migrate([initial]);
    sqlite.run(
      `INSERT INTO route VALUES ('${ROUTE_ID}', '01', 'Bonfire', '#500000', '#ff5555', 1)`,
    );
    sqlite.run(`INSERT INTO sync_ack VALUES ('RouteV1', 'RouteV1|${ACK_ID}')`);

    migrate([routeIsLoop]);

    expect(rows('SELECT id, is_loop FROM route')).toEqual([[ROUTE_ID, 1]]);
    expect(rows('SELECT key FROM sync_ack')).toEqual([]);
  });
});

describe('planSync', () => {
  beforeEach(() => migrate(Object.keys(migrationFiles).sort()));

  it('stores whether a route loops', () => {
    apply(planSync([routeLine('Gameday Bonfire', ACK_ID, false)]));

    expect(rows('SELECT is_loop FROM route')).toEqual([[0]]);
  });

  it('stores rows as the server sends them, with null lists as empty', () => {
    apply(
      planSync([
        routeLine('Bonfire', ACK_ID),
        {
          type: 'StopV1',
          ack: `StopV1|${ACK_ID}`,
          data: {
            id: STOP_ID,
            directionId: DIRECTION_ID,
            name: 'MSC',
            lat: 30.6,
            lon: -96.3,
            amenities: null,
            sequence: 0,
            isTimepoint: false,
          },
        },
        { type: 'SyncCompleteV1', ack: `SyncCompleteV1|${ACK_ID}`, data: {} },
      ]),
    );

    expect(rows('SELECT id, short_name, long_name, active FROM route')).toEqual([
      [ROUTE_ID, '01', 'Bonfire', 1],
    ]);
    expect(rows('SELECT amenities FROM stop')).toEqual([['[]']]);
  });

  it('keeps only the newest ack per entity key', () => {
    const newerAck = '01990000-0000-7000-8000-0000000000bb';
    apply(planSync([routeLine('Bonfire', ACK_ID), routeLine('Bonfire Express', newerAck)]));

    expect(rows('SELECT long_name FROM route')).toEqual([['Bonfire Express']]);
    expect(rows('SELECT key, ack FROM sync_ack')).toEqual([['RouteV2', `RouteV2|${newerAck}`]]);
  });

  it('applies each run of lines in the order it arrived', () => {
    apply(planSync([routeLine('Bonfire', ACK_ID)]));
    apply(
      planSync([
        {
          type: 'DirectionV1',
          ack: `DirectionV1|${ACK_ID}`,
          data: { id: DIRECTION_ID, routeId: ROUTE_ID, destination: 'MSC', sequence: 0, path: '' },
        },
        { type: 'RouteDeleteV2', ack: `RouteDeleteV2|${ACK_ID}`, data: { routeId: ROUTE_ID } },
      ]),
    );

    expect(rows('SELECT id FROM route')).toEqual([]);
    expect(rows('SELECT id FROM direction')).toEqual([[DIRECTION_ID]]);
  });

  it('drops rows and acks missing from a full sync', () => {
    const fullAck = '01990000-0000-7000-8000-0000000000bb';
    apply(
      planSync([
        routeLine('Bonfire', ACK_ID),
        {
          type: 'DirectionV1',
          ack: `DirectionV1|${ACK_ID}`,
          data: { id: DIRECTION_ID, routeId: ROUTE_ID, destination: 'MSC', sequence: 0, path: '' },
        },
      ]),
    );
    apply(planFullSync([routeLine('Bonfire Express', fullAck)]));

    expect(rows('SELECT long_name FROM route')).toEqual([['Bonfire Express']]);
    expect(rows('SELECT id FROM direction')).toEqual([]);
    expect(rows('SELECT ack FROM sync_ack')).toEqual([[`RouteV2|${fullAck}`]]);
  });
});

describe('isResetStream', () => {
  it('is true only when the stream opens with a reset', () => {
    const reset: SyncStreamLine = { type: 'SyncResetV1', ack: `SyncResetV1|${ACK_ID}`, data: {} };

    expect(isResetStream([reset])).toBe(true);
    expect(isResetStream([routeLine('Bonfire', ACK_ID), reset])).toBe(false);
    expect(isResetStream([])).toBe(false);
  });
});
