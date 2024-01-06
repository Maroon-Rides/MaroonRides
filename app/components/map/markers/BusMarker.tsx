import React from 'react';
import { Marker } from 'react-native-maps';
import BusMapIcon from '../BusMapIcon';
import BusCallout from '../BusCallout';
import { getLighterColor } from '../../../utils';

interface Props {
    bus: any,
    tintColor: string,
    routeName: string
}

const BusMarker: React.FC<Props> = ({ bus, tintColor, routeName }) => {
    return (
        <Marker
            key={bus.key}
            coordinate={{ latitude: bus.location.latitude, longitude: bus.location.longitude }}
        >
            {/* Bus Icon on Map*/}
            <BusMapIcon color={tintColor} borderColor={getLighterColor(tintColor)} heading={bus.location.heading} />
            <BusCallout bus={bus} tintColor={tintColor ?? "#500000"} routeName={routeName} />
        </Marker>
    );
};

export default BusMarker;
