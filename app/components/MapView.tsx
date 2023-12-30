import React, { useEffect, useRef, useState } from "react";
import MapView, { LatLng, Polyline, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';
import Fontisto from "@expo/vector-icons/Fontisto";
import { TouchableOpacity, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { getRouteBuses } from "aggie-spirit-api";

import StopCallout from "./callouts/StopCallout";
import BusCallout from "./callouts/BusCallout";
import { IBus } from "utils/interfaces";
import { getLighterColor } from "../../utils/utils";
import BusMapIcon from "./callouts/BusMapIcon";

import useAppStore from "../stores/useAppStore";


const Index: React.FC = () => {
    const mapViewRef = useRef<MapView>(null);
    const [mapRenderCount, setMapRenderCount] = useState(0);

    const selectedRouteCategory = useAppStore((state) => state.selectedRouteCategory);
    const drawnRoutes = useAppStore((state) => state.drawnRoutes);

    const [isViewCenteredOnUser, setIsViewCenteredOnUser] = useState(false);

    const [buses, setBuses] = useState<IBus[]>([])

    const updateBusesInterval = useRef<any>(null);

    const defaultOnCampusRegion = {
        latitude: 30.6060,
        longitude: -96.3462,
        latitudeDelta: 0.08,
        longitudeDelta: 0.01
    };

    const defaultOffCampusRegion = {
        latitude: 30.5987,
        longitude: -96.3959,
        latitudeDelta: 0.4,
        longitudeDelta: 0.04
    }

    const routeSelectedRegion = {
        latitude: drawnRoutes[0]?.patternPaths[0]?.patternPoints[0]?.latitude ?? 30.6060,
        longitude: drawnRoutes[0]?.patternPaths[0]?.patternPoints[0]?.longitude ?? -96.3462,
        latitudeDelta: 0.05,
        longitudeDelta: 0.01
    }

    // Initially, React-Native-Maps renders the map at a default region. To ensure it starts at the intended location, we adjust the region programmatically.
    // This useEffect monitors the map's render count to prevent unintentional interference with user-initiated zoom operations.
    // After the first two renders to set the correct region, subsequent calls to 'centerViewOnRoutes' are disregarded.
    useEffect(() => {
        if (mapRenderCount < 2) {
            centerViewOnRoutes();

            setMapRenderCount(mapRenderCount + 1);
        }
    });

    // If the user toggles between on-campus and off-campus routes, adjust the zoom level of the map
    useEffect(() => {
        centerViewOnRoutes();
    }, [drawnRoutes])

    const updateBuses = async (routeName: string) => {
        const data = await getRouteBuses(routeName);

        if (drawnRoutes.length == 1) { setBuses(data); }
    }

    // TODO: When the user clicks on a route, zoom so that the route path is clearly visible
    const centerViewOnRoutes = () => {
        let region;

        if(drawnRoutes.length === 1) {
            region = routeSelectedRegion;
        } else if (selectedRouteCategory === "Off Campus") {
            region = defaultOffCampusRegion;
        } else {
            region = defaultOnCampusRegion;
        }

        mapViewRef.current?.animateToRegion(region, 250);

        setIsViewCenteredOnUser(false);
    }

    const centerViewOnUser = async () => {
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync()

        // Check if permission is granted
        if (status !== 'granted') { return };

        // Get current location
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, timeInterval: 2 });

        // Animate map to the current location
        const region = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005
        };

        mapViewRef.current?.animateToRegion(region, 250);

        setIsViewCenteredOnUser(true);
    }

    const recenterView = async () => {
        if (isViewCenteredOnUser) {
            centerViewOnRoutes();

            return
        }

        centerViewOnUser();
    }

    // useEffect(() => {
    //     const coords: LatLng[] = drawnRoutes.flatMap((route: IBusRoute) =>
    //         route.routeInfo.patternPaths.flatMap((path: any) =>
    //             path.patternPoints.map((point: { latitude: number; longitude: number }) => ({
    //                 latitude: point.latitude,
    //                 longitude: point.longitude
    //             }))
    //         )
    //     );

    //     // Fit the map to the extracted coordinates
    //     mapViewRef.current?.fitToCoordinates(coords, {
    //         edgePadding: {
    //             top: 50,
    //             right: 20,
    //             bottom: 300,
    //             left: 20
    //         },
    //         animated: true
    //     });

    //     // Handle updating buses based on the number of drawn routes
    //     if (drawnRoutes.length === 1 && drawnRoutes[0]?.shortName) {
    //         const shortName = drawnRoutes[0]?.shortName;

    //         // Update the buses initially
    //         updateBuses(shortName);

    //         // Set up interval to update buses every 5 seconds
    //         updateBusesInterval.current = setInterval(async () => {
    //             updateBuses(shortName);
    //         }, 5000);
    //     } else {
    //         // Clear the interval and reset the buses if there are no drawn routes or more than one
    //         clearInterval(updateBusesInterval.current);
    //         setBuses([]);
    //     }

    //     // Cleanup when the component is unmounted
    //     return () => { clearInterval(updateBusesInterval.current); };
    // }, [drawnRoutes]);

    return (
        <MapView showsUserLocation={true} style={{ width: "100%", height: "100%" }} ref={mapViewRef} rotateEnabled={false} >
            <SafeAreaInsetsContext.Consumer>
                {(insets) => (
                    <TouchableOpacity style={{ top: insets!.top + 16, alignContent: 'center', justifyContent: 'center', position: 'absolute', right: 8, overflow: 'hidden', borderRadius: 8, backgroundColor: 'white', padding: 12 }} onPress={() => recenterView()}>
                        {isViewCenteredOnUser ? (<Fontisto name="zoom-minus" size={24} color="gray" />) : (<Ionicons name="navigate" size={24} color="gray" />)}
                    </TouchableOpacity>
                )}
            </SafeAreaInsetsContext.Consumer>

            {/* Route Polylines */}
            {drawnRoutes.map(function (drawnRoute) {
                const coords: LatLng[] = [];

                const lineColor = drawnRoute.directionList[0]?.lineColor;

                drawnRoute.patternPaths.forEach((path: any) => {
                    path.patternPoints.forEach((point: any) => {
                        coords.push({
                            latitude: point.latitude,
                            longitude: point.longitude
                        })
                    })
                })

                return (
                    <Polyline key={drawnRoute.key} coordinates={coords} strokeColor={lineColor} strokeWidth={6} />
                )
            })}

{ drawnRoutes.length === 1 && drawnRoutes[0]?.patternPaths.flatMap((patternPath, index1) => (
    patternPath.patternPoints.map((patternPoint, index2) => {
        if (patternPoint.stop) {
            const lineColor = drawnRoutes[0]?.directionList[0]?.lineColor ?? "#FFFF";
            const lighterColor = getLighterColor(lineColor);
            
            return (
                <Marker
                    key={`${index1}-${index2}`}
                    coordinate={{
                        latitude: patternPoint.latitude,
                        longitude: patternPoint.longitude
                    }}
                >
                    <View
                        style={{
                            width: 16,
                            height: 16,
                            borderWidth: 2,
                            borderRadius: 9999,
                            backgroundColor: lineColor,
                            borderColor: lighterColor
                        }}
                    />
                    <StopCallout 
                        stopName={patternPoint.stop.name} 
                        tintColor={lineColor} 
                        routeName={drawnRoutes[0]?.shortName ?? ""} 
                    />
                </Marker>
            );
        }

        return null;
    })
)) }


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