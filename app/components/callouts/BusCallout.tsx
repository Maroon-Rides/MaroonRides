import { View, Text } from 'react-native'
import React from 'react'
import { Callout } from 'react-native-maps'

export default function BusCallout({bus}) {
  return (
    <Callout>
        <View className="w-20">
            <Text>Name: {bus.name}</Text>
        </View>
    </Callout>
  )
}