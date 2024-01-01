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

    sheetView: "routeList" | "routeDetails" | "alerts",
    setSheetView: (sheetView: "routeList" | "routeDetails" | "alerts") => void,
     
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
    resetDrawnRoutes: () => set(state => ({ drawnRoutes: state.routes })),
    
    selectedRoute: null,
    setSelectedRoute: (selectedRoute) => set(() => ({ selectedRoute })),
    clearSelectedRoute: () => set(state => {
        state.resetDrawnRoutes();

        return { selectedRoute: null };
    }),

    sheetView: "routeList",
    setSheetView: (sheetView) => set(() => ({ sheetView })),

    isGameday: false,
    setIsGameday: (isGameday) => set(() => ({ isGameday }))
}));

export default useAppStore;