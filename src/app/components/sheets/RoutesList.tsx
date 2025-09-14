import { SegmentedControlEvent } from '@data/utils/utils';
import {
  FontAwesome,
  FontAwesome6,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import React, { memo, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import useAppStore from '@data/state/app_state';
import { useTheme } from '@data/state/utils';
import { Route } from '@data/types';
import { appLogger } from '@data/utils/logger';
import { useRoutes } from 'src/data/queries/app';
import {
  useDefaultRouteGroup,
  useFavorites,
} from 'src/data/queries/structure/storage';
import { Sheets, useSheetController } from '../providers/sheet-controller';
import BusIcon from '../ui/BusIcon';
import IconPill from '../ui/IconPill';
import SheetHeader from '../ui/SheetHeader';
import BaseSheet, { SheetProps } from './BaseSheet';

// Display routes list for all routes and favorite routes
const RoutesList: React.FC<SheetProps> = ({ sheetRef }) => {
  const snapPoints = ['25%', '45%', '85%'];

  const { presentSheet } = useSheetController();
  const selectedAlert = useAppStore((state) => state.selectedAlert);
  const setSelectedRoute = useAppStore((state) => state.setSelectedRoute);
  const selectedRoute = useAppStore((state) => state.selectedRoute);
  const selectedRouteCategory = useAppStore(
    (state) => state.selectedRouteCategory,
  );
  const setSelectedRouteCategory = useAppStore(
    (state) => state.setSelectedRouteCategory,
  );
  const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);
  const theme = useTheme();

  // Queries
  const {
    data: routes,
    isLoading: isRoutesLoading,
    isError: routeError,
  } = useRoutes();

  const {
    data: favorites,
    isLoading: isFavoritesLoading,
    isError: isFavoritesError,
    refetch: refetchFavorites,
  } = useFavorites();

  const { data: defaultGroup, refetch: refetchDefaultGroup } =
    useDefaultRouteGroup();

  const selectRoute = (selectedRoute: Route) => {
    appLogger.i(
      `Route selected from list: ${selectedRoute.routeCode} - ${selectedRoute.name}`,
    );
    setSelectedRoute(selectedRoute);
    setDrawnRoutes([selectedRoute]);
    presentSheet(Sheets.ROUTE_DETAILS);
  };

  const filteredRoutes = useMemo(() => {
    if (!routes) return [];

    switch (selectedRouteCategory) {
      case 'All Routes':
        return routes;
      case 'Gameday':
        return routes.filter((route) => route.name.includes('Gameday'));
      case 'Favorites':
        return favorites ?? [];
    }
  }, [selectedRouteCategory, routes, favorites]);

  type RouteCategory = 'All Routes' | 'Gameday' | 'Favorites';
  const routeCategories = useMemo<RouteCategory[]>(() => {
    if (routes && routes.some((element) => element.name.includes('Gameday'))) {
      return ['All Routes', 'Gameday', 'Favorites'];
    }

    return ['All Routes', 'Favorites'];
  }, [routes]);

  useEffect(() => {
    setSelectedRouteCategory(defaultGroup === 0 ? 'All Routes' : 'Favorites');
  }, [defaultGroup]);

  // only update the map if we have routes
  // and there is no selected route (route details handles state)
  useEffect(updateDrawnRoutes, [filteredRoutes, selectedRoute]);

  const setCategory = (evt: SegmentedControlEvent) => {
    setSelectedRouteCategory(
      routeCategories[evt.nativeEvent.selectedSegmentIndex] ?? 'All Routes',
    );
  };

  function updateDrawnRoutes() {
    if (!routes || selectedRoute || selectedAlert) return;
    setDrawnRoutes(filteredRoutes);
  }

  async function onPresent() {
    await refetchDefaultGroup();
    await refetchFavorites();

    appLogger.i('Refetched route groups and favorites on sheet present');
  }

  return (
    <BaseSheet
      sheetRef={sheetRef}
      snapPoints={snapPoints}
      initialSnapIndex={1}
      enableDismissOnClose={false}
      enableGestureClose={false}
      sheetKey={Sheets.ROUTE_LIST}
      onPresent={onPresent}
      onSnap={updateDrawnRoutes}
    >
      <View>
        <SheetHeader
          title="Routes"
          icon={
            <View style={{ flexDirection: 'row', alignContent: 'center' }}>
              {/* Route Planning */}
              <TouchableOpacity
                onPress={() => presentSheet(Sheets.INPUT_ROUTE)}
              >
                <IconPill
                  icon={
                    <FontAwesome6
                      name="diamond-turn-right"
                      size={16}
                      color={theme.text}
                    />
                  }
                  text="Plan Route"
                />
              </TouchableOpacity>

              {/* Settings */}
              <TouchableOpacity
                style={{ marginLeft: 8 }}
                onPress={() => presentSheet(Sheets.SETTINGS)}
              >
                <IconPill
                  icon={
                    <MaterialIcons
                      name="settings"
                      size={16}
                      color={theme.text}
                    />
                  }
                />
              </TouchableOpacity>
            </View>
          }
        />

        <SegmentedControl
          values={routeCategories}
          selectedIndex={routeCategories.indexOf(selectedRouteCategory)}
          style={{ marginHorizontal: 16 }}
          backgroundColor={
            Platform.OS === 'android'
              ? theme.androidSegmentedBackground
              : undefined
          }
          onChange={setCategory}
        />
        <View
          style={{ height: 1, backgroundColor: theme.divider, marginTop: 8 }}
        />

        {!isFavoritesLoading &&
          selectedRouteCategory === 'Favorites' &&
          favorites?.length === 0 &&
          routes?.length !== 0 && (
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <Text style={{ color: theme.text }}>
                You don't have any favorite routes.
              </Text>
            </View>
          )}

        {/* Loading indicatior, only show if no error and either loading or there are no routes */}
        {!routeError && (isRoutesLoading || !routes) && (
          <ActivityIndicator style={{ marginTop: 12 }} />
        )}

        {/* Error */}
        {routeError ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <Text style={{ color: theme.subtitle }}>
              Error loading routes. Please try again later.
            </Text>
          </View>
        ) : (
          isFavoritesError &&
          selectedRouteCategory === 'Favorites' && (
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <Text style={{ color: theme.subtitle }}>
                Error loading favorites. Please try again later.
              </Text>
            </View>
          )
        )}
      </View>

      <BottomSheetFlatList
        contentContainerStyle={{
          paddingBottom: 35,
          paddingTop: 4,
          marginLeft: 16,
        }}
        data={filteredRoutes}
        keyExtractor={(route: Route) => route.id}
        renderItem={({ item: route }) => {
          return (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 8,
              }}
              onPress={() => selectRoute(route)}
            >
              <BusIcon
                name={route.routeCode}
                color={route.tintColor ?? '#000'}
                style={{ marginRight: 12 }}
              />
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    style={{
                      fontWeight: 'bold',
                      fontSize: 20,
                      lineHeight: 28,
                      color: theme.text,
                    }}
                  >
                    {route.name}
                  </Text>
                  {favorites?.find(
                    (fav) => fav.routeCode === route.routeCode,
                  ) && (
                    <FontAwesome
                      name="star"
                      size={16}
                      color={theme.starColor}
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </View>
                {route.directions.length === 2 ? (
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Text style={{ color: theme.text }}>
                      {route.directions[0].name}
                    </Text>
                    <MaterialCommunityIcons
                      name="arrow-left-right"
                      size={12}
                      color={theme.text}
                    />
                    <Text style={{ color: theme.text }}>
                      {route.directions[1].name}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ color: theme.text }}>Campus Circulator</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </BaseSheet>
  );
};

export default memo(RoutesList);
