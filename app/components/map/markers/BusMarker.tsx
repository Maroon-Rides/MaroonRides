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
    const selectedRouteDirection = useAppStore(state => state.selectedRouteDirection);

    const busColor = selectedRouteDirection === bus.directionKey ? tintColor : tintColor+"70";
    const borderColor = selectedRouteDirection === bus.directionKey ? getLighterColor(tintColor) : undefined;
    const iconColor = selectedRouteDirection === bus.directionKey ? "white" : "#ffffffcc";

    
    return (
        <Marker
            key={bus.key}
            coordinate={{ latitude: bus.location.latitude, longitude: bus.location.longitude }}
            tracksViewChanges={false}
            anchor={{x: 1, y: 1}}
            pointerEvents="auto"
            style={{ zIndex: 1000, elevation: 1000 }}
        >
            {/* Bus Icon on Map*/}
            <BusMapIcon color={busColor} borderColor={borderColor} heading={bus.location.heading} iconColor={iconColor} />
            <BusCallout 
                directionName={bus.directionName} 
                fullPercentage={Math.round((bus.passengersOnboard / bus.passengerCapacity)*100)}
                amenities={bus.amenities} tintColor={tintColor ?? "#500000"} 
                routeName={routeName} 
                busId={bus.name}
            />
        </Marker>
    );
};

export default memo(BusMarker);
