import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetFlatList,
  BottomSheetFlatListMethods,
  BottomSheetModal,
} from '@gorhom/bottom-sheet';
import SegmentedControl, {
  NativeSegmentedControlIOSChangeEvent,
} from '@react-native-segmented-control/segmented-control';
import { useQueryClient } from '@tanstack/react-query';
import { Direction, Route } from 'app/data/datatypes';
import { SheetProps } from 'app/utils';
import React, { useEffect, useState } from 'react';
import {
  NativeSyntheticEvent,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import useAppStore from '../../data/app_state';
import AlertPill from '../ui/AlertPill';
import BusIcon from '../ui/BusIcon';
import FavoritePill from '../ui/FavoritePill';
import StopCell from '../ui/StopCell';

// Display details when a route is selected
const RouteDetails: React.FC<SheetProps> = ({ sheetRef }) => {
  const flatListRef = React.useRef<BottomSheetFlatListMethods>(null);

  const currentSelectedRoute = useAppStore((state) => state.selectedRoute);
  const clearSelectedRoute = useAppStore((state) => state.clearSelectedRoute);

  const [futurePosition, setFuturePosition] = useState(-1);

  const selectedDirection = useAppStore((state) => state.selectedDirection);
  const setSelectedDirection = useAppStore(
    (state) => state.setSelectedDirection,
  );
  const setSelectedStop = useAppStore((state) => state.setSelectedStop);
  const setPoppedUpStopCallout = useAppStore(
    (state) => state.setPoppedUpStopCallout,
  );
  const setSheetCloseCallback = useAppStore(
    (state) => state.setSheetCloseCallback,
  );
  const setScrollToStop = useAppStore((state) => state.setScrollToStop);
  const dismissSheet = useAppStore((state) => state.dismissSheet);
  const theme = useAppStore((state) => state.theme);

  // Controls SegmentedControl
  const [selectedDirectionIndex, setSelectedDirectionIndex] = useState(0);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  const client = useQueryClient();

  // Filters patternPaths for only the selected route from all patternPaths
  function getPatternPathForSelectedRoute(): Direction | undefined {
    if (!selectedRoute) return undefined;
    return selectedRoute.directions.find(
      (direction) =>
        direction.id === selectedRoute.directions[selectedDirectionIndex].id,
    );
  }

  const handleDismiss = () => {
    dismissSheet('routeDetails');
  };

  // Update the selected route when the currentSelectedRoute changes but only if it is not null
  // Prevents visual glitch when the sheet is closed and the selected route is null
  useEffect(() => {
    if (!currentSelectedRoute) return;
    setSelectedRoute(currentSelectedRoute);

    // reset direction selector
    setSelectedDirection(currentSelectedRoute.directions[0] ?? null);
    setSelectedDirectionIndex(0);
  }, [currentSelectedRoute]);

  // update the segmented control when the selected direction changes
  useEffect(() => {
    if (!selectedRoute) return;

    const directionIndex = selectedRoute.directions.findIndex(
      (direction) => direction.id === selectedDirection?.id,
    );

    if (directionIndex === -1) return;
    setSelectedDirectionIndex(directionIndex);
  }, [selectedDirection]);

  useEffect(() => {
    setScrollToStop((stop) => {
      const index = getPatternPathForSelectedRoute()?.stops.findIndex(
        (st) => st.id === stop.id,
      );

      if (index && index !== -1) {
        sheetRef.current?.snapToIndex(2);
        setFuturePosition(index);
      }
    });
  }, [selectedRoute, selectedDirection]);

  useEffect(() => {
    setSheetCloseCallback(() => {
      clearSelectedRoute();
      setSelectedDirection(null);

      setSelectedStop(null);
      setPoppedUpStopCallout(null);

      // reset direction selector
      setSelectedDirectionIndex(0);
    }, 'routeDetails');

    return () => setSelectedDirection(null);
  }, []);

  const handleSetSelectedDirection = (
    evt: NativeSyntheticEvent<NativeSegmentedControlIOSChangeEvent>,
  ) => {
    const index = evt.nativeEvent.selectedSegmentIndex;

    setSelectedDirectionIndex(index);
    setSelectedDirection(selectedRoute?.directions[index] ?? null);
  };

  const snapPoints = ['25%', '45%', '85%'];
  const [snap, _] = useState(1);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      index={snap}
      enablePanDownToClose={false}
      enableDynamicSizing={false}
      backgroundStyle={{ backgroundColor: theme.background }}
      handleIndicatorStyle={{ backgroundColor: theme.divider }}
      onChange={() => {
        if (futurePosition !== -1) {
          flatListRef.current?.scrollToIndex({
            index: futurePosition,
            animated: true,
          });
          setFuturePosition(-1);
        }
      }}
    >
      {selectedRoute && (
        <View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
              marginHorizontal: 16,
            }}
          >
            <BusIcon
              name={selectedRoute.routeCode}
              color={selectedRoute.tintColor}
              style={{ marginRight: 16 }}
            />
            <Text
              style={{
                fontWeight: 'bold',
                fontSize: 28,
                flex: 1,
                color: theme.text,
              }}
            >
              {selectedRoute?.name ?? 'Something went wrong'}
            </Text>

            <TouchableOpacity
              style={{ alignContent: 'center', justifyContent: 'flex-end' }}
              onPress={handleDismiss}
            >
              <Ionicons
                name="close-circle"
                size={28}
                color={theme.exitButton}
              />
            </TouchableOpacity>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
              marginLeft: 16,
              gap: 4,
            }}
          >
            <FavoritePill routeShortName={selectedRoute.routeCode} />
            <AlertPill routeId={selectedRoute.id} showText />
          </View>

          {selectedRoute?.directions.length > 1 && (
            <SegmentedControl
              style={{ marginHorizontal: 16, marginBottom: 8 }}
              values={
                selectedRoute?.directions.map(
                  (direction) => 'to ' + direction.name,
                ) ?? []
              }
              selectedIndex={selectedDirectionIndex}
              onChange={handleSetSelectedDirection}
              backgroundColor={
                Platform.OS === 'android'
                  ? theme.androidSegmentedBackground
                  : undefined
              }
            />
          )}

          <View style={{ height: 1, backgroundColor: theme.divider }} />
        </View>
      )}

      {selectedRoute && (
        <BottomSheetFlatList
          ref={flatListRef}
          data={selectedDirection?.stops}
          // extraData={stopEstimates?.routeDirectionTimes[0]}
          style={{ height: '100%' }}
          contentContainerStyle={{ paddingBottom: 35, paddingLeft: 16 }}
          onRefresh={() =>
            client.invalidateQueries({ queryKey: ['stopEstimate'] })
          }
          refreshing={false}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                backgroundColor: theme.divider,
                marginVertical: 4,
              }}
            />
          )}
          renderItem={({ item: stop, index }) => {
            // handle the last cell showing No upcoming departures
            let direction;
            let isLastStop = index === selectedDirection!.stops.length - 1;
            let hasAlternativeDirection = selectedRoute.directions.length > 1;

            if (isLastStop && hasAlternativeDirection) {
              direction =
                selectedRoute?.directions[selectedDirectionIndex === 0 ? 1 : 0];
            } else {
              direction = selectedRoute?.directions[selectedDirectionIndex];
            }

            return (
              <StopCell
                stop={stop}
                route={selectedRoute}
                direction={direction}
                color={selectedRoute!.tintColor}
                disabled={index === selectedDirection!.stops.length - 1}
                setSheetPos={(pos) => sheetRef.current?.snapToIndex(pos)}
              />
            );
          }}
        />
      )}

      {!selectedRoute && (
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <Text style={{ color: theme.text }}>Something went wrong.</Text>
        </View>
      )}
    </BottomSheetModal>
  );
};

export default RouteDetails;
