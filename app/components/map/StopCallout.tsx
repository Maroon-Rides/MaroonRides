import React, { memo, useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { Callout } from 'react-native-maps'
import BusIcon from '../ui/BusIcon'
import useAppStore from '../../stores/useAppStore'
import { IGetNextDepartTimesResponse, IStop } from '../../../utils/interfaces'
import AmenityRow from "../ui/AmenityRow";

interface Props {
    stop: IStop
    tintColor: string
    routeName: string
}

// Stop callout with amentities
const StopCallout: React.FC<Props> = ({ stop, tintColor, routeName}) => {
    const stopEstimates = useAppStore((state) => state.stopEstimates);
    
    // Calculate size of callout based on the contentSize
    const [contentSize, setContentSizing] = useState([100, 15]);
    const [nextDepartTimes, setNextDepartTimes] = useState<IGetNextDepartTimesResponse | null>(null);

    // Loop through global stopEstimates, find the current stop and set the nextDepartTimes
    useEffect(() => {
        stopEstimates.forEach((stopEstimate) => {
            if (stopEstimate.stopCode === stop.stopCode) {
                setNextDepartTimes(stopEstimate.departureTimes);
            }
        })
    }, [stopEstimates])

    return (
        <Callout style={{alignItems: 'center', width: contentSize[0], height: contentSize[1]}}>
            <View  onLayout={(event) => { setContentSizing([event.nativeEvent.layout.width, event.nativeEvent.layout.height]) }} >
                <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", alignSelf: "flex-start"}}  >
                    <BusIcon name={routeName} color={tintColor} isCallout={true} style={{ marginRight: 8 }} />
                    <Text style={{ maxWidth: 200, fontWeight: 'bold' }} numberOfLines={1}>{stop.name}</Text>
                </View>

                <AmenityRow amenities={nextDepartTimes?.amenities ?? []} color='grey' size={20} style={{marginTop: 4}}/>
            </View>
        </Callout>
    )
}

export default memo(StopCallout);