import useAppStore from '@data/state/app_state';
import { Bus, Route } from '@data/types';
import React, { memo } from 'react';
import { Platform } from 'react-native';
import { Marker } from 'react-native-maps';
import BusCallout from '../BusCallout';
import BusMapIcon from '../mapIcons/BusMapIcon';

interface Props {
  bus: Bus;
  route: Route;
}

// Bus Marker with icon and callout
const BusMarker: React.FC<Props> = ({ bus, route }) => {
  const selectedDirection = useAppStore((state) => state.selectedDirection);

  const setSelectedDirection = useAppStore(
    (state) => state.setSelectedDirection,
  );

  //if direction is not selected and route is inactive, then call setSelectedDirection w/ parameter bus.directionKey
  const busDefaultDirection = () => {
    if (selectedDirection?.id !== bus.direction.id) {
      setSelectedDirection(bus.direction);
    }
  };

  return (
    <Marker
      key={`bus-marker-${bus.id}`}
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
        bus={bus}
        route={route}
        selectedDirection={selectedDirection}
      />

      <BusCallout route={route} bus={bus} />
    </Marker>
  );
};

export default memo(BusMarker);
