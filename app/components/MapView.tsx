import React, { useEffect, useRef, useState } from "react";
import MapView, { LatLng, Polyline, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { TouchableOpacity, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import StopCallout from "./callouts/StopCallout";
import BusCallout from "./callouts/BusCallout";
import BusMapIcon from "./callouts/BusMapIcon";

import useAppStore from "../stores/useAppStore";

const Index: React.FC = () => {
    const mapViewRef = useRef<MapView>(null);

    const selectedRoute = useAppStore((state) => state.selectedRoute);
    const drawnRoutes = useAppStore((state) => state.drawnRoutes);
    const selectedRouteCategory = useAppStore((state) => state.selectedRouteCategory);

    const [isViewCenteredOnUser, setIsViewCenteredOnUser] = useState(false);

    const [buses, _] = useState<any[]>([]);

    const defaultMapRegion: Region = {
        latitude: selectedRouteCategory === "Off Campus" ? 30.5987 : 30.6060,
        longitude: selectedRouteCategory === "Off Campus" ? -96.3959 : -96.3462,
        latitudeDelta: selectedRouteCategory === "Off Campus" ? 0.4 : 0.08,
        longitudeDelta: selectedRouteCategory === "Off Campus" ? 0.4 : 0.01
    };

    // If the user toggles between on-campus and off-campus routes, adjust the zoom level of the map
    useEffect(() => {
        centerViewOnRoutes();
    }, [drawnRoutes]);

    // handle weird edge case where map does not pick up on the initial region
    useEffect(() => {
        mapViewRef.current?.animateToRegion(defaultMapRegion);
    }, []);

    // given a hex code without the #, return a lighter version of it
    function getLighterColor(color: string) {
        // remove the # from the beginning of the color
        color = color.substring(1);

        // Parse the color components from the input string
        const r = parseInt(color.substring(0, 2), 16);
        const g = parseInt(color.substring(2, 4), 16);
        const b = parseInt(color.substring(4, 6), 16);
    
        // Increase the brightness of each color component
        const lightenedR = Math.min(r + 100, 255);
        const lightenedG = Math.min(g + 100, 255);
        const lightenedB = Math.min(b + 100, 255);
    
        // Convert the lightened color components back to a hex string
        const lightenedColor = (
            lightenedR.toString(16).padStart(2, '0') +
            lightenedG.toString(16).padStart(2, '0') +
            lightenedB.toString(16).padStart(2, '0')
        );
    
        return "#" + lightenedColor;
    }

    // TODO: When the user clicks on a route, zoom so that the route path is clearly visible
    const centerViewOnRoutes = () => {
        var coords: LatLng[] = [];

        if (selectedRoute) {
            selectedRoute.patternPaths.forEach((path: any) => {
                path.patternPoints.forEach((point: any) => {
                    coords.push({
                        latitude: point.latitude,
                        longitude: point.longitude
                    });
                });
            });
        }

        drawnRoutes.forEach((route) => {
            route.patternPaths.forEach((path: any) => {
                path.patternPoints.forEach((point: any) => {
                    coords.push({
                        latitude: point.latitude,
                        longitude: point.longitude
                    });
                })
            })
        });

        mapViewRef.current?.fitToCoordinates(coords, {
            edgePadding: {
                top: 50,
                right: 20 ,
                bottom: 300,
                left: 20
            },
            animated: true
        });

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
        if(isViewCenteredOnUser) {
            mapViewRef.current?.animateToRegion(defaultMapRegion, 250);

            setIsViewCenteredOnUser(false);
        }

        setIsViewCenteredOnUser(true);
        centerViewOnUser();
    }

    return (
        <MapView showsUserLocation={true} style={{ width: "100%", height: "100%" }} ref={mapViewRef} rotateEnabled={false} initialRegion={defaultMapRegion} onPanDrag={() => setIsViewCenteredOnUser(false)}>
            <SafeAreaInsetsContext.Consumer>
                {(insets) => (
                    <TouchableOpacity style={{ top: insets!.top + 16, alignContent: 'center', justifyContent: 'center', position: 'absolute', right: 8, overflow: 'hidden', borderRadius: 8, backgroundColor: 'white', padding: 12 }} onPress={() => recenterView()}>
                        {isViewCenteredOnUser ? 
                            <MaterialIcons name="my-location" size={24} color="gray" /> 
                        : 
                            <MaterialIcons name="location-searching" size={24} color="gray" />
                        }
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

            {selectedRoute && selectedRoute?.patternPaths.flatMap((patternPath, index1) => (
                patternPath.patternPoints.map((patternPoint, index2) => {
                    if (patternPoint.stop) {
                        const lineColor = selectedRoute?.directionList[0]?.lineColor ?? "#FFFF";

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
                                        borderColor: getLighterColor(lineColor),
                                    }}
                                />
                                <StopCallout
                                    stopName={patternPoint.stop.name}
                                    tintColor={lineColor}
                                    routeName={selectedRoute?.shortName ?? ""}
                                />
                            </Marker>
                        );
                    }

                    return null;
                })
            ))}

            {/* Buses */}
            {buses.map((bus) => {
                return (
                    <Marker
                        key={bus.key}
                        coordinate={{ latitude: bus.location.latitude, longitude: bus.location.longitude }}
                    >
                        {/* Bus Icon on Map*/}
                        <BusMapIcon color={selectedRoute!.directionList[0]?.lineColor ?? "#000"} heading={bus.location.heading} />
                        <BusCallout bus={bus} tintColor={selectedRoute!.directionList[0]?.lineColor ?? "#000"} routeName={selectedRoute!.shortName} />
                    </Marker>
                )
            })}
        </MapView>
    )
}

export default Index;