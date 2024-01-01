import React from 'react'
import { View, Text } from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Callout } from 'react-native-maps'

import BusIcon from '../ui/BusIcon'
import { IAmmentity, IBus } from 'utils/interfaces';
interface Props {
  bus: IBus
  tintColor: string
  routeName: string
}

const BusCallout: React.FC<Props> = ({ bus, tintColor, routeName }) => {
  return (
    <Callout>
        <View style={{ width: 160 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
            <BusIcon name={routeName} color={tintColor} isCallout={true} style={{ marginRight: 8 }}/>
            <View style={{ flex: 1 }}/>
            { bus.amenities.map((amenity: IAmmentity, index) => (
                amenity.name == "Air Conditioning" ? (<Ionicons key={index} name="snow" size={18} color="gray" style={{ paddingLeft: 4 }} />) : (<MaterialCommunityIcons key={index} name="wheelchair-accessibility" size={18} color="gray" style={{ paddingLeft: 4 }} />)
              ))
            }
            { bus.vehicleType == "Proterra" ? <MaterialCommunityIcons name="battery-charging-high" size={18} color="gray" style={{ paddingLeft: 4 }}/> : null}
          </View>
          <Text style={{ fontSize: 14 }} >
            <Text style={{ fontWeight: 'bold' }} >Next Stop:</Text>
            <Text> {bus.nextStopDeparture?.stopName}  </Text>
          </Text>
          <Text style={{ fontWeight: 'bold', color: '#6B7280', fontSize: 10, lineHeight: 16 }}> {bus.passengerLoad}% full</Text>
        </View>
    </Callout>
  )
}

export default BusCallout;