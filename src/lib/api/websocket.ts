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

export interface WebsocketVehicle {
  id: string;
  directionId: string;
  name: string;
  lat: number;
  lon: number;
  heading: number;
  speed: number;
  passengers: number;
  capacity: number;
  amenities: string[] | null;
  seenAt: string;
}

export interface WebsocketDeparture {
  id: string;
  stopId: string;
  directionId: string;
  scheduledAt: string;
  estimatedAt: string | null;
  isCancelled: boolean;
}

export type WebsocketServerMessage =
  | { type: WebsocketMessageType.PONG }
  | { type: WebsocketMessageType.ERROR; message: string }
  | { type: WebsocketMessageType.VEHICLES; routeId: string; vehicles: WebsocketVehicle[] | null }
  | {
      type: WebsocketMessageType.DEPARTURES;
      routeId: string;
      departures: WebsocketDeparture[] | null;
    };
