import { create } from "zustand";
import { MapRoute, MapServiceInterruption, MapStop, NextDepartureTimesResponse, Vehicle } from "aggie-spirit-api";
import { CachedStopEstimate as CachedStopDepartureTimes } from "types/app";
import { IRouteDirectionTime } from "utils/interfaces";

interface AppState {
    authToken: string | null
    setAuthToken: (authToken: string) => void;

    mapServiceInterruption: MapServiceInterruption[]
    setMapServiceInterruption: (mapServiceInterruption: MapServiceInterruption[]) => void

    routes: MapRoute[],
    setRoutes: (routes: MapRoute[]) => void

    drawnRoutes: MapRoute[],
    setDrawnRoutes: (routes: MapRoute[]) => void
    resetDrawnRoutes: () => void,

    favoriteRoutes: MapRoute[],
    setFavoriteRoutes: (favoriteRoutes: MapRoute[]) => void,

    stopEstimates: CachedStopDepartureTimes[],
    updateStopEstimate: (stopEstimate: NextDepartureTimesResponse, stopCode: string) => void,
    clearStopEstimates: () => void,

    selectedRoute: MapRoute | null,
    setSelectedRoute: (selectedRoute: MapRoute) => void,
    clearSelectedRoute: () => void,

    selectedStop: MapStop | null,
    setSelectedStop: (selectedStop: MapStop | null) => void,

    selectedDirection: string | null,
    setSelectedDirection: (selectedDirection: string | null) => void,

    drawnBuses: Vehicle[],
    setDrawnBuses: (buses: Vehicle[]) => void,
    
    presentSheet: (sheet: "routeDetails" | "alerts" | "stopTimetable") => void
    setPresentSheet: (presentSheet: (sheet: "routeDetails" | "alerts" | "stopTimetable") => void) => void

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

    favoriteRoutes: [],
    setFavoriteRoutes: (favoriteRoutes) => set(() => ({ favoriteRoutes })),

    stopEstimates: [],
    updateStopEstimate: (departureTimes, stopCode) => set(state => {
        const newStopDepartureTime: CachedStopDepartureTimes = {
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

    selectedStop: null,
    setSelectedStop: (selectedStop) => set(() => ({ selectedStop })),
    
    selectedDirection: null,
    setSelectedDirection: (selectedDirection) => set(() => ({ selectedDirection })),

    drawnBuses: [],
    setDrawnBuses: (buses) => set(() => ({ drawnBuses: buses })),

    presentSheet: (sheet) => {console.log(sheet)},
    setPresentSheet: (presentSheet) => set(() => ({ presentSheet })),

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