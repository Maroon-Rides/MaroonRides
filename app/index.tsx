import { useEffect, useRef } from 'react';
import { View, Appearance, BackHandler } from 'react-native';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import useAppStore from './data/app_state';
import MapView from './components/map/MapView';
import RoutesList from './components/sheets/RoutesList';
import AlertList from './components/sheets/AlertList';
import AlertDetail from "./components/sheets/AlertDetail";
import RouteDetails from './components/sheets/RouteDetails';
import StopTimetable from './components/sheets/StopTimetable';
import Settings from './components/sheets/Settings';
import { darkMode, lightMode } from './theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Query, QueryClient } from '@tanstack/react-query';
import { getColorScheme } from './utils';
import InputRoute from './components/sheets/route_planning/InputRoute';
import TripPlanDetail from './components/sheets/route_planning/TripPlanDetail';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

// this needs to be out of component and not a state
// weird stuff happens if it is a state
var sheetStack: ("routeList" | "routeDetails" | "alerts" | "stopTimetable" | "settings" | "alertsDetail" | "inputRoute" | "tripPlanDetail")[] = [];

const Home = () => {
    const setPresentSheet = useAppStore((state) => state.setPresentSheet);
    const setDismissSheet = useAppStore((state) => state.setDismissSheet);
    const dismissSheet = useAppStore((state) => state.dismissSheet);
    const setTheme = useAppStore((state) => state.setTheme);   
    const callSheetCloseCallback = useAppStore((state) => state.callSheetCloseCallback);   

    const routesListSheetRef = useRef<BottomSheetModal>(null);
    const alertListSheetRef = useRef<BottomSheetModal>(null);
    const alertDetailSheetRef = useRef<BottomSheetModal>(null);
    const routeDetailSheetRef = useRef<BottomSheetModal>(null);
    const stopTimetableSheetRef = useRef<BottomSheetModal>(null);
    const settingsSheetRef = useRef<BottomSheetModal>(null);

    // Route Planning
    const inputRouteSheetRef = useRef<BottomSheetModal>(null);
    const tripPlanDetailSheetRef = useRef<BottomSheetModal>(null);

    BackHandler.addEventListener("hardwareBackPress", () => {
        const currentSheet = sheetStack.at(-1)
        if (!currentSheet || currentSheet == "routeList") return false
        
        dismissSheet(currentSheet)
        return true
    })

    // set the theme based on the user's preference
    // Show the routes list sheet on app start
    useEffect(() => {
        getColorScheme().then((newTheme) => {
            const t = newTheme == "dark" ? darkMode : lightMode
            
            setTheme(t);
            Appearance.setColorScheme(t.mode);
        })

        routesListSheetRef.current?.present();
        sheetStack = ["routeList"]

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
                case "inputRoute":
                    inputRouteSheetRef.current?.present();
                    break;
                case "tripPlanDetail":
                    tripPlanDetailSheetRef.current?.present();
                    break;
                default:
                    return;
            }

            sheetStack.push(sheet)
        })
    
        setDismissSheet((sheet) => {
            // run any defined close sheet steps
            callSheetCloseCallback(sheet)

            switch (sheet) {
                case "alerts":
                    alertListSheetRef.current?.dismiss();
                    break;
                case "routeDetails":
                    routeDetailSheetRef.current?.dismiss();
                    break;
                case "stopTimetable":
                    stopTimetableSheetRef.current?.dismiss();
                    break;
                case "settings":
                    settingsSheetRef.current?.dismiss();
                    break;
                case "alertsDetail":
                    alertDetailSheetRef.current?.dismiss();
                    break;
                case "inputRoute":
                    inputRouteSheetRef.current?.dismiss();
                    break;
                case "tripPlanDetail":
                    tripPlanDetailSheetRef.current?.dismiss();
                    break;
                default:
                    return;
            }

            sheetStack = sheetStack.slice(0, -1)
        })
    }, [])

    const queryClient = new QueryClient()
    const asyncStoragePersister = createAsyncStoragePersister({
        storage: AsyncStorage,
    })

    return (
        <PersistQueryClientProvider 
            client={queryClient}
            persistOptions={{
                persister: asyncStoragePersister,
                dehydrateOptions: {
                    shouldDehydrateQuery: (query: Query): boolean => {
                        // only persist queries who ask for it and are successful
                        return query.meta?.persist as boolean && query.state.status === 'success'
                    },
                },
                maxAge: 2 * 3600 * 1000
            }}
        >
            <GestureHandlerRootView style={{ flex: 1 }}>
                <BottomSheetModalProvider>
                    <View style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <MapView />
                    </View>

                    {/* Sheets */}
                    <RoutesList sheetRef={routesListSheetRef} />
                    <RouteDetails sheetRef={routeDetailSheetRef} />
                    <StopTimetable sheetRef={stopTimetableSheetRef} />
                    <AlertList sheetRef={alertListSheetRef} />
                    <AlertDetail sheetRef={alertDetailSheetRef} />
                    <Settings sheetRef={settingsSheetRef} />

                    {/* Route Planning Sheets*/}
                    <InputRoute sheetRef={inputRouteSheetRef} />
                    <TripPlanDetail sheetRef={tripPlanDetailSheetRef} />

                </BottomSheetModalProvider>
            </GestureHandlerRootView>
        </PersistQueryClientProvider>
    )
}

export default Home;