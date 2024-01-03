import React from 'react'
import { View, Text } from 'react-native'
import { Callout } from 'react-native-maps'
import { Amenity, Vehicle } from 'aggie-spirit-api'

import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import BusIcon from '../ui/BusIcon'

interface Props {
  bus: Vehicle
  tintColor: string
  routeName: string
}

const BusCallout: React.FC<Props> = ({ bus, tintColor, routeName }) => {
  const calcFullPercentage = (passengersOnboard: number, passengerCapacity: number) => {
    return passengersOnboard / passengerCapacity
  }

  return (
    <Callout>
        <View style={{ width: 160 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
            <BusIcon name={routeName} color={tintColor} isCallout={true} style={{ marginRight: 8 }}/>
            <View style={{ flex: 1 }}/>
            { bus.amenities.map((amenity: Amenity, index) => (
                amenity.name == "Air Conditioning" ? (<Ionicons key={index} name="snow" size={18} color="gray" style={{ paddingLeft: 4 }} />) : (<MaterialCommunityIcons key={index} name="wheelchair-accessibility" size={18} color="gray" style={{ paddingLeft: 4 }} />)
              ))
            }
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