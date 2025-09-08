import { SheetProps } from '@data/utils/utils';
import {
  FontAwesome,
  FontAwesome6,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import SegmentedControl, {
  NativeSegmentedControlIOSChangeEvent,
} from '@react-native-segmented-control/segmented-control';
import React, { memo, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  NativeSyntheticEvent,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { appLogger } from '@data/utils/logger';
import useAppStore from 'src/data/app_state';
import { Route } from 'src/data/datatypes';
import { useRoutes } from 'src/data/queries/app';
import {
  useDefaultRouteGroup,
  useFavorites,
} from 'src/data/queries/structure/storage';
import { Sheets, useSheetController } from '../providers/sheet-controller';
import BusIcon from '../ui/BusIcon';
import IconPill from '../ui/IconPill';
import SheetHeader from '../ui/SheetHeader';

// Display routes list for all routes and favorite routes
const RoutesList: React.FC<SheetProps> = ({ sheetRef }) => {
  const snapPoints = ['25%', '45%', '85%'];
  const [snap, setSnap] = useState(1);

  const setSelectedRoute = useAppStore((state) => state.setSelectedRoute);
  const selectedRouteCategory = useAppStore(
    (state) => state.selectedRouteCategory,
  );
  const setSelectedRouteCategory = useAppStore(
    (state) => state.setSelectedRouteCategory,
  );
  const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);
  const theme = useAppStore((state) => state.theme);
  const { presentSheet } = useSheetController();

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

  const handleRouteSelected = (selectedRoute: Route) => {
    appLogger.i(`Route selected from list: ${selectedRoute.routeCode} - ${selectedRoute.name}`);
    setSelectedRoute(selectedRoute);
    setDrawnRoutes([selectedRoute]);
    presentSheet(Sheets.ROUTE_DETAILS);
  };

  function filterRoutes(): Route[] {
    if (!routes) return [];

    switch (selectedRouteCategory) {
      case 'All Routes':
        return routes;
      case 'Gameday':
        return routes.filter((route) => route.name.includes('Gameday'));
      case 'Favorites':
        return favorites ?? [];
    }
  }

  useEffect(() => {
    setSelectedRouteCategory(defaultGroup === 0 ? 'All Routes' : 'Favorites');
  }, [defaultGroup]);

  // Update the shown routes when the selectedRouteCategory changes
  useEffect(() => {
    const filteredRoutes = filterRoutes();
    setDrawnRoutes(filteredRoutes);
  }, [selectedRouteCategory, routes, favorites]);

  // Update the favorites when the view is focused
  function onAnimate(from: number, to: number) {
    setSnap(to);
    if (from === -1) {
      refetchDefaultGroup();
      if (favorites) refetchFavorites();

      setDrawnRoutes(filterRoutes());
    }
  }

  function getRouteCategories(): ('All Routes' | 'Gameday' | 'Favorites')[] {
    // if gameday routes are available
    if (routes && routes.some((element) => element.name.includes('Gameday'))) {
      return ['All Routes', 'Gameday', 'Favorites'];
    }

    return ['All Routes', 'Favorites'];
  }

  function androidHandleDismss(to: number) {
    if (to !== -1) {
      refetchDefaultGroup();
      if (favorites) refetchFavorites();

      setDrawnRoutes(filterRoutes());
    }
  }

  const handleSetSelectedRouteCategory = (
    evt: NativeSyntheticEvent<NativeSegmentedControlIOSChangeEvent>,
  ) => {
    setSelectedRouteCategory(
      getRouteCategories()[evt.nativeEvent.selectedSegmentIndex] ??
      'All Routes',
    );
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      index={snap}
      enableDismissOnClose={false}
      enablePanDownToClose={false}
      enableDynamicSizing={false}
      onAnimate={onAnimate}
      onChange={Platform.OS === 'android' ? androidHandleDismss : undefined}
      backgroundStyle={{ backgroundColor: theme.background }}
      handleIndicatorStyle={{ backgroundColor: theme.divider }}
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
          values={getRouteCategories()}
          selectedIndex={getRouteCategories().indexOf(selectedRouteCategory)}
          style={{ marginHorizontal: 16 }}
          backgroundColor={
            Platform.OS === 'android'
              ? theme.androidSegmentedBackground
              : undefined
          }
          onChange={handleSetSelectedRouteCategory}
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
        data={filterRoutes()}
        keyExtractor={(route: Route) => route.id}
        renderItem={({ item: route }) => {
          return (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 8,
              }}
              onPress={() => handleRouteSelected(route)}
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
                  {favorites?.some(
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
    </BottomSheetModal>
  );
};

export default memo(RoutesList);
