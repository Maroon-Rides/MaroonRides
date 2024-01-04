import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { MapStop, RouteDirectionTime } from "aggie-spirit-api";

import TimeBubble from "./TimeBubble";
import useAppStore from "../../stores/useAppStore";

interface Props {
    stop: MapStop
    directionTimes: RouteDirectionTime
    color: string
    disabled: boolean
}

const StopCell: React.FC<Props> = ({ stop, directionTimes, color, disabled }) => {
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
        <TouchableOpacity style={{ marginTop: 8 }} onPress={onPress} disabled={disabled}>
            <Text style={{ fontSize: 22, fontWeight: "bold", marginRight: 32 }}>{stop.name}</Text>

            {status == "Loading" ?
                <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 2 }}>
                    <ActivityIndicator style={{ justifyContent: "flex-start" }} />
                    <View style={{ flex: 1 }} />
                </View>
                :
                <Text style={{ marginBottom: 8, marginTop: 2 }}>{status}</Text>
            }

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
                        <TimeBubble key={index} time={stringTime} color={color} live={live} />
                    )
                }}
            />
        </TouchableOpacity>
    )
}

export default StopCell;