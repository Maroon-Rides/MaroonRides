import React from 'react'
import { View, Text } from 'react-native'
import { Callout } from 'react-native-maps'
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { IAmenity, IVehicle } from '../../../utils/interfaces';
import BusIcon from '../ui/BusIcon'
import AmenityRow from '../ui/AmenityRow';
interface Props {
  bus: IVehicle
  tintColor: string
  routeName: string
}

const BusCallout: React.FC<Props> = ({ bus, tintColor, routeName }) => {
  const calcFullPercentage = (passengersOnboard: number, passengerCapacity: number) => {
    return Math.round(passengersOnboard / passengerCapacity)
  }

  return (
    <Callout>
        <View style={{ width: 160 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
            <BusIcon name={routeName} color={tintColor} isCallout={true} />
            <View style={{ flex: 1 }}/>
            <AmenityRow amenities={bus.amenities} color={"gray"} size={20} />
          </View>
          <Text style={{ fontSize: 14 }} >
            <Text style={{ fontWeight: 'bold' }} >Direction: </Text>
            <Text>to {bus.directionName}  </Text>
          </Text>
          <Text style={{ fontWeight: 'bold', color: '#6B7280', fontSize: 10, lineHeight: 16 }}>{calcFullPercentage(bus.passengersOnboard, bus.passengerCapacity)}% full</Text>
        </View>
    </Callout>
  )
}

export default BusCallout;