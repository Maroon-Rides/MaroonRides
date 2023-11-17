import React, { useEffect, useRef, useState } from "react";
import MapView, {LatLng, Polyline, Marker} from 'react-native-maps';
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

    const updateBusesInterval = useRef<any>(null); // must be a ref to be able to stop the update if the app reloads

    const updateBuses = async(routeName: string) => {
        const data = await getRouteBuses(routeName);

        if(drawnRoutes.length == 1) {
            setBuses(data);
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
        <MapView 
            showsUserLocation={true}
            style={{ width: "100%", height: "100%" }}
            ref={(mapView) => { mapViewRef = mapView; }}
            // compassOffset={{x: -2, y:65}}
            rotateEnabled={false}
        >
            <SafeAreaInsetsContext.Consumer>
                {(insets) => ( 
                    <TouchableOpacity style={{ top: insets!.top + 16, alignContent: 'center', justifyContent: 'center', position: 'absolute', right: 8, overflow: 'hidden', borderRadius: 8 }} onPress={() => recenterView()}>
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
                                        <View style={{ width: 16, height: 16, borderWidth: 2, backgroundColor: "#" + drawnRoutes[0]!.routeInfo.color, borderColor: "#" + getLighterColor(drawnRoutes[0]!.routeInfo.color) }}/>
                                    ) : (
                                        // non time point icon
                                        <View style={{ width: 16, height: 16, borderRadius: 9999, backgroundColor: "#" + drawnRoutes[0]!.routeInfo.color, borderColor: "#" + getLighterColor(drawnRoutes[0]!.routeInfo.color) }}/>
                                    )}
                                        
                                        <StopCallout stopName={point.name} tintColor={drawnRoutes[0]!.routeInfo.color} routeName={drawnRoutes[0]!.shortName}/>
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
                        <BusMapIcon color={drawnRoutes[0]!.routeInfo.color} heading={bus.location.heading}/>
                        <BusCallout bus={bus} tintColor={drawnRoutes[0]!.routeInfo.color} routeName={drawnRoutes[0]!.shortName}/>
                    </Marker>
                )
            })}
        </MapView>
    )
}

export default Index;