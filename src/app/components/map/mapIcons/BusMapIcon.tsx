import { Bus, Direction, Route } from '@data/types';
import { getLighterColor } from '@data/utils/utils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

interface Props {
  bus: Bus;
  route: Route;
  selectedDirection: Direction | null;
}

// Bus icon thats show on map
const BusMapIcon: React.FC<Props> = ({ bus, route, selectedDirection }) => {
  // Calculate the rotation angle based on the bearing of the bus
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
  );
};

// Not memoizing this component since the bearing changes when the bus moves
export default BusMapIcon;
