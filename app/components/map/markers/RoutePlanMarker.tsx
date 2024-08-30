import React, { memo } from 'react';
import { MapMarker, Marker } from 'react-native-maps';
import { RoutePlanMapMarker } from 'utils/interfaces';
import { View } from 'react-native';
import { getLighterColor } from 'app/utils';
import useAppStore from 'app/data/app_state';

interface Props {
    marker: RoutePlanMapMarker
}

// Stop marker with callout
const RoutePlanMarker: React.FC<Props> = ({ marker }) => {
    const markerRef = React.useRef<MapMarker>(null);
    const theme = useAppStore(state => state.theme);

    return (
        <Marker
            ref={markerRef}
            coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude
            }}
            tracksViewChanges={false}
            anchor={{x: 0.5, y: 0.5}}
            pointerEvents="auto"
        >
            { marker.isOrigin ? (
                <View style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    backgroundColor: theme.myLocation,
                    borderColor: getLighterColor(theme.myLocation),
                    borderWidth: 2,
                    borderRadius: 999,
                    transform: [{ rotate: '45deg' }],
                    zIndex: 800,
                    elevation: 800
                }}>
                    {marker.icon}
                </View> 
            ) : (
                <View style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 30,
                    height: 30,
                    borderTopLeftRadius: 15,
                    borderTopRightRadius: 15,
                    borderBottomLeftRadius: 15,
                    backgroundColor: theme.error,
                    borderColor: getLighterColor(theme.error),
                    borderWidth: 2,
                    transform: [{translateY: -20}, { rotate: '45deg' }],
                    zIndex: 800,
                    elevation: 800
                }}>
                    {marker.icon}
                </View>    
            )}
        </Marker>
    );
};

export default memo(RoutePlanMarker);
