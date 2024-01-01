import React, { useState } from 'react'
import { View, Text } from 'react-native'
import { Callout } from 'react-native-maps'

import BusIcon from '../ui/BusIcon'

interface Props {
    stopName: string
    tintColor: string
    routeName: string
}

const StopCallout: React.FC<Props> = ({ stopName, tintColor, routeName }) => {
    const [contentSize, setContentSizing] = useState([0, 15]);

    return (
        <Callout style={{alignItems: 'center', width: contentSize[0], height: contentSize[1]}} >
            <View  style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", alignSelf: "flex-start"}}  onLayout={(event) => { setContentSizing([event.nativeEvent.layout.width, event.nativeEvent.layout.height]) }} >
                <BusIcon name={routeName} color={tintColor} isCallout={true} style={{ marginRight: 8 }} />
                <Text style={{ maxWidth: 200, fontWeight: 'bold' }} numberOfLines={1}>{stopName} </Text>
            </View>
        </Callout>
    )
}

export default StopCallout;