import { z } from 'zod';

// Announcement
export const AnnouncementSchema = z.object({
  created_at: z.string(),
  end_date: z.string(),
  favorited: z.boolean(),
  id: z.number(),
  id_str: z.string().nullable(),
  isAlert: z.boolean(),
  isRideSystemsMessage: z.boolean(),
  lang: z.string().nullable(),
  retweeted: z.boolean(),
  source: z.string().nullable(),
  text: z.string(),
  truncated: z.boolean(),
});
export type IAnnouncement = z.infer<typeof AnnouncementSchema>;

// Stop
export const StopSchema = z.object({
  AddressID: z.number(),
  City: z.string(),
  Latitude: z.number(),
  Line1: z.string(),
  Line2: z.string(),
  Longitude: z.number(),
  State: z.string(),
  Zip: z.string(),
  Description: z.string(),
  GtfsId: z.string(),
  Heading: z.number(),
  MapPoints: z.array(z.any()), // Replace z.any() with a more specific schema if known
  MaxZoomLevel: z.number(),
  Order: z.number(),
  RouteDescription: z.string(),
  RouteID: z.number(),
  RouteStopID: z.number(),
  SecondsAtStop: z.number(),
  SecondsToNextStop: z.number(),
  ShowDefaultedOnMap: z.boolean(),
  ShowEstimatesOnMap: z.boolean(),
  SignVerbiage: z.string(),
  TextingKey: z.string(),
});
export type IStop = z.infer<typeof StopSchema>;

// Route
export const RouteSchema = z.object({
  Description: z.string(),
  ETATypeID: z.number(),
  EncodedPolyline: z.string(),
  GtfsId: z.string(),
  HideRouteLine: z.boolean(),
  InfoText: z.string(),
  IsCheckLineOnlyOnMap: z.boolean(),
  IsCheckedOnMap: z.boolean(),
  IsRunning: z.boolean(),
  IsVisibleOnMap: z.boolean(),
  Landmarks: z.array(z.any()), // Replace z.any() with a more specific schema if known
  MapLatitude: z.number(),
  MapLineColor: z.string(),
  MapLongitude: z.number(),
  MapZoom: z.number(),
  Order: z.number(),
  RouteID: z.number(),
  RouteVehicleIcon: z.string(),
  ShowPolygon: z.boolean(),
  ShowRouteArrows: z.boolean(),
  StopTimesPDFLink: z.string(),
  Stops: z.array(StopSchema),
  TextingKey: z.string(),
  UseScheduleTripsInPassengerCounter: z.boolean(),
  VehicleMarkerCssClass: z.string(),
});
export type IRoute = z.infer<typeof RouteSchema>;

// Vehicle
export const VehicleSchema = z.object({
  GroundSpeed: z.number(),
  Heading: z.number(),
  IsDelayed: z.boolean(),
  IsOnRoute: z.boolean(),
  Latitude: z.number(),
  Longitude: z.number(),
  Name: z.string(),
  RouteID: z.number(),
  Seconds: z.number(),
  TimeStamp: z.string(),
  VehicleID: z.number(),
});
export type IVehicle = z.infer<typeof VehicleSchema>;

// VehicleCapacity
export const VehicleCapacitySchema = z.object({
  Capacity: z.number(),
  CurrentOccupation: z.number(),
  Percentage: z.number(),
  VehicleID: z.number(),
});
export type IVehicleCapacity = z.infer<typeof VehicleCapacitySchema>;

// TimeEstimate
export const TimeEstimateSchema = z.object({
  EstimateTime: z.string(),
  IsArriving: z.boolean(),
  IsDeparted: z.boolean(),
  OnTimeStatus: z.number(),
  ScheduledArrivalTime: z.string(),
  ScheduledDepartureTime: z.string(),
  ScheduledTime: z.string(),
  Seconds: z.number(),
  Text: z.string().nullable(),
  Time: z.string(),
  VehicleId: z.number(),
});
export type ITimeEstimate = z.infer<typeof TimeEstimateSchema>;

// RouteStop
export const RouteStopSchema = z.object({
  Color: z.string(),
  RouteDescription: z.string(),
  RouteId: z.number(),
  RouteStopId: z.number(),
  ShowDefaultedOnMap: z.boolean(),
  ShowEstimatesOnMap: z.boolean(),
  StopDescription: z.string(),
  StopId: z.number(),
  Times: z.array(TimeEstimateSchema),
});
export type IRouteStop = z.infer<typeof RouteStopSchema>;
