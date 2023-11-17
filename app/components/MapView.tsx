import React, { useEffect, useRef, useState } from "react";
import MapView, { LatLng, Polyline, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TouchableOpacity, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { getRouteBuses } from "aggie-spirit-api";

import StopCallout from "./callouts/StopCallout";
import BusCallout from "./callouts/BusCallout";
import { IBus, IBusRoute } from "utils/interfaces";
import { getLighterColor } from "../../utils/utils";
import BusMapIcon from "./callouts/BusMapIcon";

interface Props {
    drawnRoutes: IBusRoute[]
}

const Index: React.FC<Props> = ({ drawnRoutes }) => {
    let mapViewRef: any;

    const [buses, setBuses] = useState<IBus[]>([])

    const updateBusesInterval = useRef<any>(null);

    const updateBuses = async (routeName: string) => {
        const data = await getRouteBuses(routeName);

        if (drawnRoutes.length == 1) { setBuses(data); }
    }

    const recenterView = async () => {
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();

        // Check if permission is granted
        if (status !== 'granted') { return };

        // Get current location
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, timeInterval: 2 });

        // Check if mapViewRef is available
        if (!mapViewRef) { return; }

        // Animate map to the current location
        const region = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02
        };

        mapViewRef.animateToRegion(region, 250);
    };


    useEffect(() => {
        const coords: LatLng[] = drawnRoutes.flatMap((route: IBusRoute) =>
            route.routeInfo.patternPaths.flatMap((path: any) =>
                path.patternPoints.map((point: { latitude: number; longitude: number }) => ({
                    latitude: point.latitude,
                    longitude: point.longitude
                }))
            )
        );

        // Fit the map to the extracted coordinates
        mapViewRef.fitToCoordinates(coords, {
            edgePadding: {
                top: 50,
                right: 20,
                bottom: 300,
                left: 20
            },
            animated: true
        });

        // Handle updating buses based on the number of drawn routes
        if (drawnRoutes.length === 1 && drawnRoutes[0]?.shortName) {
            const shortName = drawnRoutes[0]?.shortName;

            // Update the buses initially
            updateBuses(shortName);

            // Set up interval to update buses every 5 seconds
            updateBusesInterval.current = setInterval(async () => {
                updateBuses(shortName);
            }, 5000);
        } else {
            // Clear the interval and reset the buses if there are no drawn routes or more than one
            clearInterval(updateBusesInterval.current);
            setBuses([]);
        }

        // Cleanup when the component is unmounted
        return () => { clearInterval(updateBusesInterval.current); };
    }, [drawnRoutes]);

    return (
        <MapView showsUserLocation={true} style={{ width: "100%", height: "100%" }} ref={(mapView) => { mapViewRef = mapView; }} rotateEnabled={false} >
            <SafeAreaInsetsContext.Consumer>
                {(insets) => (
                    <TouchableOpacity style={{ top: insets!.top + 16, alignContent: 'center', justifyContent: 'center', position: 'absolute', right: 8, overflow: 'hidden', borderRadius: 8 }} onPress={() => recenterView()}>
                        <Ionicons name="navigate" size={24} color="gray" />
                    </TouchableOpacity>
                )}
            </SafeAreaInsetsContext.Consumer>

            {/* Route Polylines */}
            {drawnRoutes.map(function (drawnRoute: any) {
                const coords: LatLng[] = [];

                drawnRoute.routeInfo.patternPaths.forEach((path: any) => {
                    path.patternPoints.forEach((point: any) => {
                        coords.push({
                            latitude: point.latitude,
                            longitude: point.longitude
                        })
                    })
                })

                return (
                    <Polyline key={drawnRoute.key} coordinates={coords} strokeColor={"#" + drawnRoute.routeInfo.color} strokeWidth={6} />
                )
            })}

            {/* Single Route Stops */}
            {drawnRoutes.length === 1 &&
                drawnRoutes[0]?.routeInfo.patternPaths.flatMap((path) =>
                    path.patternPoints
                        .filter((point) => point.isStop)
                        .map((point) => (
                            <Marker
                                key={point.key}
                                coordinate={{
                                    latitude: point.latitude,
                                    longitude: point.longitude
                                }}
                            >
                                <View
                                    style={{
                                        width: 16,
                                        height: 16,
                                        borderWidth: 2,
                                        borderRadius: point.isTimePoint ? 0 : 9999,
                                        backgroundColor: `#${drawnRoutes[0]?.routeInfo.color}`,
                                        borderColor: `#${getLighterColor(drawnRoutes[0]?.routeInfo.color ?? "0000")}`
                                    }}
                                />
                                <StopCallout stopName={point.name} tintColor={drawnRoutes[0]?.routeInfo.color ?? "0000"} routeName={drawnRoutes[0]?.shortName ?? ""} />
                            </Marker>
                        ))
                )}

            {/* Buses */}
            {buses.map((bus) => {
                return (
                    <Marker
                        key={bus.key}
                        coordinate={{ latitude: bus.location.latitude, longitude: bus.location.longitude }}
                    >
                        {/* Bus Icon on Map*/}
                        <BusMapIcon color={drawnRoutes[0]!.routeInfo.color} heading={bus.location.heading} />
                        <BusCallout bus={bus} tintColor={drawnRoutes[0]!.routeInfo.color} routeName={drawnRoutes[0]!.shortName} />
                    </Marker>
                )
            })}
        </MapView>
    )
}

export default Index;