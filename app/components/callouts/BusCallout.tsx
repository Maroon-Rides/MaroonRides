import { View, Text } from 'react-native'
import React from 'react'
import { Callout } from 'react-native-maps'
import BusIcon from '../BusIcon'
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { IAmmentity } from 'utils/interfaces';

export default function BusCallout({bus, tintColor, routeName}) {
  return (
    <Callout>
        <View className="w-40">
          <View className="flex-row justify-center items-center mb-1">
            <BusIcon name={routeName} color={tintColor} sizing="w-10 h-6" textSize={18}/>
            <View className="flex-1"/>

            {
              bus.amenities.map((amenity: IAmmentity) => {
                switch (amenity.name) {
                  case "Air Conditioning":
                    return <Ionicons name="snow" size={18} color="gray" style={{paddingLeft: 4}} key="ac"/>
                  case "Wheelchair Lift":
                    return <MaterialCommunityIcons name="wheelchair-accessibility" size={18} color="gray" style={{paddingLeft: 4}} key="wheelchair"/>
                  default:
                    return null
                }
              })
            }
            { bus.vehicleType == "Proterra" ? <MaterialCommunityIcons name="battery-charging-high" size={18} color="gray" style={{paddingLeft: 4}}/> : null}
          </View>
          <Text className='text-m'>
            <Text className="font-bold">Next Stop:</Text>
            <Text> {bus.nextStopDeparture.stopName}  </Text>
          </Text>
          <Text className="font-bold text-gray-500 text-xs"> {bus.passengerLoad}% full</Text>
        </View>
    </Callout>
  )
}