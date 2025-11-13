import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import useAppStore from '@lib/state/app_state';
import { useTheme } from '@lib/state/utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Appearance, BackHandler, StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
  const theme = useTheme();

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

  const [sheetDismissCallbacks, setSheetDismissCallbacks] = useState<
    Record<Sheets, () => void>
  >({} as Record<Sheets, () => void>);
  const [sheetPresentCallbacks, setSheetPresentCallbacks] = useState<
    Record<Sheets, () => void>
  >({} as Record<Sheets, () => void>);

  BackHandler.addEventListener('hardwareBackPress', () => {
    const currentSheet = sheetStack.at(-1);
    if (!currentSheet || currentSheet === Sheets.ROUTE_LIST) return false;

    dismissSheet(currentSheet);
    return true;
  });

  function dismissSheet(sheet: Sheets) {
    sheetDismissCallbacks[sheet]?.();

    const prevSheet = sheetRefs[sheet];
    prevSheet?.current?.dismiss();
    sheetStack.pop();

    sheetPresentCallbacks[sheetStack[sheetStack.length - 1]]?.();
  }

  function presentSheet(sheet: Sheets) {
    sheetPresentCallbacks[sheet]?.();

    const newSheet = sheetRefs[sheet];
    newSheet?.current?.present();
    sheetStack.push(sheet);
  }

  function setSheetDismissCallback(callback: () => void, sheet: Sheets) {
    setSheetDismissCallbacks((prev) => ({
      ...prev,
      [sheet]: callback,
    }));
  }

  function setSheetPresentCallback(callback: () => void, sheet: Sheets) {
    setSheetPresentCallbacks((prev) => ({
      ...prev,
      [sheet]: callback,
    }));
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
            setPresentCallback: setSheetPresentCallback,
            setDismissCallback: setSheetDismissCallback,
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
