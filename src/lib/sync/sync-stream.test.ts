import type { SyncStreamLine } from '$lib/api/client';
import initSqlJs, { type Database } from 'sql.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { planSync, type SyncPlan } from './sync-stream';

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

function apply(plan: SyncPlan) {
  for (const statement of plan.statements) {
    const { sql, params } = statement.toSQL();
    sqlite.run(sql, params as never);
  }
}

function rows(sql: string) {
  return sqlite.exec(sql)[0]?.values ?? [];
}

const routeLine = (longName: string, ack: string): SyncStreamLine => ({
  type: 'RouteV1',
  ack: `RouteV1|${ack}`,
  data: {
    id: ROUTE_ID,
    shortName: '01',
    longName,
    lightColor: '#500000',
    darkColor: '#ff5555',
    active: true,
  },
});

beforeEach(async () => {
  const SQL = await initSqlJs();
  sqlite = new SQL.Database();
  for (const file of Object.keys(migrationFiles).sort()) {
    migrationFiles[file].split(MIGRATION_BREAKPOINT).forEach((statement) => sqlite.run(statement));
  }
});

describe('planSync', () => {
  it('stores rows as the server sends them', () => {
    apply(
      planSync([
        routeLine('Bonfire', ACK_ID),
        {
          type: 'StopV1',
          ack: `StopV1|${ACK_ID}`,
          data: { id: STOP_ID, name: 'MSC', lat: 30.6, lon: -96.3, amenities: null },
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
    expect(rows('SELECT key, ack FROM sync_ack')).toEqual([['RouteV1', `RouteV1|${newerAck}`]]);
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
        { type: 'RouteDeleteV1', ack: `RouteDeleteV1|${ACK_ID}`, data: { routeId: ROUTE_ID } },
      ]),
    );

    expect(rows('SELECT id FROM route')).toEqual([]);
    expect(rows('SELECT id FROM direction')).toEqual([[DIRECTION_ID]]);
  });

  it('wipes synced tables and acks on reset', () => {
    apply(planSync([routeLine('Bonfire', ACK_ID)]));
    const plan = planSync([{ type: 'SyncResetV1', ack: `SyncResetV1|${ACK_ID}`, data: {} }]);
    apply(plan);

    expect(plan.reset).toBe(true);
    expect(rows('SELECT id FROM route')).toEqual([]);
    expect(rows('SELECT key FROM sync_ack')).toEqual([]);
  });
});
