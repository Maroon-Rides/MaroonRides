import { useEffect, useRef } from 'react';
import { View, Alert, Appearance } from 'react-native';
import { getAuthentication, getBaseData, getPatternPaths } from "aggie-spirit-api";
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import useAppStore from './stores/useAppStore';
import { GetBaseDataResponseSchema, GetPatternPathsResponseSchema, IGetPatternPathsResponse, IMapRoute } from "../utils/interfaces";
import MapView from './components/map/MapView';
import RoutesList from './components/sheets/RoutesList';
import AlertList from './components/sheets/AlertList';
import AlertDetail from "./components/sheets/AlertDetail";
import RouteDetails from './components/sheets/RouteDetails';
import StopTimetable from './components/sheets/StopTimetable';
import Settings from './components/sheets/Settings';
import { useColorScheme } from 'react-native';
import { darkMode, lightMode } from './theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Home = () => {
    const setAuthToken = useAppStore((state) => state.setAuthToken);
    const setRoutes = useAppStore((state) => state.setRoutes);
    const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);
    const setMapServiceInterruption = useAppStore((state) => state.setMapServiceInterruption);
    const setPresentSheet = useAppStore((state) => state.setPresentSheet);
    const setTheme = useAppStore((state) => state.setTheme);
    const colorScheme = useColorScheme();
    
    async function getColorScheme(): Promise<string> {
        const themeIndex = await AsyncStorage.getItem('app-theme')

        switch (themeIndex) {
            case "1":
                return "light"
            case "2":
                return "dark"
            default:
                return colorScheme == "dark" ? "dark" : "light"
        }    
    }

    useEffect(() => {
        getColorScheme().then((newTheme) => {
            const t = newTheme == "dark" ? darkMode : lightMode

            setTheme(t);
            Appearance.setColorScheme(t.mode);
        })


        const getInitialData = async () => {
            // Get and store the auth token
            // Auth token is needed for future api requests and must use the value in AppStore
            const authToken = await getAuthentication().catch((error) => {
                console.error(error);

                Alert.alert("Something went wrong", "Some features may not work correctly. Please try again later.");

                return;
            });

            setAuthToken(authToken!);

            // Get the base data which includes routes (without patternPaths) and serviceInterruptions
            async function fetchBaseData(authToken: string) {
                let baseData;
                
                try {
                    baseData = await getBaseData(authToken);
                } catch (error) {
                    console.error(error);

                    Alert.alert("Something went wrong", "Some features may not work correctly. Please try again later.");

                    return;
                }

                return baseData;
            }

            // Fetch the pattern paths which are the route lines on the map
            async function fetchPatternPaths(routeKeys: string[], authToken: string) {
                let patternPaths;
                
                try {
                    patternPaths = await getPatternPaths(routeKeys, authToken);
                } catch (error) {
                    console.error(error);

                    Alert.alert("Something went wrong", "Some features may not work correctly. Please try again later.");

                    return;
                }

                return patternPaths;
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

            async function loadData() {
                try {
                    if (!authToken) {
                        return;
                    }

                    const baseData = await fetchBaseData(authToken);

                    if(!baseData) {
                        return;
                    }

                    const patternPathsResponse = await fetchPatternPaths(baseData.routes.map(route => route.key), authToken);

                    if(!patternPathsResponse) {
                        return;
                    }

                    // Add patternPaths to routes
                    const routes = addPatternPathsToRoutes([...baseData.routes], patternPathsResponse);

                    // convert colors based on theme
                    const colorTheme = (await getColorScheme()) == "dark" ? darkMode : lightMode

                    routes.forEach(route => {
                        if (colorTheme.busTints[route.shortName]) {
                            route.directionList.forEach(direction => {
                                direction.lineColor = colorTheme.busTints[route.shortName]!;
                            })
                        }
                    });
                    
                    // Validate the data against schemas
                    GetBaseDataResponseSchema.parse(baseData);
                    GetPatternPathsResponseSchema.parse(patternPathsResponse);

                    setRoutes(routes);
                    setDrawnRoutes(routes);
                    setMapServiceInterruption(baseData.serviceInterruptions);

                } catch (error) {
                    console.error(error);

                    Alert.alert("Something went wrong", "Some features may not work correctly. Please try again later.");

                    return;
                }
            }

            loadData();
        };

        getInitialData();
    }, []);

    const routesListSheetRef = useRef<BottomSheetModal>(null);
    const alertListSheetRef = useRef<BottomSheetModal>(null);
    const alertDetailSheetRef = useRef<BottomSheetModal>(null);
    const routeDetailSheetRef = useRef<BottomSheetModal>(null);
    const stopTimetableSheetRef = useRef<BottomSheetModal>(null);
    const settingsSheetRef = useRef<BottomSheetModal>(null);

    setPresentSheet((sheet) => {
        switch (sheet) {
            case "alerts":
                alertListSheetRef.current?.present();
                break;
            case "routeDetails":
                routeDetailSheetRef.current?.present();
                break;
            case "stopTimetable":
                stopTimetableSheetRef.current?.present();
                break;
            case "settings":
                settingsSheetRef.current?.present();
                break;
            case "alertsDetail":
                alertDetailSheetRef.current?.present();
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

                <Settings sheetRef={settingsSheetRef} />
                <RouteDetails sheetRef={routeDetailSheetRef} />
                <RoutesList sheetRef={routesListSheetRef} />
                <AlertList sheetRef={alertListSheetRef} />
                <AlertDetail sheetRef={alertDetailSheetRef} />
                <StopTimetable sheetRef={stopTimetableSheetRef} />
            </View>
        </BottomSheetModalProvider>
    )
}

export default Home;