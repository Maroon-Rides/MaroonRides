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