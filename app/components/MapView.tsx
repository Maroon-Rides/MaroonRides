import React, { useEffect } from "react";
import MapView, {Polyline} from 'react-native-maps';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';
import { styled } from 'nativewind';
import { Text, TouchableOpacity } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

const StyledMapView = styled(MapView);

function Index({ drawnRoutes }) {
    var mapViewRef: any;

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
            latitudeDelta: 0.019075511625736397, 
            longitudeDelta: 0.011273115836317515 
        }, 250);
    }


    useEffect(() => {
        (async () => {
            recenterView()
        })();
    }, []);
    

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

            {drawnRoutes.map(function(drawnRoute) {

                var coords = []
                
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
        </StyledMapView>
    )
}

export default Index;