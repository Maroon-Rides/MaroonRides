import React, { memo, useState, useCallback } from 'react'
import { View, Text, LayoutChangeEvent } from 'react-native'
import { Callout } from 'react-native-maps'
import BusIcon from '../ui/BusIcon'
import { IDirection, IMapRoute, IStop } from '../../../utils/interfaces'
import { useStopEstimate } from 'app/data/api_query'
import moment from 'moment'
import CalloutTimeBubble from '../ui/CalloutTimeBubble'
import { lightMode } from 'app/theme'

interface Props {
  stop: IStop
  tintColor: string
  route: IMapRoute
  direction: IDirection
}

// Stop callout with time bubbles
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
                justifyContent: 'center',
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

                { estimate?.routeDirectionTimes[0]?.nextDeparts.length !== 0 &&
                    <View style={{
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                        alignSelf: "flex-start",
                        marginTop: 8
                    }}>
                        { estimate?.routeDirectionTimes[0]?.nextDeparts.map((departureTime, index) => {
                            const date = moment(departureTime.estimatedDepartTimeUtc ?? departureTime.scheduledDepartTimeUtc ?? "");
                            const relative = date.diff(moment(), "minutes");
                            return (
                                    <CalloutTimeBubble
                                        key={index}
                                        time={relative <= 0 ? "Now" : relative.toString() + " min"}
                                        color={index == 0 ? tintColor + "60" : lightMode.nextStopBubble}
                                        textColor={index == 0 ? tintColor : lightMode.text}
                                        live={departureTime.estimatedDepartTimeUtc == null ? false : true}
                                    />
                            )
                        })}
                    </View>
                }
            </View>
        </Callout>
    )
}

export default memo(StopCallout);