import { create } from "zustand";

import { IBusRoute, IRouteCategory } from "utils/interfaces";

interface AppState {
    routeCategory: IRouteCategory
    setRouteCategory: (routeCategory: IRouteCategory) => void
    
    drawnRoutes: IBusRoute[],
    setDrawnRoutes: (routes: IBusRoute[]) => void
}

const useAppStore = create<AppState>()((set) => ({
    routeCategory: "On Campus",
    setRouteCategory: (routeCategory) => set(() => ({ routeCategory })),

   drawnRoutes: [],
   setDrawnRoutes: (routes) => set(() => ({ drawnRoutes: routes })),

}));

export default useAppStore;