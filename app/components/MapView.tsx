import React, { useState, useEffect } from "react";
import MapView from 'react-native-maps';
import * as Location from 'expo-location';

import { styled } from 'nativewind';

const StyledMapView = styled(MapView);

const Index: React.FC = () => {
    const [location, setLocation] = useState<any>();

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                return;
            }

            let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 2
            });

            setLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.019075511625736397, longitudeDelta: 0.011273115836317515 });
        })();
    }, []);
    

    return (
        <StyledMapView 
            showsUserLocation={true}
            region={location}
            className='w-full h-full' />
    )
}

export default Index;