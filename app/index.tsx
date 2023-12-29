import { useEffect } from 'react';
import { View, Alert } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getAuthentication, getBaseData, getPatternPaths } from "aggie-spirit-api";

import useAppStore from './stores/useAppStore';
import { GetBaseDataResponseSchema, IGetBaseDataResponse, GetPatternPathsResponseSchema, IGetPatternPathsResponse, IMapPatternPath } from "../utils/updatedInterfaces";
import BottomSheet from "./components/BottomSheet";
import MapView from './components/MapView';

const Home = () => {
    const queryClient = new QueryClient();

    const setAuthToken = useAppStore((state) => state.setAuthToken);

    const setRoutes = useAppStore((state) => state.setRoutes);

    const setMapServiceInterruption = useAppStore((state) => state.setMapServiceInterruption);

    const setPatternPaths = useAppStore((state) => state.setPatternPaths);
    
    useEffect(() => {
        const getInitialData = async () => {
            // Get and store the auth token
            // Auth token is needed for future api requests and must use the value in AppStore
            const authToken = await getAuthentication().catch(() => {
                Alert.alert("Error while fetching auth token");

                return;
            });

            setAuthToken(authToken);

            // Fetch bus routes and any service interruptions
            // Parse the api response and alert if there is any unexpected or missing data
            try {
                let baseData: IGetBaseDataResponse = await getBaseData(authToken);

                const routeKeys = baseData.routes.map(route => route.key);
                const patternPathsResponse: IGetPatternPathsResponse = await getPatternPaths(routeKeys, authToken).catch(() => Alert.alert("Error while fetching pattern paths"));

                GetPatternPathsResponseSchema.parse(patternPathsResponse);

                for (let elm of patternPathsResponse) {
                    const foundObjectIndex = baseData.routes.findIndex(route => route.key === elm.routeKey);
                
                    if (foundObjectIndex !== -1) {
                        // Modify the found object directly in the baseData.routes array
                        baseData.routes[foundObjectIndex]['patternPaths'] = elm.patternPaths // Replace 'someProperty' with the property you want to modify
                        // ... you can modify other properties similarly
                    }
                }

                GetBaseDataResponseSchema.parse(baseData);

                setRoutes(baseData.routes);
                setMapServiceInterruption(baseData.serviceInterruptions);
                  
            } catch (error) {
                Alert.alert("Error while fetching base data");

                console.error(error);   

                return;
            }
        };

        getInitialData();
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <View style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <MapView />

                <BottomSheet  />
            </View>
        </QueryClientProvider>
    )
}

export default Home;