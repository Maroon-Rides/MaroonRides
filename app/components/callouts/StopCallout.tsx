import { View, Text } from 'react-native'
import React from 'react'
import { Callout } from 'react-native-maps'

export default function StopCallout({stop, tintColor}) {

    return (
        <Callout>
            <View className="w-20">
                <Text className="font-bold text-m">{stop.name}</Text>
                <Text>{stop.description}</Text>
            </View>
        </Callout>
    )
}