import { z } from "zod";

// From Map API
export const PatternListSchema = z.object({
    key: z.string(),
    isDisplay: z.boolean()
});
export type IPatternList = z.infer<typeof PatternListSchema>

export const DirectionSchema = z.object({
    key: z.string(),
    name: z.string()
});
export type IDirection = z.infer<typeof DirectionSchema>

export const DirectionListSchema = z.object({
    direction: DirectionSchema,
    destination: z.string(),
    lineColor: z.string(),
    textColor: z.string(),
    patternList: z.array(PatternListSchema),
    serviceInterruptionKeys: z.array(z.number())
});
export type IDirectionList = z.infer<typeof DirectionListSchema>

export const StopSchema = z.object({
    name: z.string(),
    stopCode: z.string(),
    stopType: z.number()
});
export type IStop = z.infer<typeof StopSchema>

export const PatternPointSchema = z.object({
    key: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    stop: StopSchema.nullable()
});
export type IPatternPoint = z.infer<typeof PatternPointSchema>

export const PatternPathSchema = z.object({
    patternKey: z.string(),
    directionKey: z.string(),
    patternPoints: z.array(PatternPointSchema),
    segmentPaths: z.array(z.any())
});
export type IPatternPath = z.infer<typeof PatternPathSchema>

// Appending 'Map' to front of name since timtable has a different RouteSchema
export const MapRouteSchema = z.object({
    key: z.string(),
    name: z.string(),
    shortName: z.string(),
    directionList: z.array(DirectionListSchema),
    patternPaths: z.array(PatternPathSchema),
});
export type IMapRoute = z.infer<typeof MapRouteSchema>

// Appending 'Map' to front of name since timtable has a different ServiceInterruptionSchema
export const MapServiceInterruptionSchema = z.object({
    key: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    timeRangeString: z.string(),
    startDateUtc: z.string(),
    endDateUtc: z.string().nullable(),
    dailyStartTime: z.string(),
    dailyEndTime: z.string()
});
export type IMapServiceInterruption = z.infer<typeof MapServiceInterruptionSchema>

export const DepartTimeSchema = z.object({
    estimatedDepartTimeUtc: z.string().nullable(),
    scheduledDepartTimeUtc: z.string().nullable(),
    isOffRoute: z.boolean()
});
export type IDepartTime = z.infer<typeof DepartTimeSchema>

export const RouteDirectionTimeSchema = z.object({
    routeKey: z.string(),
    directionKey: z.string(),
    nextDeparts: z.array(DepartTimeSchema),
    frequencyInfo: z.any().nullable()
});
export type IRouteDirectionTime = z.infer<typeof RouteDirectionTimeSchema>

export const BusLocationSchema = z.object({
    lastGpsDate: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    speed: z.number(),
    heading: z.number()
});
export type IBusLocation = z.infer<typeof BusLocationSchema>

export const AmenitySchema = z.object({
    name: z.string(),
    iconName: z.string(),
});
export type IAmenity = z.infer<typeof AmenitySchema>

export const VehicleSchema = z.object({
    key: z.string(),
    name: z.string(),
    location: BusLocationSchema,
    directionKey: z.string(),
    directionName: z.string(),
    routeKey: z.string(),
    passengerCapacity: z.number(),
    passengersOnboard: z.number(),
    amenities: z.array(AmenitySchema),
    isExtraTrip: z.boolean()
});
export type IVehicle = z.infer<typeof VehicleSchema>

export const VehicleByDirection = z.object({
    directionKey: z.string(),
    vehicles: z.array(VehicleSchema)
});
export type IVehicleByDirection = z.infer<typeof VehicleByDirection>

// From Bus Times API
export const TimetableServiceInterruptionSchema = z.object({
    externalServiceInterruptionKey: z.string(),
    serviceInterruptionName: z.string(),
    serviceInterruptionTimeRange: z.string(),
    isStopClosed: z.boolean()
});
export type ITimetableServiceInterruption = z.infer<typeof TimetableServiceInterruptionSchema>

export const NextStopTimeSchema = z.object({
    scheduledDepartTimeUtc: z.string().nullable(),
    estimatedDepartTimeUtc: z.string().nullable(),
    isRealtime: z.boolean(),
    isOffRoute: z.boolean()
});
export type INextStopTime = z.infer<typeof NextStopTimeSchema>

export const NearbyStopsSchema = z.object({
    directionKey: z.string(),
    directionName: z.string(),
    distance: z.number(),
    stopCode: z.string(),
    stopName: z.string().nullable(),
    isTemporary: z.boolean(),
    nextStopTimes: z.array(NextStopTimeSchema),
    frequencyInfo: z.any().nullable(),
    serviceInterruptions: z.array(TimetableServiceInterruptionSchema),
    amenities: z.array(AmenitySchema)
});
export type INearbyStops = z.infer<typeof NearbyStopsSchema>

export const TimetableRouteSchema = z.object({
    routeKey: z.string(),
    routeNumber: z.string().nullable(),
    routeName: z.string().nullable(),
    distanceString: z.string().nullable(),
    distance: z.number().nullable(),
    nearbyStops: z.array(NearbyStopsSchema)
});
export type ITimetableRoute = z.infer<typeof TimetableRouteSchema>

export const StopTimeSchema = z.object({
    scheduledDepartTimeUtc: z.string(),
    estimatedDepartTimeUtc: z.string().nullable(),
    isRealtime: z.boolean(),
    tripPointId: z.string(),
    isLastPoint: z.boolean().nullable(),
    isCancelled: z.boolean(),
    isOffRoute: z.boolean()
});
export type IStopTime = z.infer<typeof StopTimeSchema>

export const RouteStopScheduleSchema = z.object({
    routeName: z.string(),
    routeNumber: z.string(),
    directionName: z.string(),
    stopTimes: z.array(StopTimeSchema),
    frequencyInfo: z.any(),
    hasTrips: z.boolean().nullable(),
    hasSchedule: z.boolean().nullable(),
    isEndOfRoute: z.boolean().nullable(),
    isTemporaryStopOnly: z.boolean().nullable(),
    isClosedRegularStop: z.boolean().nullable(),
    serviceInterruptions: z.array(z.any()).nullable()
});
export type IRouteStopSchedule = z.infer<typeof RouteStopScheduleSchema>

// /RouteMap/GetBaseData
export const GetBaseDataResponseSchema = z.object({
    routes: z.array(MapRouteSchema),
    serviceInterruptions: z.array(MapServiceInterruptionSchema)
});
export type IGetBaseDataResponse = z.infer<typeof GetBaseDataResponseSchema>

// /RouteMap/GetPatternPaths
export const GetPatternPathsResponseSchema = z.array(z.object({
    routeKey: z.string(),
    patternPaths: z.array(PatternPathSchema),
    vehiclesByDirections: z.array(VehicleByDirection).nullable()
}));
export type IGetPatternPathsResponse = z.infer<typeof GetPatternPathsResponseSchema>

// /RouteMap/GetNextDepartTimes
export const GetNextDepartTimesResponseSchema = z.object({
    stopCode: z.string(),
    routeDirectionTimes: z.array(RouteDirectionTimeSchema),
    amenities: z.array(AmenitySchema)
});
export type IGetNextDepartTimesResponse = z.infer<typeof GetNextDepartTimesResponseSchema>

// /RouteMap/GetVehicles
export const GetVehiclesResponseSchema = z.array(z.object({
    routeKey: z.string(),
    vehiclesByDirections: z.array(VehicleByDirection).nullable()
}).nullable());
export type IGetVehiclesResponse = z.infer<typeof GetVehiclesResponseSchema>

// /Home/GetActiveRoutes
export const GetActiveRoutesResponseSchema = z.array(z.string());
export type IGetActiveRoutesResponse = z.infer<typeof GetActiveRoutesResponseSchema>

// /Home/GetNearbyRoutes
export const GetNearbyRoutesResponseSchema = z.object({
    longitude: z.number(),
    latitude: z.number(),
    stopCode: z.any().nullable(),
    busStopRouteResults: z.array(z.any().nullable()),
    routeResults: z.array(TimetableRouteSchema),
    nextMinRadius: z.number(),
    nextMaxRadius: z.number(),
    canLoadMore: z.boolean()
});
export type IGetNearbyRoutesResponse = z.infer<typeof GetNearbyRoutesResponseSchema>

// /Home/GetNextStopTimes
export const GetNextStopTimesResponseSchema = z.array(TimetableRouteSchema);
export type IGetNextStopTimesResponse = z.infer<typeof GetNextStopTimesResponseSchema>

// /Schedule/GetStopSchedules
export const GetStopSchedulesResponseSchema = z.object({
    routeStopSchedules: z.array(RouteStopScheduleSchema),
    date: z.string(),
    amenities: z.array(AmenitySchema)
});
export type IGetStopSchedulesResponse = z.infer<typeof GetStopSchedulesResponseSchema>

export const GetStopEstimatesResponseSchema = z.object({
    routeStopSchedules: z.array(RouteStopScheduleSchema),
    date: z.string(),
    amenities: z.array(AmenitySchema)
});
export type IGetStopEstimatesResponse = z.infer<typeof GetStopEstimatesResponseSchema>

export interface ICachedStopEstimate {
    stopCode: string,
    departureTimes: IGetNextDepartTimesResponse
};