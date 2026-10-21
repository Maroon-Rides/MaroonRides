import { z } from 'zod';

const line = <T extends string, D extends z.ZodType>(type: T, data: D) =>
  z.object({ type: z.literal(type), ack: z.string(), data });

const nullableStrings = z.array(z.string()).nullable();

export const syncStreamLineSchema = z.discriminatedUnion('type', [
  line(
    'RouteV1',
    z.object({
      id: z.string(),
      shortName: z.string(),
      longName: z.string(),
      lightColor: z.string(),
      darkColor: z.string(),
      active: z.boolean(),
    }),
  ),
  line('RouteDeleteV1', z.object({ routeId: z.string() })),
  line(
    'DirectionV1',
    z.object({
      id: z.string(),
      routeId: z.string(),
      destination: z.string(),
      path: z.string(),
      sequence: z.number(),
    }),
  ),
  line('DirectionDeleteV1', z.object({ directionId: z.string() })),
  line(
    'StopV1',
    z.object({
      id: z.string(),
      directionId: z.string(),
      name: z.string(),
      lat: z.number(),
      lon: z.number(),
      sequence: z.number(),
      isTimepoint: z.boolean(),
      amenities: nullableStrings,
    }),
  ),
  line('StopDeleteV1', z.object({ stopId: z.string() })),
  line(
    'AlertV1',
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      timeRangeText: z.string(),
      startsAt: z.string(),
      endsAt: z.string().nullable(),
      dailyStartTime: z.string(),
      dailyEndTime: z.string(),
    }),
  ),
  line('AlertDeleteV1', z.object({ alertId: z.string() })),
  line(
    'AlertDirectionV1',
    z.object({ id: z.string(), alertId: z.string(), directionId: z.string() }),
  ),
  line('AlertDirectionDeleteV1', z.object({ alertDirectionId: z.string() })),
  line(
    'TimetableV1',
    z.object({
      id: z.string(),
      stopId: z.string(),
      serviceDate: z.string(),
      departures: nullableStrings,
    }),
  ),
  line('TimetableDeleteV1', z.object({ timetableId: z.string() })),
  line('SyncResetV1', z.unknown()),
  line('SyncCompleteV1', z.unknown()),
]);
