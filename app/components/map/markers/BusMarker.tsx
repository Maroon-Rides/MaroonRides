import React, { memo } from 'react';
import { Marker } from 'react-native-maps';
import BusMapIcon from '../BusMapIcon';
import BusCallout from '../BusCallout';
import { getLighterColor } from '../../../utils';
import { IVehicle } from 'utils/interfaces';

import useAppStore from '../../../stores/useAppStore';

interface Props {
    bus: IVehicle,
    tintColor: string,
    routeName: string
}

// Bus Marker with icon and callout
const BusMarker: React.FC<Props> = ({ bus, tintColor, routeName }) => {
    const selectedRouteDestination = useAppStore(state => state.selectedRouteDestination);

    const busColor = selectedRouteDestination === bus.directionName ? tintColor : tintColor+"70";
    const borderColor = selectedRouteDestination === bus.directionName ? getLighterColor(tintColor) : busColor;
    const iconColor = selectedRouteDestination === bus.directionName ? "white" : "#ffffffcc";

    return (
        <Marker
            key={bus.key}
            coordinate={{ latitude: bus.location.latitude, longitude: bus.location.longitude }}
            tracksViewChanges={false}
            anchor={{x: 1, y: 1}}
            pointerEvents="auto"
        >
            {/* Bus Icon on Map*/}
            <BusMapIcon color={busColor} borderColor={borderColor} heading={bus.location.heading} iconColor={iconColor} />
            <BusCallout directionName={bus.directionName} fullPercentage={Math.round((bus.passengersOnboard / bus.passengerCapacity)*100)} amenities={bus.amenities} tintColor={tintColor ?? "#500000"} routeName={routeName} />
        </Marker>
    );
};

export default memo(BusMarker);
