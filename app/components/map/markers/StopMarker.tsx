import React, { memo, useEffect } from 'react';
import { MapMarker, Marker } from 'react-native-maps';
import { IMapRoute, IPatternPoint } from 'utils/interfaces';
import StopCallout from '../StopCallout';
import { View } from 'react-native';
import { getLighterColor } from 'app/utils';

import useAppStore from '../../../data/app_state';

interface Props {
    point: IPatternPoint
    tintColor: string
    route: IMapRoute
    direction: string
    isCalloutShown?: boolean
    active: boolean
}

// Stop marker with callout
const StopMarker: React.FC<Props> = ({ point, tintColor, route, direction, isCalloutShown=false, active }) => {
    const markerRef = React.useRef<MapMarker>(null);
    const setSelectedDirection = useAppStore(state => state.setSelectedRouteDirection);

    // If the global poppedUpStopCallout is the same as the current stop, show the callout on screen
    useEffect(() => {
        if (isCalloutShown) {
            markerRef.current?.showCallout();
        }
    }, [isCalloutShown])

    const defaultDirection = () => {
        if (active == false) {
            setSelectedDirection(direction);
        }
    }

    return (
        <Marker
            ref={markerRef}
            coordinate={{
                latitude: point.latitude,
                longitude: point.longitude
            }}
            tracksViewChanges={false}
            anchor={{x: 1, y: 1}}
            pointerEvents="auto"
            onPress={() => defaultDirection()}
        >
            <View
                style={{
                    width: 16,
                    height: 16,
                    borderWidth: 2,
                    borderRadius: 9999,
                    backgroundColor: active ? tintColor : tintColor + "60",
                    borderColor: active ? getLighterColor(tintColor) : getLighterColor(tintColor) + "60",
                    zIndex: active ? 700 : 400,
                    elevation: active ? 700 : 400,
                }}
            />
            <StopCallout
                stop={point.stop!}
                tintColor={tintColor}
                route={route}
                direction={direction}
            />
        </Marker>
    );
};

export default memo(StopMarker);
