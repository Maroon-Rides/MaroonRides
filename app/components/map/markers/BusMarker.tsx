import React, { memo } from 'react';
import { Platform } from 'react-native';
import { Marker } from 'react-native-maps';
import { IVehicle } from 'utils/interfaces';
import useAppStore from '../../../data/app_state';
import BusCallout from '../BusCallout';
import BusMapIcon from '../mapIcons/BusMapIcon';

interface Props {
  bus: IVehicle;
  tintColor: string;
  routeName: string;
}

// Bus Marker with icon and callout
const BusMarker: React.FC<Props> = ({ bus, tintColor, routeName }) => {
  const selectedRouteDirection = useAppStore(
    (state) => state.selectedDirection,
  );
  const setSelectedDirection = useAppStore(
    (state) => state.setSelectedDirection,
  );

  //if direction is not selected and route is inactive, then call setSelectedDirection w/ parameter bus.directionKey
  const busDefaultDirection = () => {
    // TODO: fix
    // if (selectedRouteDirection !== bus.directionKey) {
    // setSelectedDirection(bus.directionKey);
    // }
  };

  return (
    <Marker
      key={bus.key}
      coordinate={{
        latitude: bus.location.latitude,
        longitude: bus.location.longitude,
      }}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 0.5 }}
      pointerEvents="auto"
      style={[
        { zIndex: 100, elevation: 100 },

        Platform.OS === 'android' && {
          width: 42,
          height: 42,
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}
      onPress={() => busDefaultDirection()}
    >
      {/* Bus Icon on Map*/}
      <BusMapIcon
        tintColor={tintColor}
        heading={bus.location.heading}
        active={true}
      // TODO: fix
      // active={
      //   selectedRouteDirection === bus.directionKey ||
      //   bus.directionKey === '00000000-0000-0000-0000-000000000000'
      // }
      />

      <BusCallout
        directionName={bus.directionName ?? ''}
        fullPercentage={Math.round(
          (bus.passengersOnboard / bus.passengerCapacity) * 100,
        )}
        amenities={bus.amenities}
        tintColor={tintColor}
        routeName={routeName}
        busId={bus.name}
        speed={bus.location.speed}
      />
    </Marker>
  );
};

export default memo(BusMarker);
