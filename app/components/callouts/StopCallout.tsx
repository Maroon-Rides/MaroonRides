import { View, Text } from 'react-native'
import React from 'react'
import { Callout } from 'react-native-maps'
import BusIcon from '../BusIcon'

export default function StopCallout({stop, tintColor, routeName}) {

    const [contentSize, setContentSizing] = React.useState([0, 15])

    return (
        <Callout style={{alignItems: 'center', width: contentSize[0], height: contentSize[1]}} >
            
            <View 
                className="flex-row justify-center items-center" 
                style={{alignSelf: "flex-start"}} 
                onLayout={(event) => { setContentSizing([event.nativeEvent.layout.width, event.nativeEvent.layout.height]) }}
            >
                <BusIcon name={routeName} color={tintColor} sizing="w-10 h-6" textSize={18}/>
                <Text maxWidth={200} className="font-bold" numberOfLines={1}>{stop.name} </Text>
            </View>

        </Callout>
    )
}