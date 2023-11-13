import { View, Text } from 'react-native'
import React from 'react'
import { Callout } from 'react-native-maps'
import BusIcon from '../BusIcon'

export default function BusCallout({bus, tintColor, routeName}) {
  return (
    <Callout>
        <View className="w-20">
            <Text>Name: {bus.name}</Text>
            <BusIcon name={routeName} color={tintColor} sizing="w-10 h-6" textSize={18}/>
        </View>
    </Callout>
  )
}