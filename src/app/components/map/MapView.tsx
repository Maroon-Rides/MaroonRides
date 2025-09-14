import useAppStore from '@data/state/app_state';
import { useTheme } from '@data/state/utils';
import { Direction, Route } from '@data/types';
import { defaultMapRegion } from '@data/utils/geo';
import { appLogger } from '@data/utils/logger';
import { processRoutePlanMapComponents } from '@data/utils/route-planning';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Platform, TouchableOpacity, View } from 'react-native';
import MapView, { LatLng, Polyline } from 'react-native-maps';
import { DarkGoogleMaps } from 'src/app/theme';
import { useVehicles } from 'src/data/queries/app';
import { Sheets, useSheetController } from '../providers/sheet-controller';
import BusMarker from './markers/BusMarker';
import RoutePlanMarker from './markers/RoutePlanMarker';
import StopMarker from './markers/StopMarker';

const RouteMap: React.FC = () => {
  const mapViewRef = useRef<MapView>(null);
  const setSelectedDirection = useAppStore(
    (state) => state.setSelectedDirection,
  );
  const selectedRoute = useAppStore((state) => state.selectedRoute);
  const setSelectedRoute = useAppStore((state) => state.setSelectedRoute);
  const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);
  const drawnRoutes = useAppStore((state) => state.drawnRoutes);
  const setZoomToStopLatLng = useAppStore((state) => state.setZoomToStopLatLng);
  const selectedDirection = useAppStore((state) => state.selectedDirection);
  const theme = useTheme();
  const poppedUpStopCallout = useAppStore((state) => state.poppedUpStopCallout);
  const [isViewCenteredOnUser, setIsViewCenteredOnUser] = useState(false);
  const { presentSheet } = useSheetController();

  const selectedRoutePlan = useAppStore((state) => state.selectedRoutePlan);
  const selectedRoutePlanPathPart = useAppStore(
    (state) => state.selectedRoutePlanPathPart,
  );
  const routePlanMapComponents = useMemo(() => {
    return processRoutePlanMapComponents(
      selectedRoutePlan,
      selectedRoutePlanPathPart,
    );
  }, [selectedRoutePlan, selectedRoutePlanPathPart]);

  const { data: buses } = useVehicles(selectedRoute);

  function selectRoute(route: Route, direction: Direction) {
    if (selectedDirection?.id !== direction.id) setSelectedDirection(direction);

    if (selectedRoute?.id === route.id) return;

    appLogger.i(`Route selected from map: ${route.routeCode} - ${route.name}`);
    setSelectedRoute(route);
    setDrawnRoutes([route]);
    presentSheet(Sheets.ROUTE_DETAILS);
  }

  // center the view on the drawn routes
  useEffect(() => {
    centerViewOnRoutes();
  }, [drawnRoutes, routePlanMapComponents.highlighted]);

  useEffect(() => {
    if (routePlanMapComponents.markers.length === 1) {
      void centerViewOnLocation(routePlanMapComponents.markers[0], 0.005);
    }
  }, [routePlanMapComponents.markers]);

  // handle weird edge case where map does not pick up on the initial region
  useEffect(() => {
    mapViewRef.current?.animateToRegion(defaultMapRegion);

    setZoomToStopLatLng(async (lat, lng) => {
      await centerViewOnLocation({ latitude: lat, longitude: lng }, 0.005);
    });
  }, []);

  function centerViewOnRoutes(routes?: LatLng[]) {
    const coords: LatLng[] = routes ?? [
      ...(selectedRoute?.bounds ?? []),
      ...(drawnRoutes?.flatMap((route) => route.bounds) ?? []),
      ...routePlanMapComponents.highlighted,
    ];

    if (coords.length > 0) {
      mapViewRef.current?.fitToCoordinates(coords, {
        edgePadding: {
          top: Dimensions.get('window').height * 0.05,
          right: 40,
          bottom: Dimensions.get('window').height * 0.45 + 8,
          left: 40,
        },
        animated: true,
      });
    }

    setIsViewCenteredOnUser(false);
  }

  async function centerViewOnLocation(location?: LatLng, delta = 0.01) {
    if (!location) {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();

      // Check if permission is granted
      if (status !== 'granted') {
        return;
      }

      // Get current location
      location = (
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 2,
        })
      ).coords;
    }

    // Animate map to the current location
    const region = {
      latitude: location.latitude - 0.002,
      longitude: location.longitude,
      latitudeDelta: delta,
      longitudeDelta: delta,
    };

    mapViewRef.current?.animateToRegion(region, 250);
    setIsViewCenteredOnUser(true);
  }

  return (
    <>
      <MapView
        showsUserLocation={true}
        style={{ width: '100%', height: '100%' }}
        ref={mapViewRef}
        rotateEnabled={false}
        region={defaultMapRegion}
        onPanDrag={() => setIsViewCenteredOnUser(false)}
        // this deprcation is ok, we only use it on android
        maxZoomLevel={Platform.OS === 'android' ? 18 : undefined}
        showsMyLocationButton={false} // we have our own
        // dark mode android map syling
        customMapStyle={
          Platform.OS === 'android' && theme.mode === 'dark'
            ? DarkGoogleMaps
            : []
        }
      >
        {/* Route Polylines */}
        {drawnRoutes.map((drawnRoute) => {
          return drawnRoute.directions.map((direction) => {
            const active =
              !selectedDirection || direction.id === selectedDirection.id;
            const tintColor = drawnRoute.tintColor + (active ? '' : '60');

            return (
              <Polyline
                key={`${direction.id}`}
                coordinates={direction.pathPoints}
                strokeColor={tintColor}
                strokeWidth={5}
                tappable={true}
                onPress={() => selectRoute(drawnRoute, direction)}
                style={{
                  zIndex: active ? 600 : 300,
                  elevation: active ? 600 : 300,
                }}
              />
            );
          });
        })}

        {/* Stops */}
        {selectedRoute?.directions.flatMap((direction) =>
          direction.stops.map((stop) => {
            // if it is the end of the route, dont put a marker
            if (stop.isLastOnDirection) return;

            return (
              <StopMarker
                key={`${stop.id}-${direction.id}`}
                stop={stop}
                tintColor={selectedRoute.tintColor}
                active={direction.id === selectedDirection?.id}
                route={selectedRoute}
                direction={direction}
                isCalloutShown={
                  poppedUpStopCallout?.id === stop.id &&
                  selectedDirection?.id === direction.id
                }
              />
            );
          }),
        )}

        {/* Route Plan Highlighted */}
        {selectedRoutePlan && (
          <Polyline
            key={'highlighted-route-plan'}
            coordinates={routePlanMapComponents.highlighted}
            strokeColor={theme.myLocation}
            strokeWidth={5}
          />
        )}

        {/* Route Plan Faded */}
        {selectedRoutePlan &&
          routePlanMapComponents.faded.map((path, index) => {
            return (
              <Polyline
                key={`faded-route-plan-${index}`}
                coordinates={path}
                strokeColor={theme.myLocation + '60'}
                strokeWidth={5}
              />
            );
          })}

        {/* Route Plan Markers */}
        {selectedRoutePlan &&
          routePlanMapComponents.markers.map((marker, index) => {
            return (
              <RoutePlanMarker
                key={`route-plan-marker-${index}`}
                marker={marker}
              />
            );
          })}

        {/* Buses */}
        {selectedRoute &&
          buses?.map((bus) => {
            return (
              <BusMarker
                key={`bus-marker-${bus.id}`}
                bus={bus}
                route={selectedRoute}
              />
            );
          })}
      </MapView>

      {/* map buttons */}
      <View
        style={{
          top: Platform.OS === 'ios' ? 60 : 20,
          alignContent: 'center',
          justifyContent: 'center',
          position: 'absolute',
          right: 8,
          overflow: 'hidden',
          borderRadius: 8,
          backgroundColor: theme.background,
          zIndex: 1000,
        }}
      >
        <TouchableOpacity
          onPress={() => centerViewOnLocation()}
          style={{ padding: 12 }}
        >
          <MaterialIcons
            name={isViewCenteredOnUser ? 'my-location' : 'location-searching'}
            size={24}
            color="gray"
          />
        </TouchableOpacity>
      </View>
    </>
  );
};

export default RouteMap;
