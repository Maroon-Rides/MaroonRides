import { View, Text } from 'react-native'
import React from 'react'
import { Callout } from 'react-native-maps'

export default function StopCallout({stop, tintColor, routeName}) {
    return (
        <Callout>
            <View className="w-20">
                <BusIcon sizing = "w-12 h-10" busRoute = {stop} textSize = {18} name = {stop.shortName} color = {stop.routeInfo.color}/>
                <Text className="font-bold text-m">{stop.name}</Text>
                <Text>{stop.description}</Text>
            </View>
        </Callout>
    )
}