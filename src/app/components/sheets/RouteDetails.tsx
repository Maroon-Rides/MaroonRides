import { SegmentedControlEvent } from '@data/utils/utils';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetFlatList,
  BottomSheetFlatListMethods,
} from '@gorhom/bottom-sheet';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

import useAppStore from '@data/state/app_state';
import { Sheets, useSheetController } from '../providers/sheet-controller';
import AlertPill from '../ui/AlertPill';
import BusIcon from '../ui/BusIcon';
import FavoritePill from '../ui/FavoritePill';
import StopCell from '../ui/StopCell';
import BaseSheet, { SheetProps } from './BaseSheet';

// Display details when a route is selected
const RouteDetails: React.FC<SheetProps> = ({ sheetRef }) => {
  const flatListRef = React.useRef<BottomSheetFlatListMethods>(null);

  const selectedRoute = useAppStore((state) => state.selectedRoute);
  const clearSelectedRoute = useAppStore((state) => state.clearSelectedRoute);

  const selectedDirection = useAppStore((state) => state.selectedDirection);
  const setSelectedDirection = useAppStore(
    (state) => state.setSelectedDirection,
  );
  const setSelectedStop = useAppStore((state) => state.setSelectedStop);
  const setPoppedUpStopCallout = useAppStore(
    (state) => state.setPoppedUpStopCallout,
  );
  const setScrollToStop = useAppStore((state) => state.setScrollToStop);
  const { dismissSheet } = useSheetController();
  const theme = useAppStore((state) => state.theme);

  // Controls SegmentedControl
  const [selectedDirectionIndex, setSelectedDirectionIndex] = useState(0);
  const client = useQueryClient();

  // Update the selected route when the currentSelectedRoute changes but only if it is not null
  // Prevents visual glitch when the sheet is closed and the selected route is null
  useEffect(() => {
    if (!selectedRoute) return;

    // reset direction selector
    setSelectedDirection(selectedRoute.directions[0] ?? null);
    setSelectedDirectionIndex(0);
  }, [selectedRoute]);

  // update the segmented control when the selected direction changes
  useEffect(() => {
    if (!selectedRoute) return;

    const directionIndex = selectedRoute.directions.findIndex(
      (direction) => direction.id === selectedDirection?.id,
    );

    if (directionIndex === -1) return;
    setSelectedDirectionIndex(directionIndex);
  }, [selectedDirection]);

  function onPresent() {
    setScrollToStop(async (stop) => {
      const index = selectedDirection?.stops.findIndex(
        (st) => st.id === stop.id,
      );

      if (index && index !== -1) {
        // sheetRef.current?.snapToIndex(2);
        flatListRef.current?.scrollToIndex({
          index: index,
          animated: true,
        });
      }
    });
  }

  function onDismiss() {
    clearSelectedRoute();
    setSelectedDirection(null);

    setSelectedStop(null);
    setPoppedUpStopCallout(null);

    // reset direction selector
    setSelectedDirectionIndex(0);
  }

  const handleSetSelectedDirection = (evt: SegmentedControlEvent) => {
    const index = evt.nativeEvent.selectedSegmentIndex;

    setSelectedDirectionIndex(index);
    setSelectedDirection(selectedRoute?.directions[index] ?? null);
  };

  return (
    <BaseSheet
      sheetKey={Sheets.ROUTE_DETAILS}
      sheetRef={sheetRef}
      snapPoints={['25%', '45%', '85%']}
      initialSnapIndex={1}
      onDismiss={onDismiss}
      onPresent={onPresent}
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
              onPress={() => dismissSheet(Sheets.ROUTE_DETAILS)}
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
            <AlertPill route={selectedRoute} />
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
          keyExtractor={(_, idx) => idx.toString()}
          style={{ height: '100%' }}
          contentContainerStyle={{
            paddingBottom: 35,
            paddingLeft: 16,
            paddingTop: 4,
          }}
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
            // TODO: move this to structure query
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
                hasTimetable={!isLastStop}
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
    </BaseSheet>
  );
};

export default RouteDetails;
