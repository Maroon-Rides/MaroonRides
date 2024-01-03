import React, { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { Callout } from 'react-native-maps'
import { MapStop, StopEstimatesResponse } from 'aggie-spirit-api'
import BusIcon from '../ui/BusIcon'
import useAppStore from '../../stores/useAppStore'
import { CachedStopEstimate } from 'types/app'

interface Props {
    stop: MapStop
    tintColor: string
    routeName: string
}

const StopCallout: React.FC<Props> = ({ stop, tintColor, routeName }) => {
    const [contentSize, setContentSizing] = useState([0, 15]);
    const [estimate, setEstimate] = useState<StopEstimatesResponse | undefined>(undefined);
    const stopEstimates = useAppStore((state) => state.stopEstimates);

    useEffect(() => {
        stopEstimates.forEach((stopEstimate) => {
            if (stopEstimate.stopCode === stop.stopCode) {
                setEstimate(stopEstimate.stopEstimate);
            }
        })
    }, [stopEstimates])

    // TODO: show amenities
    return (
        <Callout style={{alignItems: 'center', width: contentSize[0], height: contentSize[1]}} >
            <View  style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", alignSelf: "flex-start"}}  onLayout={(event) => { setContentSizing([event.nativeEvent.layout.width, event.nativeEvent.layout.height]) }} >
                <BusIcon name={routeName} color={tintColor} isCallout={true} style={{ marginRight: 8 }} />
                <Text style={{ maxWidth: 200, fontWeight: 'bold' }} numberOfLines={1}>{stop.name} {estimate?.amenities.length}</Text>
            </View>
        </Callout>
    )
}

export default StopCallout;