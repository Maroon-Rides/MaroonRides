import React, { memo, useState, useCallback } from 'react'
import { View, Text, LayoutChangeEvent } from 'react-native'
import { Callout } from 'react-native-maps'
import BusIcon from '../ui/BusIcon'
import { IDirection, IMapRoute, IStop } from '../../../utils/interfaces'
import AmenityRow from "../ui/AmenityRow";
import { useStopEstimate } from 'app/stores/api_query'

interface Props {
    stop: IStop
    tintColor: string
    route: IMapRoute
    direction: IDirection
}

// Stop callout with amentities
const StopCallout: React.FC<Props> = ({ stop, tintColor, route, direction }) => {

    // Calculate size of callout based on the contentSize
    const [contentSize, setContentSize] = useState([100, 15]);

    const { data: estimate } = useStopEstimate(route.key, direction.key, stop.stopCode);

    const handleLayout = useCallback((event: LayoutChangeEvent) => {        
        const { width, height } = event.nativeEvent.layout;

        setContentSize([width, height]);
    }, [setContentSize]);

    return (
        <Callout 
            style={{ 
                alignItems: 'center',
                width: contentSize[0],
                height: contentSize[1],
                zIndex: 1000,
                elevation: 1000
            }}
        >
            <View onLayout={handleLayout}>
                <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", alignSelf: "flex-start" }}  >
                    <BusIcon name={route.shortName} color={tintColor} isCallout={true} style={{ marginRight: 8 }} />
                    <Text style={{ maxWidth: 200, fontWeight: 'bold' }} numberOfLines={1}>{stop.name}</Text>
                </View>

                <AmenityRow amenities={estimate?.amenities ?? []} color="gray" size={20} style={{ marginTop: 4 }} />
            </View>
        </Callout>
    )
}

export default memo(StopCallout);