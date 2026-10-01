import { relations } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const route = sqliteTable('route', {
  id: text('id').primaryKey(),
  shortName: text('short_name').notNull(),
  longName: text('long_name').notNull(),
  lightColor: text('light_color').notNull(),
  darkColor: text('dark_color').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull(),
});

export const direction = sqliteTable(
  'direction',
  {
    id: text('id').primaryKey(),
    routeId: text('route_id').notNull(),
    destination: text('destination').notNull(),
    sequence: integer('sequence').notNull(),
    path: text('path').notNull(),
  },
  (t) => [index('direction_route_id_idx').on(t.routeId)],
);

export const stop = sqliteTable('stop', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  lat: real('lat').notNull(),
  lon: real('lon').notNull(),
  amenities: text('amenities', { mode: 'json' }).$type<string[]>().notNull(),
});

export const directionStop = sqliteTable(
  'direction_stop',
  {
    id: text('id').primaryKey(),
    directionId: text('direction_id').notNull(),
    stopId: text('stop_id').notNull(),
    sequence: integer('sequence').notNull(),
    isTimepoint: integer('is_timepoint', { mode: 'boolean' }).notNull(),
  },
  (t) => [index('direction_stop_direction_id_idx').on(t.directionId, t.sequence)],
);

export const alert = sqliteTable('alert', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  timeRangeText: text('time_range_text').notNull(),
  dailyStartTime: text('daily_start_time').notNull(),
  dailyEndTime: text('daily_end_time').notNull(),
  startsAt: text('starts_at').notNull(),
  endsAt: text('ends_at'),
});

export const alertDirection = sqliteTable(
  'alert_direction',
  {
    id: text('id').primaryKey(),
    alertId: text('alert_id').notNull(),
    directionId: text('direction_id').notNull(),
  },
  (t) => [index('alert_direction_direction_id_idx').on(t.directionId)],
);

export const timetable = sqliteTable(
  'timetable',
  {
    id: text('id').primaryKey(),
    stopId: text('stop_id').notNull(),
    directionId: text('direction_id').notNull(),
    serviceDate: text('service_date').notNull(),
    departures: text('departures', { mode: 'json' }).$type<string[]>().notNull(),
  },
  (t) => [index('timetable_slot_idx').on(t.stopId, t.directionId, t.serviceDate)],
);

/** The newest ack per entity key, e.g. `RouteV1` or `TimetableV1:<routeId>`. */
export const syncAck = sqliteTable('sync_ack', {
  key: text('key').primaryKey(),
  ack: text('ack').notNull(),
});

export const routeRelations = relations(route, ({ many }) => ({
  directions: many(direction),
}));

export const directionRelations = relations(direction, ({ one, many }) => ({
  route: one(route, { fields: [direction.routeId], references: [route.id] }),
  directionStops: many(directionStop),
  alertDirections: many(alertDirection),
}));

export const directionStopRelations = relations(directionStop, ({ one }) => ({
  direction: one(direction, { fields: [directionStop.directionId], references: [direction.id] }),
  stop: one(stop, { fields: [directionStop.stopId], references: [stop.id] }),
}));

export const alertRelations = relations(alert, ({ many }) => ({
  alertDirections: many(alertDirection),
}));

export const alertDirectionRelations = relations(alertDirection, ({ one }) => ({
  alert: one(alert, { fields: [alertDirection.alertId], references: [alert.id] }),
  direction: one(direction, { fields: [alertDirection.directionId], references: [direction.id] }),
}));

/** Tables filled by the sync stream. A reset wipes all of them along with their acks. */
export const SYNCED_TABLES = [
  route,
  direction,
  stop,
  directionStop,
  alert,
  alertDirection,
  timetable,
] as const;
