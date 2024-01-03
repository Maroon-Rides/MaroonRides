import { useEffect, useRef } from 'react';
import { View, Alert } from 'react-native';
import { BaseDataResponse, MapRoute, PatternPathsResponse, getAuthentication, getBaseData, getPatternPaths } from "aggie-spirit-api";
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import useAppStore from './stores/useAppStore';
import { GetBaseDataResponseSchema, GetPatternPathsResponseSchema } from "../utils/updatedInterfaces";
import MapView from './components/MapView';
import RoutesList from './components/sheets/RoutesList';
import AlertList from './components/sheets/AlertList';
import RouteDetails from './components/sheets/RouteDetails';



const Home = () => {
    const setAuthToken = useAppStore((state) => state.setAuthToken);
    const setRoutes = useAppStore((state) => state.setRoutes);
    const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);
    const setMapServiceInterruption = useAppStore((state) => state.setMapServiceInterruption);
    const setPresentSheet = useAppStore((state) => state.setPresentSheet);
    
    useEffect(() => {
        const getInitialData = async () => {
            // Get and store the auth token
            // Auth token is needed for future api requests and must use the value in AppStore
            const authToken = await getAuthentication().catch(() => {
                Alert.alert("Error while fetching auth token");

                return;
            });

            setAuthToken(authToken!);

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
            function addPatternPathsToRoutes(baseDataRoutes: MapRoute[], patternPathsResponse: PatternPathsResponse[]) {
                for (let elm of patternPathsResponse) {
                    const foundObject = baseDataRoutes.find(route => route.key === elm.routeKey);
                    if (foundObject) {
                        foundObject.patternPaths = elm.patternPaths;
                    }
                }
                return baseDataRoutes;
            }

            async function loadData() {
                try {
                    if(!authToken) {
                        return;
                    }

                    const baseData: BaseDataResponse = await fetchBaseData(authToken);
                    const patternPathsResponse = await fetchPatternPaths(baseData.routes.map(route => route.key), authToken);

                    // Add patternPaths to routes
                    const routes = addPatternPathsToRoutes([...baseData.routes], patternPathsResponse);
 
                    // Validate the data against schemas
                    GetBaseDataResponseSchema.parse(baseData);
                    GetPatternPathsResponseSchema.parse(patternPathsResponse);

                    setRoutes(routes);
                    setDrawnRoutes(routes);
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

    const routesListSheetRef = useRef<BottomSheetModal>(null);
    const alertListSheetRef = useRef<BottomSheetModal>(null);
    const routeDetailSheetRef = useRef<BottomSheetModal>(null);

    setPresentSheet((sheet) => {
        switch (sheet) {
            case "alerts":
                alertListSheetRef.current?.present();
                break;
            case "routeDetails":
                routeDetailSheetRef.current?.present();
                break;
            default:
                break;
        }
    })

    useEffect(() => {
        routesListSheetRef.current?.present();
    }, [])

    return (
        <BottomSheetModalProvider>
            <View style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <MapView />


                <RouteDetails sheetRef={routeDetailSheetRef} />
                <RoutesList sheetRef={routesListSheetRef} />
                <AlertList sheetRef={alertListSheetRef} />
            </View>
        </BottomSheetModalProvider>
    )
}

export default Home;