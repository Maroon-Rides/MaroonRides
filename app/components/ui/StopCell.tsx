import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GetNextDepartTimesResponseSchema, IAmenity, IRouteDirectionTime, IStop } from "../../../utils/interfaces";
import TimeBubble from "./TimeBubble";
import useAppStore from "../../stores/useAppStore";
import AmenityRow from "./AmenityRow";
import moment from "moment";
import { getNextDepartureTimes } from "aggie-spirit-api";

interface Props {
    stop: IStop
    directionTimes: IRouteDirectionTime
    color: string
    disabled: boolean
    amenities: IAmenity[],
    setSheetPos: (pos: number) => void
}

const StopCell: React.FC<Props> = ({ stop, directionTimes, color, disabled, amenities, setSheetPos }) => {
    const authToken = useAppStore(state => state.authToken);

    const [status, setStatus] = useState('On Time');
    const presentSheet = useAppStore((state) => state.presentSheet);
    const setSelectedStop = useAppStore((state) => state.setSelectedStop);
    const selectedRoute = useAppStore((state) => state.selectedRoute);
    const zoomToStopLatLng = useAppStore((state) => state.zoomToStopLatLng);
    const setPoppedUpStopCallout = useAppStore((state) => state.setPoppedUpStopCallout);

    const stopEstimates = useAppStore((state) => state.stopEstimates);
    const updateStopEstimate = useAppStore(state => state.updateStopEstimate);

    useEffect(() => {
        let totalDeviation = 0;

        for (const departTime of directionTimes.nextDeparts) {
            const estimatedTime = moment(departTime.estimatedDepartTimeUtc ?? "");
            const scheduledTime = moment(departTime.scheduledDepartTimeUtc ?? "");

            const delayLength = estimatedTime.diff(scheduledTime, "seconds");

            if (!isNaN(delayLength)) {
                totalDeviation += delayLength;
            }
        }

        const avgDeviation = totalDeviation / directionTimes.nextDeparts.length / (60);
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
    }, [directionTimes, stopEstimates]);

    // when cell is tapped, open the stop timetable
    function toTimetable() {
        setSelectedStop(stop);
        presentSheet("stopTimetable")
    }

    function zoomToStop() {
        // find the gps coordinates of the stop
        selectedRoute?.patternPaths.forEach((path) => {
            const point = path.patternPoints.find((point) => point.stop?.stopCode === stop.stopCode);
            if (point) {
                setSheetPos(1);
                zoomToStopLatLng(point.latitude, point.longitude);
                setTimeout(() => setPoppedUpStopCallout(stop), 300);
            }
        })
    }

    // Refresh the eta every minute
    useEffect(() => {
        const intervalId = setInterval(async () => {
            if (!selectedRoute || !authToken) return;

            try {
                const directionKeys = selectedRoute?.patternPaths.map(direction => direction.directionKey);

                const response = await getNextDepartureTimes(selectedRoute?.key, directionKeys, stop.stopCode, authToken);

                GetNextDepartTimesResponseSchema.parse(response);

                updateStopEstimate(response, response.stopCode);
            } catch (error) {
                console.error(error);

                Alert.alert("Something went wrong", "Some features may not work correctly. Please try again later.");
            }
        }, 30000);

        return () => {
            clearInterval(intervalId);
        };
    }, []);

    return (
        <TouchableOpacity style={{ marginTop: 8 }} onPress={zoomToStop}>
            <View style={{ flexDirection: "row", alignContent: "flex-start" }}>
                <Text style={{ fontSize: 22, fontWeight: "bold", width: "75%" }}>{stop.name}</Text>
                <View style={{ flex: 1 }} />
                <AmenityRow amenities={amenities} size={24} color={"gray"} style={{ paddingRight: 16, alignSelf: "flex-start" }} />
            </View>

            {status == "Loading" ?
                <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 2 }}>
                    <ActivityIndicator style={{ justifyContent: "flex-start" }} />
                    <View style={{ flex: 1 }} />
                </View>
                :
                <Text style={{ marginBottom: 12, marginTop: 4 }}>{status}</Text>
            }
            <View style={{ flexDirection: "row", alignItems: "center", marginRight: 8, marginBottom: 8, marginTop: -4 }}>
                <FlatList
                    horizontal
                    scrollEnabled={false}
                    data={directionTimes.nextDeparts}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item: departureTime, index }) => {
                        const date = moment(departureTime.estimatedDepartTimeUtc ?? departureTime.scheduledDepartTimeUtc ?? "");
                        const relative = date.diff(moment(), "minutes");
                        return (
                            <TimeBubble
                                key={index}
                                time={relative <= 0 ? "Now" : relative.toString() + " min"}
                                color={index == 0 ? color + "40" : "lightgrey"}
                                textColor={index == 0 ? color : "black"}
                                live={departureTime.estimatedDepartTimeUtc == null ? false : true}
                            />
                        )
                    }}
                />

                {/* <View style={{ flex: 1 }} /> */}
                {!disabled &&
                    <TouchableOpacity
                        style={{
                            alignItems: 'center',
                            flexDirection: "row",
                            paddingVertical: 4, // increase touch area
                            paddingLeft: 8, // increase touch area
                        }}
                        onPress={toTimetable}
                    >
                        {/* <MaterialCommunityIcons name="clock-outline" size={20} />                 */}
                        <Text style={{ fontSize: 16, textAlign: 'center', fontWeight: 'bold', marginVertical: 4, marginLeft: 4, marginRight: 2, color: color }}>
                            All
                        </Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={color} />

                    </TouchableOpacity>
                }
            </View>
        </TouchableOpacity>
    )
}

export default StopCell;