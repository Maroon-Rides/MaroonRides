export interface IBusRoute {
    id: string;
    name: string;
    color: string;
    onCampus: boolean;
    shortName: string; // Text to show in colored icons
    key: string;
    description?: string;
    category: "On Campus" | "Off Campus" | "Gameday";
    endpointName: string;
    routeInfo: {
        routeKey: string;
        color: string;
        patternPaths: {
            patternKey: string;
            patternPoints: IPatternPoint[];
        }[];
    };
    routePatterns: IRoutePattern[];
}

export interface IPatternPoint {
    key: string;
    name: string;
    description?: string;
    rank: number;
    longitude: number;
    latitude: number;
    isStop: boolean;
    isTimePoint: boolean;
    routeHeaderRank: number;
    distanceToPreviousPoint: number;
    stop: {
        key: string;
        name: string;
        stopCode: number;
        isTemporary: boolean;
        attributes: any[];
    };
}

export interface IRoutePattern {
    key: string;
    name: string;
    shortName: number;
    description?: string;
    direction: {
        key: string;
        name: string;
    };
    destination: string;
    lineDisplayInfo: IDisplayInfo;
    timePointDisplayInfo: IDisplayInfo;
    busStopDisplayInfo: IBusStopDisplayInfo;
}

export interface IDisplayInfo {
    color: string;
    type: number;
    symbol: number;
    size: number;
}

export interface IBusStopDisplayInfo {
    color: string
    type: number;
    symbol: number;
    size: number;
    isDisplay: boolean;
}

export type ITimestamp = string;

export type ILocationData = Record<string, ITimestamp[]>;

export type ITimetable = ILocationData[];

export interface IAmmentity {
    key: string;
    name: "Air Conditioning" | "wheelchair-accessibility";
    description: string;
    iconName: string;
    iconCode: string;
    iconType: string;
}

export interface IBus {
    key: string;
    name: "Millennium" | "Gillig" | "Proterra" | "Proterra" | "El Dorado";
    vehicleType: string;
    location: {
        latitude: number;
        longitude: number;
        speed: number;
        heading: number;
        lastGpsDate: string;
    };
    passengerLoad: number;
    passengerCapacity: number;
    routeKey: string;
    patternKey: string | null;
    tripKey: string | null;
    nextStopDeparture: {
        stopKey: string | null;
        stopCode: string;
        tripPointKey: string | null;
        patternPointKey: string | null;
        scheduledDeparture: string | null;
        estimatedDeparture: string | null;
        hasDeparted: boolean;
        stopName: string;
    },
    attributes: [],
    amenities: IAmmentity[];
    routeName: string;
    routeShortName: string;
    patternName: string;
    patternDestination: string;
    patternColor: string;
    directionName: string;
    isTripper: boolean;
    workItemKey: string;
    routeStatus: string;
    opStatus: {
        status: string;
        color: string;
    }
}