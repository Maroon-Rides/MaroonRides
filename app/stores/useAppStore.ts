import { create } from "zustand";
import { ICachedStopEstimate, IGetNextDepartTimesResponse, IMapRoute, IMapServiceInterruption, IStop } from "../../utils/interfaces";
import { Theme, lightMode } from "../theme";

interface AppState {
    theme: Theme,
    setTheme: (theme: Theme) => void

    // authToken: string | null
    // setAuthToken: (authToken: string) => void;

    // mapServiceInterruption: IMapServiceInterruption[] // TODO: Switch to React Query
    // setMapServiceInterruption: (mapServiceInterruption: IMapServiceInterruption[]) => void

    // routes: IMapRoute[], // TODO: Switch to React Query
    // setRoutes: (routes: IMapRoute[]) => void

    drawnRoutes: IMapRoute[],
    setDrawnRoutes: (routes: IMapRoute[]) => void

    stopEstimates: ICachedStopEstimate[], // TODO: Switch to React Query
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
    
    // TODO: Switch to Provider Functions
    presentSheet: (sheet: "routeDetails" | "alerts" | "stopTimetable" | "settings" | "alertsDetail") => void
    setPresentSheet: (presentSheet: (sheet: "routeDetails" | "alerts" | "stopTimetable" | "settings" | "alertsDetail") => void) => void

    selectedAlert: IMapServiceInterruption | null,
    setSelectedAlert: (selectedAlert: IMapServiceInterruption | null) => void

    selectedTimetableDate: Date | null,
    setSelectedTimetableDate: (selectedTimetableDate: Date | null) => void

    busLocationRefreshInterval: NodeJS.Timeout | null, // TODO: Switch to React Query
    setBusRefreshInterval: (busLocationRefreshInterval: NodeJS.Timeout) => void
    clearBusRefreshInterval: () => void

    // TODO: Switch to Provider Functions
    zoomToStopLatLng: (lat: number, lng: number) => void
    setZoomToStopLatLng: (zoomToStopLatLng: (lat: number, lng: number) => void) => void

    poppedUpStopCallout: IStop | null,
    setPoppedUpStopCallout: (poppedUpStopCallout: IStop | null) => void
}

const useAppStore = create<AppState>()((set) => ({

    theme: lightMode,
    setTheme: (theme) => set(() => ({ theme })),

    // authToken: null,
    // setAuthToken: (authToken) => set(() => ({ authToken })),

    // mapServiceInterruption: [],
    // setMapServiceInterruption: (mapServiceInterruption) => set(() => ({ mapServiceInterruption })),

    // routes: [],
    // setRoutes: (routes) => set(() => ({ routes })),

    drawnRoutes: [],
    setDrawnRoutes: (routes) => set(() => ({ drawnRoutes: routes })),

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
    clearSelectedRoute: () => set(() => ({ selectedRoute: null })),

    selectedRouteDirection: null,
    setSelectedRouteDirection: (selectedRouteDirection) => set(() => ({ selectedRouteDirection: selectedRouteDirection })),

    selectedRouteCategory: 'all',
    setSelectedRouteCategory: (selectedRouteCategory) => set(() => ({ selectedRouteCategory })),

    selectedStop: null,
    setSelectedStop: (selectedStop) => set(() => ({ selectedStop })),

    selectedTimetableDate: null,
    setSelectedTimetableDate: (selectedTimetableDate) => set(() => ({ selectedTimetableDate })),

    presentSheet: (sheet) => {console.log(sheet)},
    setPresentSheet: (presentSheet) => set(() => ({ presentSheet })),

    selectedAlert: null,
    setSelectedAlert: (selectedAlert) => set(() => ({ selectedAlert })),

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