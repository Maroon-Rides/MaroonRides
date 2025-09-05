import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { Query, QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useEffect, useRef } from 'react';
import { Appearance, BackHandler, StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RouteMap from './components/map/MapView';
import AlertDetail from './components/sheets/AlertDetail';
import AlertList from './components/sheets/AlertList';
import InputRoute from './components/sheets/route_planning/InputRoute';
import TripPlanDetail from './components/sheets/route_planning/TripPlanDetail';
import RouteDetails from './components/sheets/RouteDetails';
import RoutesList from './components/sheets/RoutesList';
import Settings from './components/sheets/Settings';
import StopTimetable from './components/sheets/StopTimetable';
import useAppStore from './data/app_state';
import { darkMode, lightMode } from './theme';
import { getColorScheme } from './utils';

type Sheets =
  | 'routeList'
  | 'alerts'
  | 'routeDetails'
  | 'stopTimetable'
  | 'settings'
  | 'alertsDetail'
  | 'inputRoute'
  | 'tripPlanDetail';

// this needs to be out of component and not a state
// weird stuff happens if it is a state
let sheetStack: Sheets[] = [];

const Home = () => {
  const setPresentSheet = useAppStore((state) => state.setPresentSheet);
  const setDismissSheet = useAppStore((state) => state.setDismissSheet);
  const dismissSheet = useAppStore((state) => state.dismissSheet);
  const setTheme = useAppStore((state) => state.setTheme);
  const callSheetCloseCallback = useAppStore(
    (state) => state.callSheetCloseCallback,
  );
  const theme = useAppStore((state) => state.theme);

  const sheetRefs: Record<Sheets, React.RefObject<BottomSheetModal | null>> = {
    routeList: useRef<BottomSheetModal>(null),
    alerts: useRef<BottomSheetModal>(null),
    routeDetails: useRef<BottomSheetModal>(null),
    stopTimetable: useRef<BottomSheetModal>(null),
    settings: useRef<BottomSheetModal>(null),
    alertsDetail: useRef<BottomSheetModal>(null),
    inputRoute: useRef<BottomSheetModal>(null),
    tripPlanDetail: useRef<BottomSheetModal>(null),
  };

  BackHandler.addEventListener('hardwareBackPress', () => {
    const currentSheet = sheetStack.at(-1);
    if (!currentSheet || currentSheet === 'routeList') return false;

    dismissSheet(currentSheet);
    return true;
  });

  // set the theme based on the user's preference
  // Show the routes list sheet on app start
  useEffect(() => {
    getColorScheme().then((newTheme) => {
      const t = newTheme === 'dark' ? darkMode : lightMode;

      setTheme(t);
      Appearance.setColorScheme(t.mode);
    });

    sheetRefs['routeList'].current?.present();
    sheetStack = ['routeList'];

    setPresentSheet((sheet) => {
      const newSheet = sheetRefs[sheet];
      newSheet?.current?.present();
      sheetStack.push(sheet);
    });

    setDismissSheet((sheet) => {
      // run any defined close sheet steps
      callSheetCloseCallback(sheet);
      const prevSheet = sheetRefs[sheet];
      prevSheet?.current?.close();
      sheetStack.pop();
    });
  }, []);

  const queryClient = new QueryClient();
  const asyncStoragePersister = createAsyncStoragePersister({
    storage: AsyncStorage,
  });

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        dehydrateOptions: {
          shouldDehydrateQuery: (query: Query): boolean => {
            // only persist queries who ask for it and are successful
            return (
              (query.meta?.persist as boolean) &&
              query.state.status === 'success'
            );
          },
        },
        maxAge: 2 * 3600 * 1000,
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <StatusBar
            barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
            backgroundColor={theme.background}
          />
          <View
            style={{
              display: 'flex',
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <RouteMap />
          </View>

          {/* Sheets */}
          <RoutesList sheetRef={sheetRefs['routeList']} />
          <RouteDetails sheetRef={sheetRefs['routeDetails']} />
          <StopTimetable sheetRef={sheetRefs['stopTimetable']} />
          <AlertList sheetRef={sheetRefs['alerts']} />
          <AlertDetail sheetRef={sheetRefs['alertsDetail']} />
          <Settings sheetRef={sheetRefs['settings']} />

          {/* Route Planning Sheets*/}
          <InputRoute sheetRef={sheetRefs['inputRoute']} />
          <TripPlanDetail sheetRef={sheetRefs['tripPlanDetail']} />
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
};

export default Home;
