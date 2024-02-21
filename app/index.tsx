import { useEffect, useRef } from 'react';
import { View, Appearance } from 'react-native';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import useAppStore from './stores/useAppStore';
import MapView from './components/map/MapView';
import RoutesList from './components/sheets/RoutesList';
import AlertList from './components/sheets/AlertList';
import AlertDetail from "./components/sheets/AlertDetail";
import RouteDetails from './components/sheets/RouteDetails';
import StopTimetable from './components/sheets/StopTimetable';
import Settings from './components/sheets/Settings';
import { darkMode, lightMode } from './theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getColorScheme } from './utils';

const Home = () => {
    const setPresentSheet = useAppStore((state) => state.setPresentSheet);
    const setTheme = useAppStore((state) => state.setTheme);   

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

    // set the theme based on the user's preference
    // Show the routes list sheet on app start
    useEffect(() => {
        getColorScheme().then((newTheme) => {
            const t = newTheme == "dark" ? darkMode : lightMode
            
            setTheme(t);
            Appearance.setColorScheme(t.mode);
        })

        routesListSheetRef.current?.present();
    }, [])

    const queryClient = new QueryClient()

    return (
        <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
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
            </GestureHandlerRootView>
        </QueryClientProvider>
    )
}

export default Home;