import { create } from "zustand";
import { ICachedStopEstimate, IGetNextDepartTimesResponse, IMapRoute, IMapServiceInterruption, IStop } from "../../utils/interfaces";
import { MapStop } from "aggie-spirit-api";

interface AppState {
    authToken: string | null
    setAuthToken: (authToken: string) => void;

    mapServiceInterruption: IMapServiceInterruption[]
    setMapServiceInterruption: (mapServiceInterruption: IMapServiceInterruption[]) => void

    routes: IMapRoute[],
    setRoutes: (routes: IMapRoute[]) => void

    drawnRoutes: IMapRoute[],
    setDrawnRoutes: (routes: IMapRoute[]) => void
    resetDrawnRoutes: () => void,

    stopEstimates: ICachedStopEstimate[],
    setStopEstimates: (stopEstimates: ICachedStopEstimate[]) => void
    updateStopEstimate: (stopEstimate: IGetNextDepartTimesResponse, stopCode: string) => void,
    clearStopEstimates: () => void,

    selectedRoute: IMapRoute | null,
    setSelectedRoute: (selectedRoute: IMapRoute) => void,
    clearSelectedRoute: () => void,

    selectedRouteDirection: string | null,
    setSelectedRouteDirection: (selectedRouteDirection: string | null) => void,

    selectedRouteCategory: "favorites" | "all",
    setSelectedRouteCategory: (selectedRouteCategory: "favorites" | "all") => void

    selectedStop: IStop | null,
    setSelectedStop: (selectedStop: IStop | null) => void,
    
    presentSheet: (sheet: "routeDetails" | "alerts" | "stopTimetable" | "settings" | "alertsDetail") => void
    setPresentSheet: (presentSheet: (sheet: "routeDetails" | "alerts" | "stopTimetable" | "settings" | "alertsDetail") => void) => void

    alertDetail: IMapServiceInterruption | null,
    setAlertDetail: (alertDetail: IMapServiceInterruption | null) => void

    busLocationRefreshInterval: NodeJS.Timeout | null,
    setBusRefreshInterval: (busLocationRefreshInterval: NodeJS.Timeout) => void
    clearBusRefreshInterval: () => void

    zoomToStopLatLng: (lat: number, lng: number) => void
    setZoomToStopLatLng: (zoomToStopLatLng: (lat: number, lng: number) => void) => void

    poppedUpStopCallout: MapStop | null,
    setPoppedUpStopCallout: (poppedUpStopCallout: MapStop | null) => void
}

const useAppStore = create<AppState>()((set) => ({
    authToken: null,
    setAuthToken: (authToken) => set(() => ({ authToken })),

    mapServiceInterruption: [],
    setMapServiceInterruption: (mapServiceInterruption) => set(() => ({ mapServiceInterruption })),

    routes: [],
    setRoutes: (routes) => set(() => ({ routes })),

    drawnRoutes: [],
    setDrawnRoutes: (routes) => set(() => ({ drawnRoutes: routes })),
    resetDrawnRoutes: () => set(state => ({ drawnRoutes: state.routes })),

    stopEstimates: [],
    setStopEstimates: (stopEstimates) => set(() => ({ stopEstimates })),
    updateStopEstimate: (departureTimes, stopCode) => set(state => {
        const newStopDepartureTime: ICachedStopEstimate = {
            stopCode,
            departureTimes
        };

        const newStopDepartureTimes = state.stopEstimates.filter(stopEstimate => stopEstimate.stopCode !== stopCode);
        newStopDepartureTimes.push(newStopDepartureTime);

        return { stopEstimates: newStopDepartureTimes };
    }),
    clearStopEstimates: () => set(() => ({ stopEstimates: [] })),
    
    selectedRoute: null,
    setSelectedRoute: (selectedRoute) => set(() => ({ selectedRoute })),
    clearSelectedRoute: () => set(state => {
        state.resetDrawnRoutes();

        return { selectedRoute: null };
    }),

    selectedRouteDirection: null,
    setSelectedRouteDirection: (selectedRouteDirection) => set(() => ({ selectedRouteDirection: selectedRouteDirection })),

    selectedRouteCategory: 'all',
    setSelectedRouteCategory: (selectedRouteCategory) => set(() => ({ selectedRouteCategory })),

    selectedStop: null,
    setSelectedStop: (selectedStop) => set(() => ({ selectedStop })),

    presentSheet: (sheet) => {console.log(sheet)},
    setPresentSheet: (presentSheet) => set(() => ({ presentSheet })),

    alertDetail: null,
    setAlertDetail: (alertDetail) => set(() => ({ alertDetail })),

    // Timeouts
    busLocationRefreshInterval: null,
    setBusRefreshInterval: (busLocationRefreshInterval) => set(() => ({ busLocationRefreshInterval })),
    clearBusRefreshInterval: () => set(state => {
        if (state.busLocationRefreshInterval) {
            clearInterval(state.busLocationRefreshInterval);
        }

        return { busLocationRefreshInterval: null };
    }),
    
    zoomToStopLatLng: (lat, lng) => {console.log(lat + " " + lng)},
    setZoomToStopLatLng: (zoomToStopLatLng) => set(() => ({ zoomToStopLatLng })),

    poppedUpStopCallout: null,
    setPoppedUpStopCallout: (poppedUpStopCallout) => set(() => ({ poppedUpStopCallout }))
}));

export default useAppStore;