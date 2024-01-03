// TODO: Fix all of the 'any' types once the API has live data

import { z } from "zod";

// From Map API
export const PatternListSchema = z.object({
    key: z.string(),
    isDisplay: z.boolean()
});

export const DirectionSchema = z.object({
    key: z.string(),
    name: z.string()
});

export const DirectionListSchema = z.object({
    direction: DirectionSchema,
    destination: z.string(),
    lineColor: z.string(),
    textColor: z.string(),
    patternList: z.array(PatternListSchema),
    serviceInterruptionKeys: z.array(z.number())
});

export const StopSchema = z.object({
    name: z.string(),
    stopCode: z.string(),
    stopType: z.number()
});

export const PatternPointSchema = z.object({
    key: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    stop: StopSchema.nullable()
});

export const PatternPathSchema = z.object({
    patternKey: z.string(),
    directionKey: z.string(),
    patternPoints: z.array(PatternPointSchema),
    segmentPaths: z.array(z.any())
});

// Appending 'Map' to front of name since timtable has a different RouteSchema
export const MapRouteSchema = z.object({
    key: z.string(),
    name: z.string(),
    shortName: z.string(),
    directionList: z.array(DirectionListSchema),
    patternPaths: z.array(PatternPathSchema),
});

// Appending 'Map' to front of name since timtable has a different ServiceInterruptionSchema
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

export const DepartTimeSchema = z.object({
    estimatedDepartTimeUtc: z.string().nullable(),
    scheduledDepartTimeUtc: z.string().nullable(),
    isOffRoute: z.boolean()
});

export const RouteDirectionTimeSchema = z.object({
    routeKey: z.string(),
    directionKey: z.string(),
    nextDeparts: z.array(DepartTimeSchema),
    frequencyInfo: z.any().nullable()
});

export const BusLocationSchema = z.object({
    lastGpsDate: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    speed: z.number(),
    heading: z.number()
});

export const AmenitySchema = z.object({
    name: z.string(),
    iconName: z.string(),
});

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

export const VehicleByDirection = z.object({
    directionKey: z.string(),
    vehicles: z.array(VehicleSchema)
});

// From Bus Times API
export const TimetableServiceInterruptionSchema = z.object({
    externalServiceInterruptionKey: z.string(),
    serviceInterruptionName: z.string(),
    serviceInterruptionTimeRange: z.string(),
    isStopClosed: z.boolean()
});

export const NearbyStopsSchema = z.object({
    directionKey: z.string(),
    directionName: z.string(),
    distance: z.number(),
    stopCode: z.string(),
    stopName: z.string().nullable(),
    isTemporary: z.boolean(),
    nextStopTimes: z.array(z.object({
        scheduledDepartTimeUtc: z.string().nullable(),
        estimatedDepartTimeUtc: z.string().nullable(),
        isRealtime: z.boolean(),
        isOffRoute: z.boolean()
    })),
    frequencyInfo: z.any().nullable(),
    serviceInterruptions: z.array(TimetableServiceInterruptionSchema),
    amenities: z.array(AmenitySchema)
});

export const TimetableRouteSchema = z.object({
    routeKey: z.string(),
    routeNumber: z.string().nullable(),
    routeName: z.string().nullable(),
    distanceString: z.string().nullable(),
    distance: z.number().nullable(),
    nearbyStops: z.array(NearbyStopsSchema)
});

// /RouteMap/GetBaseData
export const GetBaseDataResponseSchema = z.object({
    routes: z.array(MapRouteSchema),
    serviceInterruptions: z.array(MapServiceInterruptionSchema)
});

// /RouteMap/GetPatternPaths
export const GetPatternPathsResponseSchema = z.array(z.object({
    routeKey: z.string(),
    patternPaths: z.array(PatternPathSchema),
    vehiclesByDirections: z.array(VehicleByDirection).nullable()
}));

// /RouteMap/GetNextDepartTimes
export const GetNextDepartTimesResponseSchema = z.object({
    stopCode: z.string(),
    routeDirectionTimes: z.array(RouteDirectionTimeSchema),
    amenities: z.array(AmenitySchema)
})

// /RouteMap/GetVehicles
export const GetVehiclesResponseSchema = z.array(z.object({
    routeKey: z.string(),
    patternPaths: z.array(PatternPathSchema),
    vehiclesByDirections: z.array(VehicleByDirection).nullable()
}).nullable());

// /Home/GetActiveRoutes
export const GetActiveRoutesResponseSchema = z.array(z.string());

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

// /Home/GetNextStopTimes
export const GetNextStopTimesResponseSchema = z.array(TimetableRouteSchema);
