import React, { memo, useEffect } from 'react';
import { MapMarker, Marker } from 'react-native-maps';
import { IPatternPoint } from 'utils/interfaces';
import StopCallout from '../StopCallout';
import { View } from 'react-native';
import { getLighterColor } from '../../../utils';

interface Props {
    point: IPatternPoint,
    tintColor: string,
    shortName: string
    isCalloutShown?: boolean
}

// Stop marker with callout
const StopMarker: React.FC<Props> = ({ point, tintColor, shortName, isCalloutShown=false }) => {
    const markerRef = React.useRef<MapMarker>(null);

    // If the global poppedUpStopCallout is the same as the current stop, show the callout on screen
    useEffect(() => {
        if (isCalloutShown) {
            markerRef.current?.showCallout();
        }
    }, [isCalloutShown])

    return (
        <Marker
            ref={markerRef}
            coordinate={{
                latitude: point.latitude,
                longitude: point.longitude
            }}
            tracksViewChanges={false}
        >
            <View
                style={{
                    width: 16,
                    height: 16,
                    borderWidth: 2,
                    borderRadius: 9999,
                    backgroundColor: tintColor,
                    borderColor: getLighterColor(tintColor),
                }}
            />
            <StopCallout
                stop={point.stop!}
                tintColor={tintColor}
                routeName={shortName ?? ""}
            />
        </Marker>
    );
};

export default memo(StopMarker);
