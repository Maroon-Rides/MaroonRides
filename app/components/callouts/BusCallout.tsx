import { View, Text } from 'react-native'
import React from 'react'
import { Callout } from 'react-native-maps'

export default function BusCallout({bus, tintColor, routeName}) {
  return (
    <Callout>
        <View className="w-20">
            <Text>Name: {bus.name}</Text>
            <View className={`w-10 h-7 rounded-lg mr-3 content-center justify-center`} style={{ backgroundColor: "#" + tintColor}}>
                    <Text
                        adjustsFontSizeToFit={true}
                        numberOfLines={0}
                        className="text-center font-bold text-white p-1"
                        style={{ fontSize: 24 }} // this must be used, nativewind is broken :(
                    >
                        {routeName}
                     </Text>
                </View>
        </View>
    </Callout>
  )
}