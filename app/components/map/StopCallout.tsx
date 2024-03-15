import React, { memo } from 'react'
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native'
import { Callout } from 'react-native-maps'
import BusIcon from '../ui/BusIcon'
import { IDirection, IMapRoute, IStop } from '../../../utils/interfaces'
import { useStopEstimate } from 'app/data/api_query'
import moment from 'moment'
import CalloutTimeBubble from '../ui/CalloutTimeBubble'
import { lightMode } from 'app/theme'
import AmenityRow from '../ui/AmenityRow'
import useAppStore from 'app/data/app_state'

interface Props {
  stop: IStop
  tintColor: string
  route: IMapRoute
  direction: IDirection
}

// Stop callout with time bubbles
const StopCallout: React.FC<Props> = ({ stop, tintColor, route, direction }) => {

    const scrollToStop = useAppStore(state => state.scrollToStop);

    const { data: estimate, isLoading } = useStopEstimate(route.key, direction.key, stop.stopCode);

    return (
        <Callout
            style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 215,
                height: 50,
                zIndex: 1000,
                elevation: 1000
            }}
        >
            <View>
                <TouchableOpacity 
                    style={{ 
                        flexDirection: "row", 
                        justifyContent: "center", 
                        alignItems: "center", 
                        alignSelf: "flex-start" 
                    }} 
                    onPress={() => { scrollToStop(stop) }}
                >
                    <BusIcon name={route.shortName} color={tintColor} isCallout={true} style={{ marginRight: 8 }} />
                    <Text style={{ flex: 1, fontWeight: 'bold' }} numberOfLines={1}>{stop.name}</Text>
                    <AmenityRow amenities={estimate?.amenities || []} color={lightMode.subtitle} size={18}/>
                </TouchableOpacity>

                { estimate?.routeDirectionTimes[0]?.nextDeparts.length !== 0 ?
                    <View style={{
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                        alignSelf: "flex-start",
                        marginTop: 8
                    }}>
                        <View style={{flex: 1}} />
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
                        <View style={{flex: 1}} />
                    </View>
                  : ( isLoading ?
                    <ActivityIndicator style={{ marginTop: 8 }} />
                  :
                    <Text style={{ marginTop: 8, alignSelf: "center", color: lightMode.subtitle }}>No upcoming departures</Text>
                  )
                }
            </View>
        </Callout>
    )
}

export default memo(StopCallout);