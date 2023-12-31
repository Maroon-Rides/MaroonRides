import { useEffect } from 'react';
import { View, Alert } from 'react-native';
import { getAuthentication, getBaseData, getPatternPaths } from "aggie-spirit-api";

import useAppStore from './stores/useAppStore';
import { GetBaseDataResponseSchema, IGetBaseDataResponse, GetPatternPathsResponseSchema, IGetPatternPathsResponse, IMapRoute } from "../utils/updatedInterfaces";
import { offCampusRoutes, onCampusRoutes } from '../utils/utils';
import BottomSheet from "./components/BottomSheet";
import MapView from './components/MapView';

const Home = () => {
    const selectedRouteCategory = useAppStore((state) => state.selectedRouteCategory);

    const setAuthToken = useAppStore((state) => state.setAuthToken);

    const setRoutes = useAppStore((state) => state.setRoutes);

    const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);

    const setMapServiceInterruption = useAppStore((state) => state.setMapServiceInterruption);

    useEffect(() => {
        const getInitialData = async () => {
            // Get and store the auth token
            // Auth token is needed for future api requests and must use the value in AppStore
            const authToken = await getAuthentication().catch(() => {
                Alert.alert("Error while fetching auth token");

                return;
            });

            setAuthToken(authToken);

            // Get the base data which includes routes (without patternPaths) and serviceInterruptions
            async function fetchBaseData(authToken: string) {
                try {
                    return await getBaseData(authToken);
                } catch (error) {
                    console.error(error);

                    throw new Error("Error while fetching base data");
                }
            }

            // Fetch the pattern paths which are the route lines on the map
            async function fetchPatternPaths(routeKeys: string[], authToken: string) {
                try {
                    return await getPatternPaths(routeKeys, authToken);
                } catch (error) {
                    console.error(error);

                    throw new Error("Error while fetching pattern paths: ");
                }
            }

            // Add each pattern path to the corresponding route
            function addPatternPathsToRoutes(baseDataRoutes: IMapRoute[], patternPathsResponse: IGetPatternPathsResponse) {
                for (let elm of patternPathsResponse) {
                    const foundObject = baseDataRoutes.find(route => route.key === elm.routeKey);
                    if (foundObject) {
                        foundObject.patternPaths = elm.patternPaths;
                    }
                }
                return baseDataRoutes;
            }

            function addOnCampusOffCampusLabelToRoutes(routes: IMapRoute[]) {
                for(let route of routes) {
                    if(offCampusRoutes.includes(route.shortName)) {
                        route.category = "Off Campus";
                    } else if(onCampusRoutes.includes(route.shortName)) {
                        route.category = "On Campus"
                    }
                }

                return routes
            }

            async function loadData() {
                try {
                    const baseData: IGetBaseDataResponse = await fetchBaseData(authToken);
                    const patternPathsResponse = await fetchPatternPaths(baseData.routes.map(route => route.key), authToken);

                    // Add patternPaths to routes
                    const routes = addOnCampusOffCampusLabelToRoutes(addPatternPathsToRoutes([...baseData.routes], patternPathsResponse));

                    // Validate the data against schemas
                    GetBaseDataResponseSchema.parse(baseData);
                    GetPatternPathsResponseSchema.parse(patternPathsResponse);

                    setRoutes(routes);
                    setDrawnRoutes(routes.filter(route => route.category === selectedRouteCategory));
                    setMapServiceInterruption(baseData.serviceInterruptions);

                } catch (error) {
                    console.error(error);

                    Alert.alert("Error while loading initial data");
                }
            }

            loadData();
        };

        getInitialData();
    }, []);

    return (
        <View style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <MapView />

            <BottomSheet />
        </View>
    )
}

export default Home;