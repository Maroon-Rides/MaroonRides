import React, { useEffect, useRef, useState } from "react";
import { Alert, Dimensions, TouchableOpacity, View } from "react-native";
import MapView, { LatLng, Polyline, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getVehicles } from "aggie-spirit-api";

import { GetVehiclesResponseSchema, IGetVehiclesResponse, IMapRoute, IVehicle } from "../../utils/interfaces";
import StopCallout from "./callouts/StopCallout";
import BusCallout from "./callouts/BusCallout";
import BusMapIcon from "./callouts/BusMapIcon";
import useAppStore from "../stores/useAppStore";

const Index: React.FC = () => {
    const mapViewRef = useRef<MapView>(null);

    const authToken = useAppStore((state) => state.authToken);

    const selectedRoute = useAppStore((state) => state.selectedRoute);
    const setSelectedRoute = useAppStore((state) => state.setSelectedRoute);
    const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);
    const presentSheet = useAppStore((state) => state.presentSheet);
    const drawnRoutes = useAppStore((state) => state.drawnRoutes);

    const [isViewCenteredOnUser, setIsViewCenteredOnUser] = useState(false);

    const [buses, setBuses] = useState<IVehicle[]>([]);
    const updateBusesInterval = useRef<NodeJS.Timeout | null>(null);

    const defaultMapRegion: Region = {
        latitude: 30.6060,
        longitude: -96.3462,
        latitudeDelta: 0.10,
        longitudeDelta: 0.01
    };

    const updateBuses = async () => {
        if (!selectedRoute || !authToken) return

        let busesResponse: IGetVehiclesResponse
        try {
            busesResponse = await getVehicles([selectedRoute.key], authToken) as IGetVehiclesResponse;

            GetVehiclesResponseSchema.parse(busesResponse);
        } catch (error) {
            console.error(error);
            
            Alert.alert("Error while updating buses");

            return;
        }

        if (busesResponse.length == 0 || !busesResponse[0]?.vehiclesByDirections) {
            setBuses([])
            return
        }

        let extracted: IVehicle[] = []
        for (let direction of busesResponse[0]?.vehiclesByDirections) {
            for (let bus of direction.vehicles) {
                extracted.push(bus)
            }
        }

        setBuses(extracted)
    }
    
    function selectRoute(route: IMapRoute) {
        if (selectedRoute?.key === route.key) return;

        setSelectedRoute(route);
        setDrawnRoutes([route]);
        presentSheet("routeDetails");
    }

    // If the user toggles between on-campus and off-campus routes, adjust the zoom level of the map
    // Ignore if the mapRenderCount is less than 2 since it takes two renders to show the initial region
    useEffect(() => {
        console.log(drawnRoutes[0]?.shortName)
        centerViewOnRoutes();

        // Handle updating buses based on the number of drawn routes
        if (drawnRoutes.length === 1 && drawnRoutes[0]?.shortName) {

            // Update the buses initially
            updateBuses();

            // Set up interval to update buses every 5 seconds
            updateBusesInterval.current = setInterval(async () => {
                await updateBuses();
            }, 5000);
        } else {
            // Clear the interval and reset the buses if there are no drawn routes or more than one
            clearInterval(updateBusesInterval.current!);
            setBuses([]);
        }
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
        let coords: LatLng[] = [];

        if (selectedRoute) {
            selectedRoute.patternPaths.forEach((path) => {
                path.patternPoints.forEach((point) => {
                    coords.push({
                        latitude: point.latitude,
                        longitude: point.longitude
                    });
                });
            });
        }

        drawnRoutes.forEach((route) => {
            route.patternPaths.forEach((path) => {
                path.patternPoints.forEach((point) => {
                    coords.push({
                        latitude: point.latitude,
                        longitude: point.longitude
                    });
                })
            })
        });

        if (coords.length > 0) {
            mapViewRef.current?.fitToCoordinates(coords, {
                edgePadding: {
                    top: Dimensions.get("window").height * 0.05,
                    right: 20,
                    bottom: Dimensions.get("window").height * 0.45 + 8,
                    left: 20
                },
                animated: true
            });
        }

        setIsViewCenteredOnUser(false);
    }

    const recenterView = async () => {
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
            latitudeDelta: 0.01,
            longitudeDelta: 0.01
        };

        mapViewRef.current?.animateToRegion(region, 250);

        setIsViewCenteredOnUser(true);
    }

    return (
        <>
            <MapView showsUserLocation={true} style={{ width: "100%", height: "100%" }} ref={mapViewRef} rotateEnabled={false} initialRegion={defaultMapRegion} onPanDrag={() => setIsViewCenteredOnUser(false)}>
                {/* Route Polylines */}
                {drawnRoutes.map(function (drawnRoute) {
                    const coords: LatLng[] = [];

                    const lineColor = drawnRoute.directionList[0]?.lineColor;

                    drawnRoute.patternPaths.forEach((path) => {
                        path.patternPoints.forEach((point) => {
                            coords.push({
                                latitude: point.latitude,
                                longitude: point.longitude
                            })
                        })
                    })

                    return (
                        <Polyline key={drawnRoute.key} coordinates={coords} strokeColor={lineColor} strokeWidth={6} onPress={() => selectRoute(drawnRoute)}/>
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
                                    tracksViewChanges={false}
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
                                        stop={patternPoint.stop}
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
                {selectedRoute && buses.map((bus) => {
                    const color = selectedRoute.directionList[0]?.lineColor ?? "#500000"
                    return (
                        <Marker
                            key={bus.key}
                            coordinate={{ latitude: bus.location.latitude, longitude: bus.location.longitude }}
                        >
                            {/* Bus Icon on Map*/}
                            <BusMapIcon color={color} borderColor={getLighterColor(color)} heading={bus.location.heading} />
                            <BusCallout bus={bus} tintColor={selectedRoute!.directionList[0]?.lineColor ?? "#500000"} routeName={selectedRoute!.shortName} />
                        </Marker>
                    )
                })}
            </MapView>

            <TouchableOpacity style={{ top: 60, alignContent: 'center', justifyContent: 'center', position: 'absolute', right: 8, overflow: 'hidden', borderRadius: 8, backgroundColor: 'white', padding: 12 }} onPress={() => recenterView()}>
                {isViewCenteredOnUser ?
                    <MaterialIcons name="my-location" size={24} color="gray" />
                    :
                    <MaterialIcons name="location-searching" size={24} color="gray" />
                }
            </TouchableOpacity>
        </>
    )
}

export default Index;