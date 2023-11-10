import React, { useEffect, useRef, useState } from "react";
import MapView, {LatLng, Polyline, Marker} from 'react-native-maps';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';
import { styled } from 'nativewind';
import { TouchableOpacity, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { getRouteBuses } from "aggie-spirit-api";
import StopCallout from "./callouts/StopCallout";
import BusCallout from "./callouts/BusCallout";

import { IBusRoute } from "utils/interfaces";
import BusIcon from "./BusIcon";

const StyledMapView = styled(MapView);

interface Props {
    drawnRoutes: IBusRoute[]
}

const Index: React.FC<Props> = ({ drawnRoutes }) => {
    let mapViewRef: any;

    // given a hex code without the #, return a lighter version of it
    function getLighterColor(color: string) {
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
    
        return lightenedColor;
    }

    const [buses, setBuses] = useState<any[]>([])
    const updateBusesInterval = useRef<any>(null); // must be a ref to be able to stop the update if the app reloads

    function updateBuses(routeName: string) {
        (async () => {
            const data = await getRouteBuses(routeName)
            
            if (drawnRoutes.length == 1) {
                setBuses(data)
            }
        })();
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
        const coords: LatLng[] = []
        drawnRoutes.forEach((route: any) => {
                
            route.routeInfo.patternPaths.forEach((path: any) => {
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
            updateBuses(drawnRoutes[0]!.shortName)

            updateBusesInterval.current = setInterval(async () => {
                updateBuses(drawnRoutes[0]!.shortName)
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
            ref={(mapView) => { mapViewRef = mapView; }}
            // compassOffset={{x: -2, y:65}}
            rotateEnabled={false}
        >
            <SafeAreaInsetsContext.Consumer>
                {(insets) => ( 
                    <TouchableOpacity className="content-center justify-center absolute right-2 bg-white p-2.5 overflow-hidden rounded-lg" style={{top: insets!.top + 16}} onPress={() => recenterView()}>
                        <Ionicons 
                            name="navigate" 
                            size={24} 
                            color="gray" 
                        />
                    </TouchableOpacity>
                )}
            </SafeAreaInsetsContext.Consumer>

            {/* Route Polylines */}
            {drawnRoutes.map(function(drawnRoute: any) {

                var coords: LatLng[] = []
                
                drawnRoute.routeInfo.patternPaths.forEach((path: any) => {
                    path.patternPoints.forEach((point: any) => {
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
                drawnRoutes[0]!.routeInfo.patternPaths.map((path) => {
                    return path.patternPoints.map((point) => {
                        if (point.isStop) {
                            return (
                                <Marker
                                    key={point.key}
                                    coordinate={{
                                        latitude: point.latitude,
                                        longitude: point.longitude
                                    }}
                                >
                                    {point.isTimePoint ? (
                                        // Time point icon
                                        <View className="w-4 h-4 border-2" style={{backgroundColor: "#" + drawnRoutes[0]!.routeInfo.color, borderColor: "#" + getLighterColor(drawnRoutes[0]!.routeInfo.color)}}/>
                                    ) : (
                                        // non time point icon
                                        <View className="w-4 h-4 rounded-full border-2" style={{backgroundColor: "#" + drawnRoutes[0]!.routeInfo.color, borderColor: "#" + getLighterColor(drawnRoutes[0]!.routeInfo.color)}}/>
                                    )}
                                        
                                    <StopCallout stop={point} tintColor={drawnRoutes[0]!.routeInfo.color} routeName={drawnRoutes[0]!.shortName}/>
                                </Marker>
                            )
                        }
                    })
                })
            ) : null
            }

            {/* Buses */}
            {buses.map((bus) => {
                return (
                    <Marker 
                    key={bus.key} 
                    coordinate={{latitude: bus.location.latitude, longitude: bus.location.longitude}}
                    >
                        {/* Bus Icon on Map*/}
                        <BusIcon color={drawnRoutes[0]!.routeInfo.color} heading={bus.location.heading}/>
                        <BusCallout bus={bus} tintColor={drawnRoutes[0]!.routeInfo.color} routeName={drawnRoutes[0]!.shortName}/>
                    </Marker>
                )
            })}
        </StyledMapView>
    )
}

export default Index;