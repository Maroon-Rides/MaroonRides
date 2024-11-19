import React, { memo } from 'react'
import { View, Text, ActivityIndicator, TouchableOpacity, Platform } from 'react-native'
import { Callout } from 'react-native-maps'
import BusIcon from '../ui/BusIcon'
import { IMapRoute, IStop } from '../../../utils/interfaces'
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
  direction: string
}

// Stop callout with time bubbles
const StopCallout: React.FC<Props> = ({ stop, tintColor, route, direction }) => {

    const scrollToStop = useAppStore(state => state.scrollToStop);
    const setSelectedRouteDirection = useAppStore(state => state.setSelectedRouteDirection)

    const { data: estimate, isLoading } = useStopEstimate(route.key, direction, stop.stopCode);

    return (
        <Callout
            style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 215,
                height: Platform.OS == "android" ? 60+18 : 60,
                zIndex: 1000,
                elevation: 1000
            }}
            onPress={() => {
                setSelectedRouteDirection(direction)
                scrollToStop(stop) 
            }}
        >
            <View style={[
            Platform.OS == "android" && {
                padding: 4,
            }]}>
                <View 
                    style={{ 
                        flexDirection: "row", 
                        justifyContent: "center", 
                        alignItems: "center", 
                        alignSelf: "flex-start" 
                    }} 
                >
                    <BusIcon name={route.shortName} color={tintColor} isCallout={true} style={{ marginRight: 8 }} />
                    <Text style={{ flex: 1, fontWeight: 'bold' }} numberOfLines={2} >{stop.name}</Text>
                    <AmenityRow amenities={estimate?.amenities || []} color={lightMode.subtitle} size={18}/>
                </View>

                { isLoading ?
                    <ActivityIndicator style={{ marginTop: 8 }} />
                  : (  estimate?.routeDirectionTimes.length != 0 && estimate?.routeDirectionTimes[0]?.nextDeparts.length !== 0 ?
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
                                        color={index == 0 ? tintColor + "50" : lightMode.nextStopBubble}
                                        textColor={index == 0 ? tintColor : lightMode.text}
                                        live={departureTime.estimatedDepartTimeUtc == null ? false : true}
                                    />
                            )
                        })}
                        <View style={{flex: 1}} />
                    </View>
                  :
                    <Text style={{ marginTop: 8, alignSelf: "center", color: lightMode.subtitle, fontSize: 12 }}>No upcoming departures</Text>
                  )
                }
            </View>
        </Callout>
    )
}

export default memo(StopCallout);