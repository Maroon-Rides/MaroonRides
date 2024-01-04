import { create } from "zustand";
import { ICachedStopEstimate, IGetNextDepartTimesResponse, IMapRoute, IMapServiceInterruption, IStop } from "../../utils/interfaces";

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

    favoriteRoutes: IMapRoute[],
    setFavoriteRoutes: (favoriteRoutes: IMapRoute[]) => void,

    stopEstimates: ICachedStopEstimate[],
    updateStopEstimate: (stopEstimate: IGetNextDepartTimesResponse, stopCode: string) => void,
    clearStopEstimates: () => void,

    selectedRoute: IMapRoute | null,
    setSelectedRoute: (selectedRoute: IMapRoute) => void,
    clearSelectedRoute: () => void,

    selectedRouteCategory: "favorites" | "all",
    setSelectedRouteCategory: (selectedRouteCategory: "favorites" | "all") => void

    selectedStop: IStop | null,
    setSelectedStop: (selectedStop: IStop | null) => void,
    
    presentSheet: (sheet: "routeDetails" | "alerts" | "stopTimetable") => void
    setPresentSheet: (presentSheet: (sheet: "routeDetails" | "alerts" | "stopTimetable") => void) => void

    busLocationRefreshInterval: NodeJS.Timeout | null,
    setBusRefreshInterval: (busLocationRefreshInterval: NodeJS.Timeout) => void
    clearBusRefreshInterval: () => void
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

    selectedRouteCategory: 'all',
    setSelectedRouteCategory: (selectedRouteCategory) => set(() => ({ selectedRouteCategory })),

    selectedStop: null,
    setSelectedStop: (selectedStop) => set(() => ({ selectedStop })),

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
    })
}));

export default useAppStore;