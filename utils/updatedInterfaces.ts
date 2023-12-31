// TODO: Fix all of the 'any' types once the API has live data

import { z } from "zod";

// From Map API
export const MapPatternListSchema = z.object({
    key: z.string(),
    isDisplay: z.boolean()
});
export type IMapPatternList = z.infer<typeof MapPatternListSchema>

export const MapDirectionSchema = z.object({
    key: z.string(),
    name: z.string()
});
export type IMapDirection = z.infer<typeof MapDirectionSchema>

export const MapDirectionListSchema = z.object({
    direction: MapDirectionSchema,
    destination: z.string(),
    lineColor: z.string(),
    textColor: z.string(),
    patternList: z.array(MapPatternListSchema),
    serviceInterruptionKeys: z.array(z.number())
});
export type IMapDirectionList = z.infer<typeof MapDirectionListSchema>

export const MapStopSchema = z.object({
    name: z.string(),
    stopCode: z.string(),
    stopType: z.number()
});
export type IMapStop = z.infer<typeof MapStopSchema>

export const MapPatternPointSchema = z.object({
    key: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    stop: MapStopSchema.nullable()
});
export type IMapPatternPoint = z.infer<typeof MapPatternPointSchema>

export const MapPatternPathSchema = z.object({
    patternKey: z.string(),
    directionKey: z.string(),
    patternPoints: z.array(MapPatternPointSchema),
    segmentPaths: z.array(z.any())
});
export type IMapPatternPath = z.infer<typeof MapPatternPathSchema>

export const MapRouteSchema = z.object({
    key: z.string(),
    name: z.string(),
    shortName: z.string(),
    directionList: z.array(MapDirectionListSchema),
    patternPaths: z.array(MapPatternPathSchema),
    category: z.union([z.literal('On Campus'), z.literal('Off Campus')])
});
export type IMapRoute = z.infer<typeof MapRouteSchema>

export const MapServiceInterruptionSchema = z.object({
    key: z.string(),
    name: z.string(),
    description: z.string(),
    timeRangeString: z.string(),
    startDateUtc: z.string(),
    endDateUtc: z.string(),
    dailyStartTime: z.string(),
    dailyEndTime: z.string()
});
export type IMapServiceInterruption = z.infer<typeof MapServiceInterruptionSchema>

// From Bus Times API
export const TimetableServiceInterruptionSchema = z.object({
    externalServiceInterruptionKey: z.string(),
    serviceInterruptionName: z.string(),
    serviceInterruptionTimeRange: z.string(),
    isStopClosed: z.boolean()
});
export type ITimetableServiceInterruption = z.infer<typeof TimetableServiceInterruptionSchema>

export const TimetableNearbyStopsSchema = z.object({
    directionKey: z.string(),
    directionName: z.string(),
    distance: z.number(),
    stopCode: z.string(),
    stopName: z.string(),
    isTemporary: z.boolean(),
    nextStopTimes: z.array(z.any()),
    frequencyInfo: z.any(),
    serviceInterruptions: z.array(TimetableServiceInterruptionSchema),
    amenities: z.array(z.any())
});
export type ITimetableNearbyStops = z.infer<typeof TimetableNearbyStopsSchema>

export const TimetableRouteSchema = z.object({
    routeKey: z.string(),
    routeNumber: z.string(),
    routeName: z.string(),
    distanceString: z.string(),
    distance: z.number(),
    nearbyStops: z.array(TimetableNearbyStopsSchema)
});
export type ITimetableRoute = z.infer<typeof TimetableRouteSchema>

export const TimetableAmenitySchema = z.object({
    name: z.string(),
    iconName: z.string(),
});
export type ITimtableAmenity = z.infer<typeof TimetableAmenitySchema>

// /RouteMap/GetBaseData
export const GetBaseDataResponseSchema = z.object({
    routes: z.array(MapRouteSchema),
    serviceInterruptions: z.array(MapServiceInterruptionSchema)
});
export type IGetBaseDataResponse = z.infer<typeof GetBaseDataResponseSchema>

// /RouteMap/GetPatternPaths
export const GetPatternPathsResponseSchema = z.array(z.object({
    routeKey: z.string(),
    patternPaths: z.array(MapPatternPathSchema),
    vehiclesByDirections: z.null()
}));
export type IGetPatternPathsResponse = z.infer<typeof GetPatternPathsResponseSchema>

// /Home/GetActiveRoutes
export const GetActiveRoutesResponseSchema = z.array(z.string());
export type IGetActiveRoutesResponse = z.infer<typeof GetActiveRoutesResponseSchema>

// /Home/GetNearbyRoutes
export const GetNearbyRoutesResponseSchema = z.object({
    longitude: z.number(),
    latutude: z.number(),
    stopCode: z.any(),
    busStopRouteResults: z.array(z.any()),
    routeResults: z.array(TimetableRouteSchema),
    nextMinRadius: z.number(),
    nextMaxRadius: z.number(),
    canLoadMore: z.boolean()
});
export type IGetNearbyRoutesResponseSchema = z.infer<typeof GetNearbyRoutesResponseSchema>

// /Home/GetNextStopTimes
export const GetNextStopTimesResponseSchema = z.array(TimetableRouteSchema);
export type IGetNextStopTimesResponseSchema = z.infer<typeof GetNextStopTimesResponseSchema>