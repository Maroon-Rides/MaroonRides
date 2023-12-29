// TODO: Fix all of the 'any' types once the API has live data

import { z } from "zod";

// From Map API
export const IMapPatternList = z.object({
    key: z.string(),
    isDisplay: z.boolean()
});

export const IMapDirection = z.object({
    key: z.string(),
    name: z.string()
});

export const IMapDirectionList = z.object({
    direction: IMapDirection,
    desination: z.string(),
    lineColor: z.string(),
    textColor: z.string(),
    patternList: IMapPatternList,
    serviceInterruptionKeys: z.array(z.number())
});

export const IMapRoute = z.object({
    key: z.string(),
    name: z.string(),
    shortName: z.string(),
    directionList: z.array(IMapDirectionList)
});

export const IMapServiceInterruption = z.object({
    key: z.string(),
    name: z.string(),
    description: z.string(),
    timeRangeString: z.string(),
    startDateUtc: z.string(),
    endDateUtc: z.string(),
    dailyStartTime: z.string(),
    dailyEndTime: z.string()
});

export const IMapStop = z.object({
    name: z.string(),
    stopCode: z.string(),
    stopType: z.number()
});

export const IMapPatternPoint = z.object({
    key: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    stop: IMapStop.nullable()
});

export const IMapPatternPath = z.object({
    patternKey: z.string(),
    directionKey: z.string(),
    patternPoints: z.array(IMapPatternPoint),
    segmentPaths: z.array(z.any())
});

// From Bus Times API
export const ITimetableServiceInterruption = z.object({
    externalServiceInterruptionKey: z.string(),
    serviceInterruptionName: z.string(),
    serviceInterruptionTimeRange: z.string(),
    isStopClosed: z.boolean()
});

export const ITimetableNearbyStops = z.object({
    directionKey: z.string(),
    directionName: z.string(),
    distance: z.number(),
    stopCode: z.string(),
    stopName: z.string(),
    isTemporary: z.boolean(),
    nextStopTimes: z.array(z.any()),
    frequencyInfo: z.any(),
    serviceInterruptions: z.array(ITimetableServiceInterruption),
    amenities: z.array(z.any())
});

export const ITimetableRoute = z.object({
    routeKey: z.string(),
    routeNumber: z.string(),
    routeName: z.string(),
    distanceString: z.string(),
    distance: z.number(),
    nearbyStops: z.array(ITimetableNearbyStops)
});

export const ITimetableAmenity = z.object({
    name: z.string(),
    iconName: z.string(),
})

// /RouteMap/GetBaseData
export const IGetBaseDataResponse = z.object({
    routes: z.array(IMapRoute),
    serviceInterruptions: z.array(IMapServiceInterruption)
});

// /RouteMap/GetPatternPaths
export const IGetPatternPathsResponse = z.array(z.object({
    routeKey: z.string(),
    pattenPaths: z.array(IMapPatternPath),
    vehiclesByDirections: z.null()
}));

// /Home/GetActiveRoutes
export const IGetActiveRoutesResponse = z.array(z.string());

// /Home/GetNearbyRoutes
export const IGetNearbyRoutesResponse = z.object({
    longitude: z.number(),
    latutude: z.number(),
    stopCode: z.any(),
    busStopRouteResults: z.array(z.any()),
    routeResults: z.array(ITimetableRoute),
    nextMinRadius: z.number(),
    nextMaxRadius: z.number(),
    canLoadMore: z.boolean()
});

// /Home/GetNextStopTimes
export const IGetNextStopTimesResponse = z.array(ITimetableRoute);