import { create } from "zustand";
import { RouteGroup, getRoutesByGroup } from "aggie-spirit-api"
import AsyncStorage from "@react-native-async-storage/async-storage";

import { IBusRoute, IRouteCategory } from "utils/interfaces";

interface AppState {
    busRoutes: IBusRoute[]
    setBusRoutes: (busRoutes: IBusRoute[]) => void

    selectedRouteCategory: IRouteCategory
    setSelectedRouteCategory: (routeCategory: IRouteCategory) => void

    selectedRoute: IBusRoute | null
    setSelectedRoute: (selectedRoute: IBusRoute | null) => void

    selectedGroup: IBusRoute[] | null,
    setSelectedGroup: (selectedGroup: IBusRoute[] | null) => void

    drawnRoutes: IBusRoute[],
    setDrawnRoutes: (routes: IBusRoute[]) => void

    isGameday: boolean
    setIsGameday: (isGameday: boolean) => void
}

const useAppStore = create<AppState>()((set) => ({
    busRoutes: [],
    setBusRoutes: (busRoutes) => set(() => ({ busRoutes })),

    selectedRouteCategory: "On Campus",
    setSelectedRouteCategory: (routeCategory) => set(() => ({ selectedRouteCategory: routeCategory })),

    selectedRoute: null,
    setSelectedRoute: (selectedRoute) => set(() => ({ selectedRoute })),

    selectedGroup: null,
    setSelectedGroup: (selectedGroup) => set(() => ({ selectedGroup })),
    
    drawnRoutes: [],
    setDrawnRoutes: (routes) => set(() => ({ drawnRoutes: routes })),

    isGameday: false,
    setIsGameday: (isGameday) => set(() => ({ isGameday }))
}));

export const fetchAndCacheRoutesData = async () => {
    try {
        // Fetch routes data for specified groups
        const data = await getRoutesByGroup([RouteGroup.ON_CAMPUS, RouteGroup.OFF_CAMPUS]);

        // Cache the fetched data in AsyncStorage
        await AsyncStorage.setItem("routeCache", JSON.stringify(data));

        // Store the current date as the cache date
        await AsyncStorage.setItem("cacheDate", new Date().toLocaleDateString());

        // Return the fetched data
        return data;
    } catch (error) {
        // Handle errors, e.g., log or display an error message
        console.error("Error downloading data:", error);
        // Optionally, you can rethrow the error if needed
        throw error;
    }
};

export const fetchBusData = async () => {
    let data: any;

    const cacheDate = await AsyncStorage.getItem("cacheDate");
    const todayDateString = new Date().toLocaleDateString();

    if (cacheDate !== todayDateString) {
        data = await fetchAndCacheRoutesData().catch(async (downloadError) => {
            console.error("Error downloading data for cache: ", downloadError);

            await AsyncStorage.getItem("routeCache").then((res) => {
                if (res) {
                    data = JSON.parse(res);
                }
            });
        });
    } else {
        console.log("Using cached data");

        const routeCache = await AsyncStorage.getItem("routeCache");
        data = routeCache ? JSON.parse(routeCache) : await fetchAndCacheRoutesData();
    }

    return data;
}

export default useAppStore;