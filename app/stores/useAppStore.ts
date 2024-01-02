import { create } from "zustand";

import { IMapServiceInterruption, IMapRoute } from "utils/updatedInterfaces";

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

    selectedRoute: IMapRoute | null,
    setSelectedRoute: (selectedRoute: IMapRoute) => void,
    clearSelectedRoute: () => void,
     
    selectedRouteCategory: "On Campus" | "Off Campus"
    setSelectedRouteCategory: (routeCategory: "On Campus" | "Off Campus") => void

    isGameday: boolean
    setIsGameday: (isGameday: boolean) => void

    presentSheet: (sheet: "routeDetails" | "alerts") => void
    setPresentSheet: (presentSheet: (sheet: "routeDetails" | "alerts") => void) => void
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
    resetDrawnRoutes: () => set(state => {
        if(state.selectedRouteCategory === "Off Campus") {
            return {
                drawnRoutes: state.routes.filter(route => route.category === "Off Campus")
            }
        }

        return {
            drawnRoutes: state.routes.filter(route => route.category === "On Campus")
        }
    }),

    selectedRouteCategory: "On Campus",
    setSelectedRouteCategory: (routeCategory) => set(() => ({ selectedRouteCategory: routeCategory })),

    selectedRoute: null,
    setSelectedRoute: (selectedRoute) => set(() => ({ selectedRoute })),
    clearSelectedRoute: () => set(state => {
        if(state.selectedRouteCategory === "Off Campus") {
            state.setDrawnRoutes(state.routes.filter(route => route.category === "Off Campus"));
        } else {
            state.setDrawnRoutes(state.routes.filter(route => route.category === "On Campus"));
        }

        return { selectedRoute: null };
    }),

    isGameday: false,
    setIsGameday: (isGameday) => set(() => ({ isGameday })),

    presentSheet: (sheet) => {console.log(sheet)},
    setPresentSheet: (presentSheet) => set(() => ({ presentSheet }))
}));

export default useAppStore;