import { z } from 'zod';

// The gateway does not publish these in openapi.json, they mirror apps/gateway/dtos/websocket.go.

export enum WebsocketMessageType {
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  PING = 'ping',
  PONG = 'pong',
  ERROR = 'error',
  VEHICLES = 'vehicles',
  DEPARTURES = 'departures',
}

export type WebsocketClientMessage =
  | { type: WebsocketMessageType.SUBSCRIBE; routeId: string }
  | { type: WebsocketMessageType.UNSUBSCRIBE }
  | { type: WebsocketMessageType.PING };

const websocketVehicleSchema = z.object({
  id: z.string(),
  directionId: z.string(),
  name: z.string(),
  lat: z.number(),
  lon: z.number(),
  heading: z.number(),
  speed: z.number(),
  passengers: z.number(),
  capacity: z.number(),
  amenities: z.array(z.string()).nullable(),
  seenAt: z.string(),
});

const websocketDepartureSchema = z.object({
  id: z.string(),
  stopId: z.string(),
  scheduledAt: z.string(),
  estimatedAt: z.string().nullable(),
  isCancelled: z.boolean(),
});

export const websocketServerMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal(WebsocketMessageType.PONG) }),
  z.object({ type: z.literal(WebsocketMessageType.ERROR), message: z.string() }),
  z.object({
    type: z.literal(WebsocketMessageType.VEHICLES),
    routeId: z.string(),
    vehicles: z.array(websocketVehicleSchema).nullable(),
  }),
  z.object({
    type: z.literal(WebsocketMessageType.DEPARTURES),
    routeId: z.string(),
    departures: z.array(websocketDepartureSchema).nullable(),
  }),
]);

export type WebsocketVehicle = z.infer<typeof websocketVehicleSchema>;
export type WebsocketDeparture = z.infer<typeof websocketDepartureSchema>;
export type WebsocketServerMessage = z.infer<typeof websocketServerMessageSchema>;
