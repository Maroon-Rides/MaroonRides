import React, { useEffect } from 'react';
import { MapMarker, Marker } from 'react-native-maps';
import { IPatternPoint } from 'utils/interfaces';
import StopCallout from '../StopCallout';
import { View } from 'react-native';
import { getLighterColor } from '../../../utils';
import useAppStore from '../../../stores/useAppStore';

interface Props {
    point: IPatternPoint,
    tintColor: string,
    shortName: string
}

// Stop marker with callout
const StopMarker: React.FC<Props> = ({ point, tintColor, shortName }) => {
    const markerRef = React.useRef<MapMarker>(null);

    // Controls which StopCallout is shown at the global level
    const poppedUpStopCallout = useAppStore((state) => state.poppedUpStopCallout);

    // If the global poppedUpStopCallout is the same as the current stop, show the callout on screen
    useEffect(() => {
        if (poppedUpStopCallout?.stopCode === point.stop?.stopCode) {
            markerRef.current?.showCallout();
        }
    }, [poppedUpStopCallout])

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

export default StopMarker;
