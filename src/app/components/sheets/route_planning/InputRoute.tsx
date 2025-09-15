import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import React, { memo, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Keyboard,
  Linking,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTripPlan } from '@data/queries/route_planning';
import useAppStore from '@data/state/app_state';
import { useTheme } from '@data/state/utils';
import { MyLocation, PlaceSuggestion, PlaceType } from '@data/types';
import SuggestionInput from 'src/app/components/ui/SuggestionInput';
import TimeInput from 'src/app/components/ui/TimeInput';
import TripPlanCell from 'src/app/components/ui/TripPlanCell';
import { Sheets, useSheetController } from '../../providers/sheet-controller';
import SheetHeader from '../../ui/SheetHeader';
import BaseSheet, { SheetProps } from '../BaseSheet';

// AlertList (for all routes and current route)
const InputRoute: React.FC<SheetProps> = ({ sheetRef }) => {
  const theme = useTheme();

  // Planning Inputs
  const [startLocation, setStartLocation] = useState<PlaceSuggestion | null>(
    MyLocation,
  );
  const [endLocation, setEndLocation] = useState<PlaceSuggestion | null>(null);
  const [deadline, setDeadline] = useState<'leave' | 'arrive'>('leave');
  const [time, setTime] = useState<Date>(new Date());

  const {
    data: tripPlan,
    isError,
    isLoading: tripPlanLoading,
  } = useTripPlan(startLocation, endLocation, time, deadline);

  const searchSuggestions = useAppStore((state) => state.suggestions);
  const suggestionOutput = useAppStore((state) => state.suggestionOutput);
  const setSuggestions = useAppStore((state) => state.setSuggestions);
  const setSuggesionOutput = useAppStore((state) => state.setSuggestionOutput);
  const [routeInfoError, setRouteInfoError] = useState('');
  const { dismissSheet } = useSheetController();

  const [searchSuggestionsLoading, setSearchSuggestionsLoading] =
    useState(false);

  const client = useQueryClient();
  const [timeInputFocused, setTimeInputFocused] = useState(false);
  const [segmentedIndex, setSegmentedIndex] = useState<number>(0);

  function toggleTimeInputFocused(newValue: boolean) {
    setTimeInputFocused(newValue);
  }

  // TODO: this needs a lot of cleaning up
  useEffect(() => {
    if (suggestionOutput) {
      setRouteInfoError('');
      return;
    }

    if (startLocation && endLocation) {
      if (startLocation.name === endLocation.name) {
        setRouteInfoError('Start and End locations cannot be the same');
        return;
      }
    }

    if (
      startLocation?.type === PlaceType.MY_LOCATION ||
      endLocation?.type === PlaceType.MY_LOCATION
    ) {
      // Request location permissions
      void Location.requestForegroundPermissionsAsync().then(async (status) => {
        // Check if permission is granted
        if (!status.granted) {
          setRouteInfoError(
            'Location Unavailable, enable location in Settings.',
          );
          return;
        }

        // Get current location
        const locationCoords = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 2,
        });

        // Set the location coordinates
        let location = MyLocation;
        location.location = {
          latitude: locationCoords.coords.latitude,
          longitude: locationCoords.coords.longitude,
        };

        if (startLocation?.type === PlaceType.MY_LOCATION)
          setStartLocation(location);
        if (endLocation?.type === PlaceType.MY_LOCATION)
          setEndLocation(location);
      });
    }

    setRouteInfoError('');
  }, [startLocation, endLocation, suggestionOutput]);

  function onDismiss() {
    setTimeout(() => {
      setStartLocation(MyLocation);
      setEndLocation(null);
      setSuggesionOutput(null);
    }, 500);
  }

  return (
    <BaseSheet
      sheetRef={sheetRef}
      sheetKey={Sheets.INPUT_ROUTE}
      snapPoints={['85%']}
      initialSnapIndex={0}
      onDismiss={onDismiss}
    >
      <View
        onTouchStart={() => {
          if (!suggestionOutput && !timeInputFocused) Keyboard.dismiss();
        }}
        style={[!(routeInfoError === '') && { flex: 1 }]}
      >
        {/* header */}
        <SheetHeader
          title="Plan a Route"
          icon={
            <TouchableOpacity
              style={{ marginLeft: 10 }}
              onPress={() => {
                Keyboard.dismiss();
                dismissSheet(Sheets.INPUT_ROUTE);
              }}
            >
              <Ionicons
                name="close-circle"
                size={28}
                color={theme.exitButton}
              />
            </TouchableOpacity>
          }
        />

        {/* Route Details Input */}
        <View>
          {/* Endpoint Input */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 8,
              paddingHorizontal: 16,
            }}
          >
            <View style={{ paddingRight: 8, alignItems: 'center', flex: 1 }}>
              {/* Start */}
              <SuggestionInput
                outputName={'start'}
                location={startLocation}
                onFocus={() => {
                  if (startLocation?.type === PlaceType.MY_LOCATION)
                    setStartLocation(null);
                }}
                icon={
                  startLocation?.type === PlaceType.MY_LOCATION ? (
                    <MaterialCommunityIcons
                      name="crosshairs-gps"
                      size={24}
                      color={theme.myLocation}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="circle-outline"
                      size={20}
                      color={theme.subtitle}
                    />
                  )
                }
                setSuggestionLoading={setSearchSuggestionsLoading}
              />

              {/* 2 dots in between rows */}
              <View
                style={{
                  height: 3,
                  width: 3,
                  backgroundColor: theme.subtitle,
                  marginVertical: 1.5,
                  alignSelf: 'flex-start',
                  marginLeft: 16,
                  borderRadius: 999,
                }}
              />
              <View
                style={{
                  height: 3,
                  width: 3,
                  backgroundColor: theme.subtitle,
                  marginVertical: 1.5,
                  alignSelf: 'flex-start',
                  marginLeft: 16,
                  borderRadius: 999,
                }}
              />
              <View
                style={{
                  height: 3,
                  width: 3,
                  backgroundColor: theme.subtitle,
                  marginVertical: 1.5,
                  alignSelf: 'flex-start',
                  marginLeft: 16,
                  borderRadius: 999,
                }}
              />

              {/* End */}
              <SuggestionInput
                outputName={'end'}
                location={endLocation}
                onFocus={() => {
                  if (endLocation?.type === PlaceType.MY_LOCATION)
                    setEndLocation(null);
                }}
                icon={
                  endLocation?.type === PlaceType.MY_LOCATION ? (
                    <MaterialCommunityIcons
                      name="crosshairs-gps"
                      size={24}
                      color={theme.myLocation}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={24}
                      color={theme.subtitle}
                    />
                  )
                }
                setSuggestionLoading={setSearchSuggestionsLoading}
              />
            </View>

            {/* Swap Endpoints */}
            <TouchableOpacity
              style={{ marginLeft: 8 }}
              onPress={() => {
                const temp = startLocation;
                setStartLocation(endLocation);
                setEndLocation(temp);
                setSuggesionOutput(null);
              }}
            >
              <MaterialCommunityIcons
                name="swap-vertical"
                size={28}
                color={theme.subtitle}
              />
            </TouchableOpacity>
          </View>

          {/* Leave by/Arrive By */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginVertical: 12,
              paddingHorizontal: 16,
            }}
          >
            <SegmentedControl
              values={['Leave by', 'Arrive by']}
              selectedIndex={segmentedIndex}
              onChange={(event) => {
                setSegmentedIndex(event.nativeEvent.selectedSegmentIndex);
                setDeadline(
                  event.nativeEvent.selectedSegmentIndex === 0
                    ? 'leave'
                    : 'arrive',
                );
              }}
              style={{ flex: 1, marginRight: 8 }}
              backgroundColor={
                Platform.OS === 'android'
                  ? theme.androidSegmentedBackground
                  : undefined
              }
            />

            <TimeInput
              onTimeChange={(time) => setTime(time)}
              onTimeInputFocused={toggleTimeInputFocused}
            />
          </View>

          {/* Divider */}
          <View
            style={{ height: 1, backgroundColor: theme.divider, marginTop: 4 }}
          />

          {/* Error */}
          {routeInfoError !== '' && (
            <View
              style={{
                marginTop: 8,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* Error Text */}
              <Text
                style={{
                  color: theme.subtitle,
                  textAlign: 'center',
                  marginLeft: 4,
                  paddingHorizontal: 24,
                }}
              >
                {routeInfoError}
              </Text>

              {routeInfoError ===
                'Location Unavailable, enable location in Settings.' && (
                <Button
                  title="Open Settings"
                  onPress={() => Linking.openSettings()}
                />
              )}
            </View>
          )}
        </View>
      </View>

      {/* Flat lists when no error */}
      {routeInfoError === '' &&
        (suggestionOutput ? (
          /* Search Suggestions */
          <BottomSheetFlatList
            data={searchSuggestions}
            keyExtractor={(_, index) => index.toString()}
            keyboardShouldPersistTaps={'handled'}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  height: 1,
                  backgroundColor: theme.divider,
                  marginLeft: 12,
                }}
              />
            )}
            ListHeaderComponent={() => {
              if (
                searchSuggestions.length === 0 &&
                suggestionOutput &&
                !searchSuggestionsLoading
              ) {
                return (
                  <View
                    style={{
                      padding: 16,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{ color: theme.subtitle, textAlign: 'center' }}
                    >
                      No locations found
                    </Text>
                  </View>
                );
              }
              return null;
            }}
            onScrollBeginDrag={() => Keyboard.dismiss()}
            renderItem={({ item: suggestion }) => (
              <TouchableOpacity
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onPress={() => {
                  if (suggestionOutput === 'start')
                    setStartLocation(suggestion);
                  if (suggestionOutput === 'end') setEndLocation(suggestion);
                  setSuggestions([]);
                  setSuggesionOutput(null);
                  Keyboard.dismiss();
                }}
              >
                <View
                  style={{
                    backgroundColor: theme.tertiaryBackground,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 40,
                    width: 40,
                    paddingVertical: 2,
                  }}
                >
                  {suggestion.type === PlaceType.MY_LOCATION && (
                    <MaterialCommunityIcons
                      name="crosshairs-gps"
                      size={24}
                      color={theme.myLocation}
                    />
                  )}
                  {suggestion.type === 'stop' && (
                    <MaterialCommunityIcons
                      name="bus-stop"
                      size={24}
                      color={theme.subtitle}
                    />
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  {/* Title */}
                  <Text
                    style={{
                      color: theme.text,
                      fontSize: 16,
                      fontWeight: 'bold',
                    }}
                  >
                    {suggestion.name}
                  </Text>

                  {/* Description */}
                  {suggestion.description && (
                    <Text style={{ color: theme.subtitle, fontSize: 14 }}>
                      {suggestion.description}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        ) : tripPlanLoading || isError ? (
          // Show the Route Options
          <View>
            {tripPlanLoading && !isError && (
              <View
                style={{
                  padding: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <ActivityIndicator />
              </View>
            )}

            {isError && (
              <View
                style={{
                  padding: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: theme.subtitle, textAlign: 'center' }}>
                  Unable to load routes. Please try again later.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <BottomSheetFlatList
            // filter out plans that have already passed, sort by end time
            data={tripPlan
              ?.filter(
                (plan) => plan.startTime > Math.floor(Date.now() / 1000) - 300,
              )
              .sort((a, b) => a.endTime - b.endTime)}
            keyExtractor={(_, index) => index.toString()}
            onRefresh={async () => {
              await client.invalidateQueries({
                queryKey: [
                  'tripPlan',
                  startLocation,
                  endLocation,
                  time,
                  deadline,
                ],
              });
              setSuggestions([]);
            }}
            refreshing={tripPlanLoading}
            keyboardShouldPersistTaps={'handled'}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  height: 1,
                  backgroundColor: theme.divider,
                  marginLeft: 12,
                }}
              />
            )}
            ListHeaderComponent={() => {
              const filtered =
                tripPlan?.filter(
                  (plan) =>
                    plan.startTime > Math.floor(Date.now() / 1000) - 300,
                ) ?? [];
              if (
                filtered.length === 0 &&
                !tripPlanLoading &&
                startLocation &&
                endLocation
              ) {
                return (
                  <View
                    style={{
                      padding: 16,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{ color: theme.subtitle, textAlign: 'center' }}
                    >
                      No routes found
                    </Text>
                  </View>
                );
              }
              return null;
            }}
            onScrollBeginDrag={() => Keyboard.dismiss()}
            renderItem={({ item: plan }) => {
              return <TripPlanCell plan={plan} />;
            }}
          />
        ))}
    </BaseSheet>
  );
};

export default memo(InputRoute);
