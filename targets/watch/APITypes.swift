//
//  APITypes.swift
//  Reveille Rides Watch App
//
//  Created by Brandon Wees on 1/31/24.
//

import Foundation

// From Map API
struct PatternList: Codable {
    let key: String
    let isDisplay: Bool
}

struct Direction: Codable {
    let key: String
    let name: String
}

struct DirectionList: Codable {
    let direction: Direction
    let destination: String
    let lineColor: String
    let textColor: String
    let patternList: [PatternList]
    let serviceInterruptionKeys: [Int]
}

struct Stop: Codable {
    let name: String
    let stopCode: String
    let stopType: Int
}

struct PatternPoint: Codable {
    let key: String
    let latitude: Double
    let longitude: Double
    let stop: Stop?
}

struct PatternPath: Codable {
    let patternKey: String
    let directionKey: String
    let patternPoints: [PatternPoint]
    let segmentPaths: [String] // Always blank... leaving as Any for now
}

struct MapRoute: Codable {
    let key: String
    let name: String
    let shortName: String
    let directionList: [DirectionList]
}

struct MapServiceInterruption: Codable {
    let key: String
    let name: String
    let description: String
    let timeRangeString: String
    let startDateUtc: String
    let endDateUtc: String?
    let dailyStartTime: String
    let dailyEndTime: String
}

struct DepartTime: Codable, Hashable {
    let estimatedDepartTimeUtc: String?
    let scheduledDepartTimeUtc: String?
    let isOffRoute: Bool
}

struct RouteDirectionTime: Codable {
    let routeKey: String
    let directionKey: String
    let nextDeparts: [DepartTime]
    let frequencyInfo: String? // Always blank... leaving as Any for now
}

struct BusLocation: Codable {
    let lastGpsDate: String
    let latitude: Double
    let longitude: Double
    let speed: Double
    let heading: Double
}

struct Amenity: Codable {
    let name: String
    let iconName: String
}

struct Vehicle: Codable {
    let key: String
    let name: String
    let location: BusLocation
    let directionKey: String
    let directionName: String
    let routeKey: String
    let passengerCapacity: Int
    let passengersOnboard: Int
    let amenities: [Amenity]
    let isExtraTrip: Bool
}

struct VehicleByDirection: Codable {
    let directionKey: String
    let vehicles: [Vehicle]
}

// From Bus Times API
struct TimetableServiceInterruption: Codable {
    let externalServiceInterruptionKey: String
    let serviceInterruptionName: String
    let serviceInterruptionTimeRange: String
    let isStopClosed: Bool
}

struct NextStopTime: Codable {
    let scheduledDepartTimeUtc: String?
    let estimatedDepartTimeUtc: String?
    let isRealtime: Bool
    let isOffRoute: Bool
}

struct NearbyStops: Codable {
    let directionKey: String
    let directionName: String
    let distance: Double
    let stopCode: String
    let stopName: String?
    let isTemporary: Bool
    let nextStopTimes: [NextStopTime]
    let frequencyInfo: String? // Always blank... leaving as Any for now
    let serviceInterruptions: [TimetableServiceInterruption]
    let amenities: [Amenity]
}

struct TimetableRoute: Codable {
    let routeKey: String
    let routeNumber: String?
    let routeName: String?
    let distanceString: String?
    let distance: Double?
    let nearbyStops: [NearbyStops]
}

struct StopTime: Codable {
    let scheduledDepartTimeUtc: String
    let estimatedDepartTimeUtc: String?
    let isRealtime: Bool
    let tripPointId: String
    let isLastPoint: Bool?
    let isCancelled: Bool
    let isOffRoute: Bool
}

struct RouteStopSchedule: Codable {
    let routeName: String
    let routeNumber: String
    let directionName: String
    let stopTimes: [StopTime]
    let frequencyInfo: String?
    let hasTrips: Bool
    let hasSchedule: Bool
    let isEndOfRoute: Bool
    let isTemporaryStopOnly: Bool
    let isClosedRegularStop: Bool
    let serviceInterruptions: [StopScheduleInterruption] // Determine datatype as needed
}

struct StopScheduleInterruption: Codable {
  let externalServiceInterruptionKey: String
  let serviceInterruptionName: String
  let serviceInterruptionTimeRange: String
}

// /RouteMap/GetBaseData
struct GetBaseDataResponse: Codable {
    let routes: [MapRoute]
    let serviceInterruptions: [MapServiceInterruption]
}

// /RouteMap/GetPatternPaths
struct GetPatternPathsResponse: Codable {
    let routeKey: String
    let patternPaths: [PatternPath]
    let vehiclesByDirections: [VehicleByDirection]?
}

// /RouteMap/GetNextDepartTimes
struct GetNextDepartTimesResponse: Codable {
    let stopCode: String
    let routeDirectionTimes: [RouteDirectionTime]
    let amenities: [Amenity]
}

// /RouteMap/GetVehicles
struct GetVehiclesResponse: Codable {
    let routeKey: String
    let vehiclesByDirections: [VehicleByDirection]?
}

// /Home/GetNearbyRoutes
struct GetNearbyRoutesResponse: Codable {
    let longitude: Double
    let latitude: Double
    let stopCode: String? // Always blank... leaving as Any for now
    let busStopRouteResults: [String]? // Always blank... leaving as [Any] for now
    let routeResults: [TimetableRoute]
    let nextMinRadius: Double
    let nextMaxRadius: Double
    let canLoadMore: Bool
}

// /Home/GetStopSchedules
struct GetStopSchedulesResponse: Codable {
    let routeStopSchedules: [RouteStopSchedule]
    let date: String
    let amenities: [Amenity]
}

struct GetStopEstimatesResponse: Codable {
    let routeStopSchedules: [RouteStopSchedule]
    let date: String
    let amenities: [Amenity]
}
