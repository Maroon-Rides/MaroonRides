import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IAmenity, IRouteDirectionTime, IStop } from "../../../utils/interfaces";
import TimeBubble from "./TimeBubble";
import useAppStore from "../../stores/useAppStore";
import AmenityRow from "./AmenityRow";

interface Props {
    stop: IStop
    directionTimes: IRouteDirectionTime
    color: string
    disabled: boolean
    amenities: IAmenity[]
}

const StopCell: React.FC<Props> = ({ stop, directionTimes, color, disabled, amenities }) => {
    const [status, setStatus] = useState('On Time');
    const presentSheet = useAppStore((state) => state.presentSheet);
    const setSelectedStop = useAppStore((state) => state.setSelectedStop);

    useEffect(() => {
        let totalDeviation = 0;

        for (const departTime of directionTimes.nextDeparts) {
            const estimatedTime = new Date(departTime.estimatedDepartTimeUtc ?? "");
            const scheduledTime = new Date(departTime.scheduledDepartTimeUtc ?? "");

            const delayLength = estimatedTime.getTime() - scheduledTime.getTime();

            if (!isNaN(delayLength)) {
                totalDeviation += delayLength;
            }
        }

        const avgDeviation = totalDeviation / directionTimes.nextDeparts.length / (1000 * 60);
        const roundedDeviation = Math.round(avgDeviation);

        if (directionTimes.directionKey === "") {
            setStatus('Loading');
        } else if (directionTimes.nextDeparts.length === 0) {
            setStatus("No times to show");
        } else if (roundedDeviation > 0) {
            setStatus(`${roundedDeviation} ${roundedDeviation > 1 ? "minutes" : "minute"} late`);
        } else if (roundedDeviation < 0) {
            setStatus(`${Math.abs(roundedDeviation)} ${Math.abs(roundedDeviation) > 1 ? "minutes" : "minute"} early`);
        } else {
            setStatus('On Time');
        }
    }, [directionTimes]);

    // when cell is tapped, open the stop timetable
    function onPress() {
        setSelectedStop(stop);
        presentSheet("stopTimetable")
    }

    return (
        <View style={{ marginTop: 8 }} >
            <View style={{ flexDirection: "row", alignContent: "flex-start"}}>
                <Text style={{ fontSize: 22, fontWeight: "bold", width: "75%"}}>{stop.name}</Text>
                <View style={{ flex: 1 }}/>
                <AmenityRow amenities={amenities} size={24} color={"gray"} style={{paddingRight: 8, alignSelf:"flex-start"}}/>
            </View>

            {status == "Loading" ?
                <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 2 }}>
                    <ActivityIndicator style={{ justifyContent: "flex-start" }} />
                    <View style={{ flex: 1 }} />
                </View>
                :
                <Text style={{ marginBottom: 12 }}>{status}</Text>
            }
            <View style={{ flexDirection: "row", alignItems: "center", marginRight: 8,  marginBottom: 8, marginTop: -4 }}>
                <FlatList
                    horizontal
                    scrollEnabled={false}
                    data={directionTimes.nextDeparts}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item: departureTime, index }) => {
                        let date;
                        let live = false;

                        if (departureTime.estimatedDepartTimeUtc) {
                            date = new Date(departureTime.estimatedDepartTimeUtc)
                            live = true;
                        } else {
                            date = new Date(departureTime.scheduledDepartTimeUtc ?? "")
                        }

                        const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'America/Chicago' })

                        // cut off the AM/PM
                        const stringTime = time.substring(0, time.length - 3);

                        return (
                            <TimeBubble key={index} time={stringTime} color={index == 0 ? color+"40" : "lightgrey"} textColor={index == 0 ? color : "black"} live={live} />
                        )
                    }}
                />

                {/* <View style={{ flex: 1 }} /> */}
                { !disabled &&
                    <TouchableOpacity 
                        style={{ 
                            alignItems: 'center',
                            flexDirection: "row",
                            paddingVertical: 4, // increase touch area
                            paddingLeft: 8, // increase touch area
                        }}
                        onPress={onPress} 
                    >
                        {/* <MaterialCommunityIcons name="clock-outline" size={20} />                 */}
                        <Text style={{fontSize: 16, textAlign: 'center', fontWeight: 'bold', marginVertical: 4, marginLeft: 4, marginRight: 2, color: color }}>
                            All
                        </Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={color} />                

                    </TouchableOpacity>
                }
            </View>
        </View>
    )
}

export default StopCell;