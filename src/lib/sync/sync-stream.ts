import type { SyncEntityType, SyncRequestType, SyncStreamLine } from '$lib/api/client';
import { db } from '$lib/db/database';
import {
  alert,
  alertDirection,
  direction,
  route,
  stop,
  SYNCED_TABLES,
  syncAck,
  timetable,
} from '$lib/db/schema';
import { getTableColumns, inArray, sql } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable, SQLiteUpdateSetSource } from 'drizzle-orm/sqlite-core';
import { chunk } from 'lodash-es';

export const SYNC_PROTOCOL_V1 = 1;

export const SYNC_REQUEST_TYPES: SyncRequestType[] = [
  'RoutesV1',
  'DirectionsV1',
  'StopsV1',
  'AlertsV1',
  'AlertDirectionsV1',
  'TimetablesV1',
];

const ACK_SEPARATOR = '|';
const RESET: SyncEntityType = 'SyncResetV1';

// Keeps each insert under SQLite's bound parameter limit on older builds.
const MAX_ROWS_PER_STATEMENT = 100;

type LineData<T extends SyncEntityType> = Extract<SyncStreamLine, { type: T }>['data'];
type TableWithId = SQLiteTable & { id: SQLiteColumn };

/** A built drizzle write. Awaiting it runs it. */
export type Statement = PromiseLike<unknown> & { toSQL(): { sql: string; params: unknown[] } };

type EntityHandler<D> = (rows: D[]) => Statement[];

function excluded<T extends SQLiteTable>(table: T): SQLiteUpdateSetSource<T> {
  return Object.fromEntries(
    Object.entries(getTableColumns(table)).map(([key, column]) => [
      key,
      sql.raw(`excluded."${column.name}"`),
    ]),
  ) as SQLiteUpdateSetSource<T>;
}

function upsert<T extends TableWithId, D>(
  table: T,
  toRow: (data: D) => T['$inferInsert'],
): EntityHandler<D> {
  return (rows) =>
    chunk(rows, MAX_ROWS_PER_STATEMENT).map((batch) =>
      db
        .insert(table)
        .values(batch.map(toRow))
        .onConflictDoUpdate({ target: table.id, set: excluded(table) }),
    );
}

function remove<T extends TableWithId, D>(table: T, toId: (data: D) => string): EntityHandler<D> {
  return (rows) =>
    chunk(rows, MAX_ROWS_PER_STATEMENT).map((batch) =>
      db.delete(table).where(inArray(table.id, batch.map(toId))),
    );
}

const controlLine: EntityHandler<unknown> = () => [];

// Go encodes an empty slice as null, the local columns are not nullable.
const HANDLERS: { [T in SyncEntityType]: EntityHandler<LineData<T>> } = {
  RouteV1: upsert(route, (data: LineData<'RouteV1'>) => data),
  RouteDeleteV1: remove(route, (data: LineData<'RouteDeleteV1'>) => data.routeId),
  DirectionV1: upsert(direction, (data: LineData<'DirectionV1'>) => data),
  DirectionDeleteV1: remove(direction, (data: LineData<'DirectionDeleteV1'>) => data.directionId),
  StopV1: upsert(stop, (data: LineData<'StopV1'>) => ({
    ...data,
    amenities: data.amenities ?? [],
  })),
  StopDeleteV1: remove(stop, (data: LineData<'StopDeleteV1'>) => data.stopId),
  AlertV1: upsert(alert, (data: LineData<'AlertV1'>) => data),
  AlertDeleteV1: remove(alert, (data: LineData<'AlertDeleteV1'>) => data.alertId),
  AlertDirectionV1: upsert(alertDirection, (data: LineData<'AlertDirectionV1'>) => data),
  AlertDirectionDeleteV1: remove(
    alertDirection,
    (data: LineData<'AlertDirectionDeleteV1'>) => data.alertDirectionId,
  ),
  TimetableV1: upsert(timetable, (data: LineData<'TimetableV1'>) => ({
    ...data,
    departures: data.departures ?? [],
  })),
  TimetableDeleteV1: remove(timetable, (data: LineData<'TimetableDeleteV1'>) => data.timetableId),
  SyncResetV1: controlLine,
  SyncCompleteV1: controlLine,
};

export interface SyncPlan {
  reset: boolean;
  statements: Statement[];
}

export function resetPlan(): SyncPlan {
  const tables = [...SYNCED_TABLES, syncAck];
  return { reset: true, statements: tables.map((table) => db.delete(table)) };
}

// The server orders lines so parents come before children and deletes before upserts,
// so runs of one entity type are applied in the order they arrived.
export function planSync(lines: SyncStreamLine[]): SyncPlan {
  if (lines[0]?.type === RESET) return resetPlan();

  const runs: { type: SyncEntityType; rows: unknown[] }[] = [];
  const acks = new Map<string, string>();

  for (const line of lines) {
    const run = runs.at(-1);
    if (run?.type === line.type) {
      run.rows.push(line.data);
    } else {
      runs.push({ type: line.type, rows: [line.data] });
    }
    acks.set(line.ack.split(ACK_SEPARATOR)[0], line.ack);
  }

  const statements = runs.flatMap((run) => HANDLERS[run.type](run.rows as never[]));
  if (acks.size > 0) {
    statements.push(
      db
        .insert(syncAck)
        .values([...acks].map(([key, ack]) => ({ key, ack })))
        .onConflictDoUpdate({ target: syncAck.key, set: excluded(syncAck) }),
    );
  }

  return { reset: false, statements };
}
