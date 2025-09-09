import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Appearance, BackHandler, StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import useAppStore from 'src/data/app_state';
import RouteMap from './components/map/MapView';
import {
  SheetControllerContext,
  Sheets,
} from './components/providers/sheet-controller';
import AlertDetail from './components/sheets/AlertDetail';
import AlertList from './components/sheets/AlertList';
import InputRoute from './components/sheets/route_planning/InputRoute';
import TripPlanDetail from './components/sheets/route_planning/TripPlanDetail';
import RouteDetails from './components/sheets/RouteDetails';
import RoutesList from './components/sheets/RoutesList';
import Settings from './components/sheets/Settings';
import StopTimetable from './components/sheets/StopTimetable';
import getTheme from './theme';

// this needs to be out of component and not a state
// weird stuff happens if it is a state
let sheetStack: Sheets[] = [];

const Home = () => {
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
    if (!currentSheet || currentSheet === Sheets.ROUTE_LIST) return false;

    dismissSheet(currentSheet);
    return true;
  });

  function dismissSheet(sheet: Sheets) {
    callSheetCloseCallback(sheet);

    // run any defined close sheet steps
    const prevSheet = sheetRefs[sheet];
    prevSheet?.current?.dismiss();
    sheetStack.pop();
  }

  function presentSheet(sheet: Sheets) {
    const newSheet = sheetRefs[sheet];
    newSheet?.current?.present();
    sheetStack.push(sheet);
  }

  // set the theme based on the user's preference
  // Show the routes list sheet on app start
  useEffect(() => {
    void getTheme().then((theme) => {
      setTheme(theme);
      Appearance.setColorScheme(theme.mode);
    });

    presentSheet(Sheets.ROUTE_LIST);
  }, []);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SheetControllerContext.Provider
          value={{
            presentSheet: presentSheet,
            dismissSheet: dismissSheet,
          }}
        >
          <BottomSheetModalProvider>
            <StatusBar
              barStyle={
                theme.mode === 'dark' ? 'light-content' : 'dark-content'
              }
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
        </SheetControllerContext.Provider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
};

export default Home;
