import React, { useEffect, useState, memo } from 'react'
import { View, Text, Platform } from 'react-native'
import { Callout } from 'react-native-maps'

import useAppStore from '../../stores/useAppStore'
import { IGetNextDepartTimesResponse } from '../../../utils/interfaces'
import AmenityRow from "../ui/AmenityRow";

interface Props {
    stopName: string
    stopCode: string
    routeName: string
    tintColor: string
}

const StopCallout: React.FC<Props> = ({ stopName, stopCode, tintColor, routeName}) => {
    const [contentSize, setContentSizing] = useState([100, 15]);

    const [estimate, setEstimate] = useState<IGetNextDepartTimesResponse | null>(null);
    const stopEstimates = useAppStore((state) => state.stopEstimates);

    useEffect(() => {
        stopEstimates.forEach((stopEstimate) => {
            if (stopEstimate.stopCode === stopCode) {
                setEstimate(stopEstimate.departureTimes);
            }
        })
    }, [stopEstimates])

    // TODO: show amenities
    return (
        <Callout style={{ alignItems: 'center', width: contentSize[0], height: contentSize[1], minWidth: 95, minHeight: Platform.OS === 'android' ? 40 : 1 }} >
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", alignSelf: "flex-start", paddingTop: Platform.OS === 'android' ? 8 : 0 }} onLayout={(event) => { setContentSizing([event.nativeEvent.layout.width, event.nativeEvent.layout.height]) }} >
                <View style={{ backgroundColor: tintColor, borderRadius: 6, alignItems: 'center', justifyContent: "center", width: 40, height: 24, marginRight: 8 }}>
                    <Text adjustsFontSizeToFit={true} style={{ fontSize: 18, textAlign: 'center', fontWeight: 'bold', color: 'white', padding: 4 }}>
                        {routeName}
                    </Text>
                </View>
                <Text style={{ maxWidth: 200, fontWeight: 'bold' }} numberOfLines={1}>{stopName + " "}</Text>
                <AmenityRow amenities={estimate?.amenities} size={18} color={"gray"} style={{paddingRight: 3, alignSelf:"flex-start"}}/>
            </View>
        </Callout>
    )
}

export default memo(StopCallout);