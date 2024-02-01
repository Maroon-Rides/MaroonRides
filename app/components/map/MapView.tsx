import React, { useEffect, useRef, useState } from "react";
import { Dimensions, TouchableOpacity } from "react-native";
import MapView, { LatLng, Polyline, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getVehicles } from "aggie-spirit-api";
import { GetVehiclesResponseSchema, IGetVehiclesResponse, IMapRoute, IVehicle } from "../../../utils/interfaces";
import useAppStore from "../../stores/useAppStore";
import BusMarker from "./markers/BusMarker";
import StopMarker from "./markers/StopMarker";
import { getLighterColor } from "../../utils";

const Map: React.FC = () => {
    const mapViewRef = useRef<MapView>(null);

    const authToken = useAppStore((state) => state.authToken);

    const selectedRoute = useAppStore((state) => state.selectedRoute);
    const setSelectedRoute = useAppStore((state) => state.setSelectedRoute);
    const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);
    const presentSheet = useAppStore((state) => state.presentSheet);
    const drawnRoutes = useAppStore((state) => state.drawnRoutes);
    const setZoomToStopLatLng = useAppStore((state) => state.setZoomToStopLatLng);
    const selectedRouteDirection = useAppStore(state => state.selectedRouteDirection);


    const setBusRefreshInterval = useAppStore((state) => state.setBusRefreshInterval);
    const clearBusRefreshInterval = useAppStore((state) => state.clearBusRefreshInterval);

    const poppedUpStopCallout = useAppStore((state) => state.poppedUpStopCallout);

    const [isViewCenteredOnUser, setIsViewCenteredOnUser] = useState(false);

    const [buses, setBuses] = useState<IVehicle[]>([]);

    const defaultMapRegion: Region = {
        latitude: 30.6060,
        longitude: -96.3462,
        latitudeDelta: 0.10,
        longitudeDelta: 0.01
    };

    const updateBuses = async () => {
        if (!selectedRoute || !authToken) return

        let busesResponse: IGetVehiclesResponse = []
        try {
            busesResponse = await getVehicles([selectedRoute.key], authToken) as IGetVehiclesResponse;

            GetVehiclesResponseSchema.parse(busesResponse);
        } catch (error) {
            console.error(error);
            // prevent alert loop from filling screen with alerts.
            clearBusRefreshInterval();
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
        centerViewOnRoutes();

        // Handle updating buses based on the number of drawn routes
        if (drawnRoutes.length === 1 && drawnRoutes[0]?.shortName) {
            // Update the buses initially
            updateBuses();

            // Set up interval to update buses every 5 seconds
            setBusRefreshInterval(setInterval(async () => {
                await updateBuses();
            }, 5000));
        } else {
            // Clear the interval and reset the buses if there are no drawn routes or more than one
            clearBusRefreshInterval();
            setBuses([]);
        }

        // Clear the interval and reset the buses if the component unmounts
        return () => {
            clearBusRefreshInterval();
            setBuses([]);
        }
    }, [drawnRoutes]);

    // handle weird edge case where map does not pick up on the initial region
    useEffect(() => {
        mapViewRef.current?.animateToRegion(defaultMapRegion);

        setZoomToStopLatLng((lat, lng) => {
            // Animate map to the current location
            const region = {
                latitude: lat - .002,
                longitude: lng,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005
            };

            mapViewRef.current?.animateToRegion(region, 250);
        })

    }, []);



    const centerViewOnRoutes = () => {
        let coords: LatLng[] = [];

        if (selectedRoute) {
            selectedRoute.patternPaths.forEach((path) => {
                path.patternPoints.forEach((point) => {
                    coords.push({
                        latitude: point.latitude,
                        longitude: point.longitude,
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
            latitude: location.coords.latitude - .002,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01
        };

        mapViewRef.current?.animateToRegion(region, 250);

        setIsViewCenteredOnUser(true);
    }

    return (
        <>
            <MapView
                showsUserLocation={true}
                style={{ width: "100%", height: "100%" }}
                ref={mapViewRef} rotateEnabled={false}
                initialRegion={defaultMapRegion}
                onPanDrag={() => setIsViewCenteredOnUser(false)}
                showsMyLocationButton={false} // we have our own
            >
                {/* Route Polylines */}
                {drawnRoutes.map(function (drawnRoute) {
                    const coordDirections: { [directionId: string]: LatLng[]; } = {};

                    drawnRoute.patternPaths.forEach((path) => {
                        path.patternPoints.forEach((point) => {
                            coordDirections[path.directionKey] = coordDirections[path.directionKey] ?? [];

                            coordDirections[path.directionKey]!.push({
                                latitude: point.latitude,
                                longitude: point.longitude,
                            })
                        })
                    })

                    const lineColor = drawnRoute.directionList[0]?.lineColor ?? "#FFFF";
                    
                    return (
                        Object.keys(coordDirections).map((directionId) => {

                            const directionColor = directionId === selectedRouteDirection || selectedRouteDirection == null ? lineColor : lineColor + "40";
                            return (
                                <Polyline
                                    key={`${directionId}`}
                                    coordinates={coordDirections[directionId] ?? []}
                                    strokeColor={directionColor}
                                    strokeWidth={5}
                                    tappable={true}
                                    onPress={() => selectRoute(drawnRoute)}
                                />
                            )
                        })
                    ) 
                })}

                {/* Stops */}
                {selectedRoute && selectedRoute?.patternPaths.flatMap((patternPath, index1) => (
                    patternPath.patternPoints.map((patternPoint, index2) => {
                        const stop = patternPoint.stop

                        if (stop) {
                            let lineColor = selectedRoute?.directionList[0]?.lineColor ?? "#FFFF";
                            let stopBorderColor = getLighterColor(lineColor)

                            if (patternPath.directionKey !== selectedRouteDirection) {
                                stopBorderColor = lineColor + "60";
                                lineColor = lineColor + "40";
                            }

                            return (
                                <StopMarker
                                    key={`${stop.stopCode}-${index1}-${index2}`}
                                    point={patternPoint}
                                    tintColor={lineColor}
                                    borderColor={stopBorderColor}
                                    shortName={selectedRoute?.shortName ?? ""}
                                    isCalloutShown={poppedUpStopCallout?.stopCode === stop.stopCode}
                                />
                            );
                        }

                        return null;
                    })
                ))}

                {/* Buses */}
                {selectedRoute && buses.map((bus) => {
                    const color = selectedRoute.directionList[0]?.lineColor ?? "#500000"
                    return (
                        <BusMarker
                            key={bus.key}
                            bus={bus}
                            tintColor={color}
                            routeName={selectedRoute.shortName}
                        />
                    )
                })}
            </MapView>

            <TouchableOpacity 
                style={{ 
                    top: 60, 
                    alignContent: 'center', 
                    justifyContent: 'center', 
                    position: 'absolute', 
                    right: 8, 
                    overflow: 'hidden', 
                    borderRadius: 8, 
                    backgroundColor: 'white', 
                    padding: 12 
                }} 
                onPress={() => recenterView()}
            >
                {isViewCenteredOnUser ?
                    <MaterialIcons name="my-location" size={24} color="gray" />
                    :
                    <MaterialIcons name="location-searching" size={24} color="gray" />
                }
            </TouchableOpacity>
        </>
    )
}

export default Map;