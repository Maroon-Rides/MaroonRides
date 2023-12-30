import { create } from "zustand";

import { IBusRoute } from "utils/interfaces";
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
    
    busRoutes: IBusRoute[]
    setBusRoutes: (busRoutes: IBusRoute[]) => void

    selectedRouteCategory: "On Campus" | "Off Campus"
    setSelectedRouteCategory: (routeCategory: "On Campus" | "Off Campus") => void

    selectedRoute: IBusRoute | null
    setSelectedRoute: (selectedRoute: IBusRoute | null) => void

    selectedGroup: IBusRoute[] | null,
    setSelectedGroup: (selectedGroup: IBusRoute[] | null) => void

    isGameday: boolean
    setIsGameday: (isGameday: boolean) => void
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

    busRoutes: [],
    setBusRoutes: (busRoutes) => set(() => ({ busRoutes })),

    selectedRouteCategory: "On Campus",
    setSelectedRouteCategory: (routeCategory) => set(() => ({ selectedRouteCategory: routeCategory })),

    selectedRoute: null,
    setSelectedRoute: (selectedRoute) => set(() => ({ selectedRoute })),

    selectedGroup: null,
    setSelectedGroup: (selectedGroup) => set(() => ({ selectedGroup })),

    isGameday: false,
    setIsGameday: (isGameday) => set(() => ({ isGameday }))
}));

export default useAppStore;