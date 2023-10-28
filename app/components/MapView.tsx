import React, { useEffect, useRef, useState } from "react";
import MapView, {LatLng, Polyline, Marker, Callout} from 'react-native-maps';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { styled } from 'nativewind';
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { getRouteBuses } from "aggie-spirit-api";

const StyledMapView = styled(MapView);

function Index({ drawnRoutes }) {
    var mapViewRef: any;

    // given a hex code without the #, return a lighter version of it
    function getLighterColor(color: string) {
        var r = parseInt(color.substring(0, 2), 16);
        var g = parseInt(color.substring(2, 4), 16);
        var b = parseInt(color.substring(4, 6), 16);

        r = Math.round(r + 100);
        g = Math.round(g + 100);
        b = Math.round(b + 100);

        r = Math.min(r, 255);
        g = Math.min(g, 255);
        b = Math.min(b, 255);

        return r.toString(16) + g.toString(16) + b.toString(16);
    }

    var [buses, setBuses] = useState([])
    var updateBusesInterval = useRef(null);

    function updateBuses(routeName: string) {
        (async () => {
            var data = await getRouteBuses(routeName)
            // var data = [
            //     {location: {heading: 49.400001525878906, lastGpsDate: "2023-10-27T21:54:48-05:00", latitude: 30.614744000000005, longitude: -96.33809199999999, speed: 0}}
            // ]
            setBuses(data)
        })();
    }

    function getRotationProp(bearing: number) {
        return {transform: 
            [{rotate: bearing === undefined ? '0deg' : `${Math.round(bearing)}deg`}]
        }
    }

    async function recenterView() {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            return;
        }

        let location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 2
        });

        if (!mapViewRef) {
            return;
        }

        mapViewRef.animateToRegion({
            latitude: location.coords.latitude, 
            longitude: location.coords.longitude, 
            latitudeDelta: 0.02, 
            longitudeDelta: 0.02 
        }, 250);
    }
    
    useEffect(() => {
        var coords: LatLng[] = []
        drawnRoutes.forEach((route) => {
                
            route.routeInfo.patternPaths.forEach((path) => {
                path.patternPoints.forEach((point: {latitude: number, longitude: number}) => {
                    coords.push({
                        latitude: point.latitude,
                        longitude: point.longitude
                    })
                })
            })
        })

        mapViewRef.fitToCoordinates(coords, {
            edgePadding: {
                top: 50,
                right: 20 ,
                bottom: 300,
                left: 20
            },
            animated: true
        })

        // if we are only showing 1 bus, update it every 2 seconds
        if (drawnRoutes.length == 1) {
            // update the buses
            updateBuses(drawnRoutes[0].shortName)
            
            updateBusesInterval.current = setInterval(async () => {
                updateBuses(drawnRoutes[0].shortName)
            }, 5000)
        } else {
            clearInterval(updateBusesInterval.current)
            setBuses([])
        }

        // Cleanup when view is unloaded (app is closed)
        return () => {
            clearInterval(updateBusesInterval.current)
        }
    }, [drawnRoutes]);

    


    return (
        <StyledMapView 
            showsUserLocation={true}
            className='w-full h-full'
            ref = {(mapView) => { mapViewRef = mapView; }}
        >
            <SafeAreaInsetsContext.Consumer>
                {(insets) => ( 
                    <TouchableOpacity className="content-center justify-center absolute right-4 bg-white p-2.5 overflow-hidden rounded-lg" style={{top: insets!.top + 16}} onPress={() => recenterView()}>
                        <Ionicons 
                            name="navigate" 
                            size={24} 
                            color="gray" 
                        />
                    </TouchableOpacity>
                )}
            </SafeAreaInsetsContext.Consumer>

            {/* Route Polylines */}
            {drawnRoutes.map(function(drawnRoute) {

                var coords: LatLng[] = []
                
                drawnRoute.routeInfo.patternPaths.forEach((path) => {
                    path.patternPoints.forEach((point) => {
                        coords.push({
                            latitude: point.latitude,
                            longitude: point.longitude
                        })
                    })
                })

                return (
                    <Polyline
                      key={drawnRoute.key}
                      coordinates={coords}
                      strokeColor={"#" + drawnRoute.routeInfo.color} // fallback for when `strokeColors` is not supported by the map-provider
                      strokeWidth={6}
                    />
                )
            })}

            {/* Single Route Stops */}
            { drawnRoutes.length == 1 ? (
                drawnRoutes[0].routeInfo.patternPaths.map((path) => {
                    return path.patternPoints.map((point) => {
                        if (point.isStop) {
                            return (
                                <Marker
                                    key={point.key}
                                    coordinate={{
                                        latitude: point.latitude,
                                        longitude: point.longitude
                                    }}
                                    pinColor={point.isTimePoint ? "green" : "red"}
                                >
                                    {point.isTimePoint ? (
                                        <View className="w-4 h-4 border-2" style={{backgroundColor: "#" + drawnRoutes[0].routeInfo.color, borderColor: "#" + getLighterColor(drawnRoutes[0].routeInfo.color)}}/>
                                    ) : (
                                        <View className="w-4 h-4 rounded-full border-2" style={{backgroundColor: "#" + drawnRoutes[0].routeInfo.color, borderColor: "#" + getLighterColor(drawnRoutes[0].routeInfo.color)}}/>
                                    )}
                                    <Callout>
                                        <View className="w-20">
                                            <Text className="font-bold text-m">{point.name}</Text>
                                            <Text>{point.description}</Text>
                                        </View>
                                    </Callout>
                                </Marker>
                            )
                        }
                    })
                })
            ) : null
            }

            {/* Buses */}
            {buses.map((bus) => {
                console.log(bus.location)
                return (
                    <Marker.Animated 
                    flat
                    key={bus.key} 
                    coordinate={{latitude: bus.location.latitude, longitude: bus.location.longitude}}
                    style={getRotationProp(bus.location.heading)}
                    >
                        <MaterialIcons
                            name="assistant-navigation"
                            size={32}
                            color={"red"}
                        />

                    </Marker.Animated>
                )
            })}
        </StyledMapView>
    )
}

export default Index;