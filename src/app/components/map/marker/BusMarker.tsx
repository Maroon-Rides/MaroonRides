import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAppStore from '@lib/state/app_state';
import { Bus, Route } from '@lib/types';
import { getLighterColor } from '@lib/utils/utils';
import React, { memo } from 'react';
import { Platform, View } from 'react-native';
import { Marker } from 'react-native-maps';
import BusCallout from '../callout/BusCallout';

interface Props {
  bus: Bus;
  route: Route;
}

// Bus Marker with icon and callout
const BusMarker: React.FC<Props> = ({ bus, route }) => {
  const selectedDirection = useAppStore((state) => state.selectedDirection);

  const getRotationProp = (bearing: number | undefined) => {
    return [
      {
        rotate:
          bearing !== undefined ? `${Math.round(bearing) - 135}deg` : '0deg',
      },
    ];
  };

  const active = bus.direction.id === selectedDirection?.id;
  const borderColor = active ? getLighterColor(route.tintColor) : undefined;

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
    >
      {/* Bus Icon on Map*/}
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          width: 30,
          height: 30,
          borderTopLeftRadius: 15,
          borderTopRightRadius: 15,
          borderBottomLeftRadius: 15,
          backgroundColor: active ? route.tintColor : route.tintColor + '70',
          borderColor: borderColor,
          borderWidth: borderColor ? 2 : 0,
          transform: getRotationProp(bus.heading),
          zIndex: active ? 800 : 500,
          elevation: active ? 800 : 500,
        }}
      >
        <MaterialCommunityIcons
          name="bus"
          size={18}
          color={active ? 'white' : '#ffffffcc'}
          style={{ transform: getRotationProp(-bus.heading - 90) }}
        />
      </View>
      <BusCallout route={route} bus={bus} />
    </Marker>
  );
};

export default memo(BusMarker);
